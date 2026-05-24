export const COMMUNITY_AUCTION_GRID_CODE = 'I6';
export const COMMUNITY_AUCTION_ROW = 8;
export const COMMUNITY_AUCTION_COL = 5;
/** Highest plot value in the game — actual price revealed at class auction */
export const COMMUNITY_AUCTION_VALUE = 500000;

export const COMMUNITY_AUCTION_PROS = [
  'Site of the secret community building',
  'Most valuable plot in your town',
  'Awarded through class auction only',
];

export const COMMUNITY_AUCTION_CONS = [
  'Not available for direct purchase',
  'Winning bid required at class auction',
];

export function isCommunityAuctionPlot(gridCode: string | null | undefined): boolean {
  return gridCode === COMMUNITY_AUCTION_GRID_CODE;
}

export function communityAuctionPlotSqlPros(): string {
  return COMMUNITY_AUCTION_PROS.map((p) => `'${p.replace(/'/g, "''")}'`).join(',');
}

export function communityAuctionPlotSqlCons(): string {
  return COMMUNITY_AUCTION_CONS.map((c) => `'${c.replace(/'/g, "''")}'`).join(',');
}
