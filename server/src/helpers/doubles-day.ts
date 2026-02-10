import database from '../database/database-prod';

const DOUBLES_DAY_ROUTE_PATH = '/doubles-day';

/**
 * Returns whether the Doubles Day plugin is enabled.
 * When enabled: chore (math game) earnings are doubled, pizza time donations to the fund are doubled.
 */
export async function isDoublesDayEnabled(): Promise<boolean> {
  try {
    const row = await database.get(
      'SELECT enabled FROM plugins WHERE route_path = $1',
      [DOUBLES_DAY_ROUTE_PATH]
    );
    return !!row?.enabled;
  } catch {
    return false;
  }
}
