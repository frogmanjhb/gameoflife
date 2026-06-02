"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDENT_TRANSFER_DAILY_LIMIT = void 0;
exports.countStudentTransferRequestsToday = countStudentTransferRequestsToday;
exports.getStudentTransferLimitStatus = getStudentTransferLimitStatus;
exports.getStudentTransferLimitStatusForUser = getStudentTransferLimitStatusForUser;
exports.dailyTransferLimitReason = dailyTransferLimitReason;
const database_prod_1 = __importDefault(require("../database/database-prod"));
/** Max student-initiated peer transfer requests per calendar day (server date). */
exports.STUDENT_TRANSFER_DAILY_LIMIT = 3;
async function countStudentTransferRequestsToday(fromUserId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at::date = CURRENT_DATE`, [fromUserId]);
    return row?.count ?? 0;
}
function getStudentTransferLimitStatus(todayCount) {
    const transfers_remaining_today = Math.max(0, exports.STUDENT_TRANSFER_DAILY_LIMIT - todayCount);
    return {
        transfer_daily_limit: exports.STUDENT_TRANSFER_DAILY_LIMIT,
        transfers_remaining_today,
        canRequestTransfer: transfers_remaining_today > 0,
    };
}
async function getStudentTransferLimitStatusForUser(fromUserId) {
    const todayCount = await countStudentTransferRequestsToday(fromUserId);
    return getStudentTransferLimitStatus(todayCount);
}
function dailyTransferLimitReason() {
    return `You can only request ${exports.STUDENT_TRANSFER_DAILY_LIMIT} student transfers per day. Try again tomorrow.`;
}
//# sourceMappingURL=student-transfer-limit.js.map