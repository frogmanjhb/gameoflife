"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDoublesDayEnabled = isDoublesDayEnabled;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const DOUBLES_DAY_ROUTE_PATH = '/doubles-day';
/**
 * Returns whether the Doubles Day plugin is enabled.
 * When enabled: chore (math game) earnings are doubled, pizza time donations to the fund are doubled.
 */
async function isDoublesDayEnabled() {
    try {
        const row = await database_prod_1.default.get('SELECT enabled FROM plugins WHERE route_path = $1', [DOUBLES_DAY_ROUTE_PATH]);
        return !!row?.enabled;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=doubles-day.js.map