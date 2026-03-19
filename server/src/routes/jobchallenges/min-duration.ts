/**
 * Computes how many milliseconds have elapsed since the given `played_at`
 * timestamp, using the database clock for both ends (NOW() - played_at).
 *
 * This prevents issues caused by clock skew between the API server and DB.
 */
export async function getElapsedMsSincePlayedAt(database: any, playedAt: any): Promise<number> {
  const row = await database.get(
    `
      SELECT EXTRACT(EPOCH FROM (NOW() - $1::timestamp)) * 1000 as elapsed_ms
    `,
    [playedAt]
  );

  return Number(row?.elapsed_ms ?? 0);
}

