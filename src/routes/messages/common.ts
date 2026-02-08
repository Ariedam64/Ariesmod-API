import { query } from "../../db";

export const MESSAGE_MAX_LENGTH = 1000;
export const CONNECTED_TTL_MS = 7 * 60 * 1000;

export function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildConversationId(a: string, b: string): string {
  const [userOne, userTwo] = a < b ? [a, b] : [b, a];
  return `${userOne}:${userTwo}`;
}

export async function areFriends(a: string, b: string): Promise<boolean> {
  const [userOneId, userTwoId] = a < b ? [a, b] : [b, a];
  const { rows } = await query<{ status: string }>(
    `
    select status
    from public.player_relationships
    where user_one_id = $1
      and user_two_id = $2
    limit 1
    `,
    [userOneId, userTwoId],
  );

  return rows[0]?.status === "accepted";
}

export async function isPlayerConnected(playerId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - CONNECTED_TTL_MS).toISOString();
  const { rows } = await query<{ id: string }>(
    `
    select id
    from public.players
    where id = $1
      and last_event_at >= $2
    limit 1
    `,
    [playerId, cutoff],
  );
  return !!rows[0];
}

export async function isPlayerConnectedInRoom(
  playerId: string,
  roomId: string,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - CONNECTED_TTL_MS).toISOString();
  const { rows } = await query<{ player_id: string }>(
    `
    select rp.player_id
    from public.room_players rp
    join public.players p on p.id = rp.player_id
    where rp.player_id = $1
      and rp.room_id = $2
      and rp.left_at is null
      and p.last_event_at >= $3
    limit 1
    `,
    [playerId, roomId, cutoff],
  );
  return !!rows[0];
}
