import { query } from "../db";

export async function checkMessageRateLimit(
  ip: string | null,
  playerId: string | null,
  ipLimit = 120,
  playerLimit = 30,
): Promise<boolean> {
  const { rows } = await query<{ check_message_rate_limit: boolean }>(
    `
    select public.check_message_rate_limit(
      $1::text,
      $2::text,
      $3::int,
      $4::int
    ) as check_message_rate_limit
    `,
    [ip, playerId, ipLimit, playerLimit],
  );

  const allowed = rows[0]?.check_message_rate_limit;
  return allowed !== false;
}
