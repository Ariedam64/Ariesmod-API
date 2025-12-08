import { query } from "../db";

export async function checkRateLimit(
  ip: string | null,
  playerId: string | null,
  ipLimit = 60,
  playerLimit = 60,
): Promise<boolean> {
  const { rows } = await query<{ check_rate_limit: boolean }>(
    `
    select public.check_rate_limit(
      $1::text,
      $2::text,
      $3::int,
      $4::int
    ) as check_rate_limit
    `,
    [ip, playerId, ipLimit, playerLimit],
  );

  const allowed = rows[0]?.check_rate_limit;
  return allowed !== false;
}
