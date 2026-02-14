import type { Response } from "express";

type StreamConnection = {
  res: Response;
};

export type UnifiedEvent = {
  id: number;
  type: string;
  data: Record<string, any>;
  ts: string;
};

type Waiter = {
  sinceId: number;
  resolve: (events: UnifiedEvent[], lastEventId: number) => void;
};

type PlayerState = {
  nextId: number;
  events: UnifiedEvent[];
  waiters: Set<Waiter>;
};

const MAX_EVENTS = 200;
const HEARTBEAT_MS = 30000;

const states = new Map<string, PlayerState>();
const streams = new Map<string, Set<StreamConnection>>();
let heartbeatTimer: NodeJS.Timeout | null = null;

function getState(playerId: string): PlayerState {
  let state = states.get(playerId);
  if (!state) {
    state = { nextId: 1, events: [], waiters: new Set<Waiter>() };
    states.set(playerId, state);
  }
  return state;
}

function getLastId(state: PlayerState): number {
  const last = state.events[state.events.length - 1];
  return last ? last.id : 0;
}

function removeConnection(playerId: string, conn: StreamConnection): void {
  const set = streams.get(playerId);
  if (!set) return;
  set.delete(conn);
  if (set.size === 0) {
    streams.delete(playerId);
  }
}

function writeSseEvent(res: Response, event: UnifiedEvent): void {
  res.write(
    `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(
      event.data,
    )}\n\n`,
  );
}

function startHeartbeat(): void {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const [playerId, set] of streams) {
      for (const conn of set) {
        try {
          conn.res.write("event: ping\ndata: {}\n\n");
        } catch {
          removeConnection(playerId, conn);
        }
      }
    }
    if (streams.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, HEARTBEAT_MS);
}

export function addUnifiedStream(playerId: string, res: Response): void {
  const conn: StreamConnection = { res };
  const set = streams.get(playerId) ?? new Set<StreamConnection>();
  set.add(conn);
  streams.set(playerId, set);
  startHeartbeat();

  res.on("close", () => {
    removeConnection(playerId, conn);
    if (streams.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  });
}

export function getEventsSince(
  playerId: string,
  sinceId: number,
): UnifiedEvent[] {
  const state = getState(playerId);
  if (state.events.length === 0) {
    console.log(`[HUB] getEventsSince - playerId: ${playerId}, since: ${sinceId}, buffer empty`);
    return [];
  }
  const filtered = state.events.filter((event) => event.id > sinceId);
  console.log(`[HUB] getEventsSince - playerId: ${playerId}, since: ${sinceId}, bufferSize: ${state.events.length}, returning: ${filtered.length} events, eventIds: [${state.events.map(e => e.id).join(', ')}]`);
  return filtered;
}

export function getLastEventId(playerId: string): number {
  return getLastId(getState(playerId));
}

export function writeUnifiedEvents(
  res: Response,
  events: UnifiedEvent[],
): void {
  for (const event of events) {
    writeSseEvent(res, event);
  }
}

export function pushUnifiedEvent(
  playerId: string,
  type: string,
  payload: Record<string, any>,
): void {
  const state = getState(playerId);
  const record: UnifiedEvent = {
    id: state.nextId++,
    type,
    data: payload,
    ts: new Date().toISOString(),
  };

  // Buffer all events for long polling
  state.events.push(record);
  if (state.events.length > MAX_EVENTS) {
    state.events.splice(0, state.events.length - MAX_EVENTS);
  }

  console.log(`[HUB] Event buffered - playerId: ${playerId}, type: ${type}, id: ${record.id}, bufferSize: ${state.events.length}`);

  const set = streams.get(playerId);
  if (set && set.size > 0) {
    for (const conn of set) {
      try {
        writeSseEvent(conn.res, record);
      } catch {
        removeConnection(playerId, conn);
      }
    }
  }

  if (state.waiters.size > 0) {
    for (const waiter of Array.from(state.waiters)) {
      if (record.id <= waiter.sinceId) continue;
      const events = getEventsSince(playerId, waiter.sinceId);
      const lastEventId = getLastId(state);
      state.waiters.delete(waiter);
      waiter.resolve(events, lastEventId);
    }
  }
}

export function waitForEvents(
  playerId: string,
  sinceId: number,
  timeoutMs: number,
): {
  promise: Promise<{ events: UnifiedEvent[]; lastEventId: number }>;
  cancel: () => void;
} {
  const state = getState(playerId);
  let done = false;
  let timer: NodeJS.Timeout | null = null;
  let waiter: Waiter | null = null;

  const promise = new Promise<{
    events: UnifiedEvent[];
    lastEventId: number;
  }>((resolve) => {
    waiter = {
      sinceId,
      resolve: (events, lastEventId) => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        resolve({ events, lastEventId });
      },
    };

    state.waiters.add(waiter);

    timer = setTimeout(() => {
      if (done) return;
      done = true;
      if (waiter) state.waiters.delete(waiter);
      resolve({ events: [], lastEventId: getLastId(state) });
    }, timeoutMs);

    const immediate = getEventsSince(playerId, sinceId);
    if (immediate.length > 0) {
      if (waiter) state.waiters.delete(waiter);
      if (timer) clearTimeout(timer);
      done = true;
      resolve({ events: immediate, lastEventId: getLastId(state) });
    }
  });

  const cancel = () => {
    if (done) return;
    done = true;
    if (timer) clearTimeout(timer);
    if (waiter) state.waiters.delete(waiter);
  };

  return { promise, cancel };
}
