import {
  EngagementAnalytics,
  EngagementByClass,
  EngagementByStudent,
  EngagementTimeSeries,
  LowLoginStudent,
  StudentLoginRow,
} from '../types';

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(',');
}

function sectionTitle(title: string): string {
  return csvRow([title]);
}

function studentDisplayName(row: {
  username: string;
  first_name?: string;
  last_name?: string;
}): string {
  if (row.first_name?.trim() || row.last_name?.trim()) {
    return `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  }
  return row.username;
}

export function buildAnalyticsYearCsv(
  analytics: EngagementAnalytics,
  studentLogins: StudentLoginRow[]
): string {
  const lines: string[] = [];
  const startLabel = new Date(analytics.start_date).toISOString().slice(0, 10);
  const exportedAt = new Date().toISOString();

  lines.push(sectionTitle('CivicLab Analytics Export'));
  lines.push(csvRow(['exported_at', exportedAt]));
  lines.push(csvRow(['time_range', analytics.time_range]));
  lines.push(csvRow(['period_start', startLabel]));
  lines.push('');

  lines.push(sectionTitle('Summary'));
  lines.push(csvRow(['metric', 'value']));
  const s = analytics.summary;
  const summaryRows: [string, string | number][] = [
    ['total_logins', s.total_logins],
    ['total_logins_users', s.total_logins_users],
    ['total_chores_sessions', s.total_chores_sessions],
    ['total_chores_users', s.total_chores_users],
    ['total_transfers', s.total_transfers],
    ['total_transfers_users', s.total_transfers_users],
    ['total_purchases', s.total_purchases],
    ['total_purchases_users', s.total_purchases_users],
    ['total_wordle_games', s.total_wordle_games],
    ['total_wordle_earnings', s.total_wordle_earnings],
    ['total_wordle_xp', s.total_wordle_xp],
    ['total_job_challenge_sessions', s.total_job_challenge_sessions],
    ['total_job_challenge_xp', s.total_job_challenge_xp],
  ];
  summaryRows.forEach(([metric, value]) => lines.push(csvRow([metric, value])));
  lines.push('');

  lines.push(sectionTitle('Engagement over time'));
  lines.push(
    csvRow([
      'period',
      'logins',
      'chores_users',
      'chores_sessions',
      'transfers_users',
      'transfers_count',
      'purchases_users',
      'purchases_count',
    ])
  );
  analytics.time_series.forEach((row: EngagementTimeSeries) => {
    lines.push(
      csvRow([
        row.time_bucket,
        row.logins,
        row.chores_users,
        row.chores_sessions,
        row.transfers_users,
        row.transfers_count,
        row.purchases_users,
        row.purchases_count,
      ])
    );
  });
  lines.push('');

  lines.push(sectionTitle('By class'));
  lines.push(
    csvRow([
      'class',
      'town_name',
      'logins',
      'chores_users',
      'chores_sessions',
      'transfers_users',
      'transfers_count',
      'purchases_users',
      'purchases_count',
    ])
  );
  analytics.by_class.forEach((row: EngagementByClass) => {
    lines.push(
      csvRow([
        row.class,
        row.town_name ?? row.class,
        row.logins,
        row.chores_users,
        row.chores_sessions,
        row.transfers_users,
        row.transfers_count,
        row.purchases_users,
        row.purchases_count,
      ])
    );
  });
  lines.push('');

  lines.push(sectionTitle('Top students by engagement'));
  lines.push(
    csvRow([
      'username',
      'display_name',
      'class',
      'logins',
      'chores_sessions',
      'transfers_count',
      'purchases_count',
      'engagement_total',
    ])
  );
  analytics.top_students.forEach((row: EngagementByStudent) => {
    const total =
      row.logins + row.chores_sessions + row.transfers_count + row.purchases_count;
    lines.push(
      csvRow([
        row.username,
        studentDisplayName(row),
        row.class ?? '',
        row.logins,
        row.chores_sessions,
        row.transfers_count,
        row.purchases_count,
        total,
      ])
    );
  });
  lines.push('');

  const lowLogin = analytics.low_login_students ?? [];
  lines.push(sectionTitle('Students with low logins (0–1 in period)'));
  lines.push(csvRow(['username', 'display_name', 'class', 'town_name', 'logins_in_period', 'last_login']));
  lowLogin.forEach((row: LowLoginStudent) => {
    lines.push(
      csvRow([
        row.username,
        studentDisplayName(row),
        row.class ?? '',
        row.town_name ?? row.class ?? '',
        row.logins,
        row.last_login ?? '',
      ])
    );
  });
  lines.push('');

  lines.push(sectionTitle('Student total logins'));
  lines.push(csvRow(['username', 'display_name', 'class', 'town_name', 'total_logins', 'last_login']));
  studentLogins.forEach((row: StudentLoginRow) => {
    lines.push(
      csvRow([
        row.username,
        studentDisplayName(row),
        row.class ?? '',
        row.town_name ?? row.class ?? '',
        row.logins,
        row.last_login ?? '',
      ])
    );
  });

  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
