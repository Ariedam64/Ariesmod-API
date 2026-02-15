import { query } from "../../db";
import { CONNECTED_TTL_MS } from "../messages/common";
import { pushUnifiedEvent } from "./hub";

type PresenceState = {
  lastEventAt: string;
  roomId: string | null;
};

const onlinePlayers = new Map<string, PresenceState>();
const SWEEP_MS = 60000; // Check every 1 minute
let sweepTimer: NodeJS.Timeout | null = null;

export async function getFriendIds(playerId: string): Promise<string[]> {
  const { rows } = await query<{ friend_id: string }>(
    `
    select
      case
        when user_one_id = $1 then user_two_id
        else user_one_id
      end as friend_id
    from public.player_relationships
    where status = 'accepted'
      and (user_one_id = $1 or user_two_id = $1)
    `,
    [playerId],
  );

  return (rows ?? [])
    .map((row) => row.friend_id)
    .filter((id) => typeof id === "string" && id.length > 0);
}

async function emitPresence(
  playerId: string,
  online: boolean,
  lastEventAt: string,
  roomId: string | null,
): Promise<void> {
  let friendIds: string[] = [];
  try {
    friendIds = await getFriendIds(playerId);
  } catch (err) {
    console.error("presence friends query error:", err);
    return;
  }

  if (friendIds.length === 0) return;

  const payload = {
    playerId,
    online,
    lastEventAt,
    roomId: online ? roomId : null,
  };

  for (const friendId of friendIds) {
    pushUnifiedEvent(friendId, "presence", payload);
  }
}

function startSweep(): void {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [playerId, state] of onlinePlayers.entries()) {
      const lastTs = Date.parse(state.lastEventAt);
      if (!Number.isFinite(lastTs)) continue;
      if (now - lastTs <= CONNECTED_TTL_MS) continue;

      onlinePlayers.delete(playerId);
      emitPresence(playerId, false, state.lastEventAt, null).catch((err) => {
        console.error("presence offline emit error:", err);
      });
    }

    if (onlinePlayers.size === 0 && sweepTimer) {
      clearInterval(sweepTimer);
      sweepTimer = null;
    }
  }, SWEEP_MS);
}

async function emitRoomChanged(
  playerId: string,
  roomId: string | null,
  previousRoomId: string | null,
): Promise<void> {
  let friendIds: string[] = [];
  try {
    friendIds = await getFriendIds(playerId);
  } catch (err) {
    console.error("room_changed friends query error:", err);
    return;
  }

  if (friendIds.length === 0) return;

  const payload = {
    playerId,
    roomId,
    previousRoomId,
  };

  for (const friendId of friendIds) {
    pushUnifiedEvent(friendId, "room_changed", payload);
  }
}

async function getPublicRoomId(
  playerId: string,
  roomId: string | null,
): Promise<string | null> {
  if (!roomId) return null;
  try {
    const result = await query<{ hide_room_from_public_list: boolean | null }>(
      `select hide_room_from_public_list from public.player_privacy where player_id = $1`,
      [playerId],
    );
    if (result.rows?.[0]?.hide_room_from_public_list === true) return null;
  } catch (err) {
    console.error("presence privacy lookup error:", err);
  }
  return roomId;
}

export async function recordPlayerOnline(
  playerId: string,
  lastEventAt: string,
  roomId: string | null,
): Promise<void> {
  const prev = onlinePlayers.get(playerId);
  const prevTs = prev ? Date.parse(prev.lastEventAt) : NaN;
  const nowTs = Date.parse(lastEventAt);
  const wasOnline =
    prev && Number.isFinite(prevTs) && Number.isFinite(nowTs)
      ? nowTs - prevTs <= CONNECTED_TTL_MS
      : !!prev;

  onlinePlayers.set(playerId, { lastEventAt, roomId });
  startSweep();

  const publicRoomId = await getPublicRoomId(playerId, roomId);

  if (!wasOnline) {
    await emitPresence(playerId, true, lastEventAt, publicRoomId);
  } else if (prev && prev.roomId !== roomId) {
    const prevPublicRoomId = await getPublicRoomId(playerId, prev.roomId);
    await emitRoomChanged(playerId, publicRoomId, prevPublicRoomId);
  }
}
