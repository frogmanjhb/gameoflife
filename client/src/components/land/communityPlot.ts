export const COMMUNITY_AUCTION_GRID_CODE = 'I6';

export const HIDDEN_AUCTION_PRICE_LABEL = '?????';

export function isCommunityAuctionPlot(parcel: { grid_code?: string } | null | undefined): boolean {
  return parcel?.grid_code === COMMUNITY_AUCTION_GRID_CODE;
}

export const COMMUNITY_AUCTION_HOVER_TITLE =
  'Class auction plot — reserved for the secret community building';

export const COMMUNITY_AUCTION_DESCRIPTION =
  'This is the most valuable plot in your town. It is reserved for a class auction and will become the site of the secret community building. The final price is revealed only at auction.';
