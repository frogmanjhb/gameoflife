"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMUNITY_AUCTION_CONS = exports.COMMUNITY_AUCTION_PROS = exports.COMMUNITY_AUCTION_VALUE = exports.COMMUNITY_AUCTION_COL = exports.COMMUNITY_AUCTION_ROW = exports.COMMUNITY_AUCTION_GRID_CODE = void 0;
exports.isCommunityAuctionPlot = isCommunityAuctionPlot;
exports.communityAuctionPlotSqlPros = communityAuctionPlotSqlPros;
exports.communityAuctionPlotSqlCons = communityAuctionPlotSqlCons;
exports.COMMUNITY_AUCTION_GRID_CODE = 'I6';
exports.COMMUNITY_AUCTION_ROW = 8;
exports.COMMUNITY_AUCTION_COL = 5;
/** Highest plot value in the game — actual price revealed at class auction */
exports.COMMUNITY_AUCTION_VALUE = 500000;
exports.COMMUNITY_AUCTION_PROS = [
    'Site of the secret community building',
    'Most valuable plot in your town',
    'Awarded through class auction only',
];
exports.COMMUNITY_AUCTION_CONS = [
    'Not available for direct purchase',
    'Winning bid required at class auction',
];
function isCommunityAuctionPlot(gridCode) {
    return gridCode === exports.COMMUNITY_AUCTION_GRID_CODE;
}
function communityAuctionPlotSqlPros() {
    return exports.COMMUNITY_AUCTION_PROS.map((p) => `'${p.replace(/'/g, "''")}'`).join(',');
}
function communityAuctionPlotSqlCons() {
    return exports.COMMUNITY_AUCTION_CONS.map((c) => `'${c.replace(/'/g, "''")}'`).join(',');
}
//# sourceMappingURL=communityAuctionPlot.js.map