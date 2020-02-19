"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var reload = require('express-reload');
var credentials_1 = require("./credentials");
var axios_1 = require("axios");
var Client = require('bitcoin-core');
var client = new Client({
    network: 'mainnet',
    username: credentials_1.user,
    password: credentials_1.pass,
    port: 8332,
    host: '18.177.119.49'
});
function Unix_timestamp(t) {
    var dt = new Date(t * 1000);
    var year = dt.getUTCFullYear();
    var month = "0" + String(Number(dt.getUTCMonth()) + 1);
    var date = "0" + dt.getUTCDate();
    return date.substr(-2) + '-' + month.substr(-2) + '-' + year;
}
exports.Unix_timestamp = Unix_timestamp;
function getCoinJoins(dateStart, dateEnd) {
    return __awaiter(this, void 0, void 0, function () {
        var DateStart, ddStart, mmStart, yyyyStart, dateStartString, DateEnd, ddEnd, mmEnd, yyyyEnd, dateEndString, unixStart, unixEnd, now, today, unixToday, dd, mm, yyyy, todayString, unixDate, temp, priceHistory, date, url, response, url, response, date, _a, output, blockhash, diffSecs, diffBlocks, targetBlockHeight, blockstat, coinjoins, found, iMax, denomination, counterRounds, date, CoinJoinTx, _i, _b, i, _loop_1, _c, coinjoins_1, entries, _d, found_1, entry, calculate;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    DateStart = new Date(dateStart + 'T00:00:00Z');
                    ddStart = String(DateStart.getUTCDate()).padStart(2, '0');
                    mmStart = String(DateStart.getUTCMonth() + 1).padStart(2, '0');
                    yyyyStart = DateStart.getUTCFullYear();
                    dateStartString = ddStart + '-' + mmStart + '-' + yyyyStart;
                    DateEnd = new Date(dateEnd + 'T00:00:00Z');
                    ddEnd = String(DateEnd.getUTCDate()).padStart(2, '0');
                    mmEnd = String(DateEnd.getUTCMonth() + 1).padStart(2, '0');
                    yyyyEnd = DateEnd.getUTCFullYear();
                    dateEndString = ddEnd + '-' + mmEnd + '-' + yyyyEnd;
                    console.log("DateStart", DateStart);
                    console.log("DateEnd", DateEnd);
                    unixStart = DateStart.getTime() / 1000.0;
                    unixEnd = DateEnd.getTime() / 1000.0;
                    now = new Date();
                    today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    unixToday = today.getTime() / 1000.0;
                    dd = String(today.getDate()).padStart(2, '0');
                    mm = String(today.getMonth() + 1).padStart(2, '0');
                    yyyy = today.getFullYear();
                    todayString = yyyy + '-' + mm + '-' + dd;
                    unixDate = unixStart;
                    temp = 0;
                    priceHistory = [];
                    _e.label = 1;
                case 1:
                    if (!(unixDate < unixEnd)) return [3 /*break*/, 3];
                    date = Unix_timestamp(unixDate);
                    url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?date=" + date;
                    return [4 /*yield*/, axios_1["default"].get(url, { timeout: 10000 })];
                case 2:
                    response = _e.sent();
                    priceHistory[date] = response.data.market_data.current_price.usd;
                    unixDate = unixDate + (60 * 60 * 24);
                    return [3 /*break*/, 1];
                case 3:
                    _e.trys.push([3, 5, , 6]);
                    url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
                    return [4 /*yield*/, axios_1["default"].get(url, { timeout: 10000 })];
                case 4:
                    response = _e.sent();
                    date = Unix_timestamp(unixToday);
                    priceHistory[date] = response.data.bitcoin.usd;
                    return [3 /*break*/, 6];
                case 5:
                    _a = _e.sent();
                    return [3 /*break*/, 6];
                case 6:
                    console.log("Coingecko response\n", priceHistory);
                    output = [];
                    if (!(dateEnd === todayString)) return [3 /*break*/, 8];
                    console.log("Starting from most recent block");
                    return [4 /*yield*/, client.getBlockchainInformation()];
                case 7:
                    output = _e.sent();
                    blockhash = output.bestblockhash;
                    return [3 /*break*/, 14];
                case 8:
                    if (!(unixEnd < unixToday)) return [3 /*break*/, 12];
                    return [4 /*yield*/, client.getBlockchainInformation()];
                case 9:
                    output = _e.sent();
                    diffSecs = unixToday - unixEnd;
                    diffBlocks = Math.round(diffSecs / 600);
                    targetBlockHeight = output.blocks - diffBlocks;
                    return [4 /*yield*/, client.getBlockStats(targetBlockHeight)];
                case 10:
                    blockstat = _e.sent();
                    return [4 /*yield*/, client.getBlockHeadersByHash(blockstat.blockhash, 1, { extension: 'json' })];
                case 11:
                    output = _e.sent();
                    blockhash = output[0].hash;
                    return [3 /*break*/, 14];
                case 12:
                    console.log("Starting from most recent block");
                    return [4 /*yield*/, client.getBlockchainInformation()];
                case 13:
                    output = _e.sent();
                    blockhash = output.bestblockhash;
                    _e.label = 14;
                case 14: return [4 /*yield*/, client.getBlockByHash(blockhash, { extension: 'json' })];
                case 15:
                    output = _e.sent();
                    coinjoins = [];
                    found = [];
                    iMax = 50;
                    denomination = 0.05;
                    counterRounds = 0;
                    _e.label = 16;
                case 16:
                    if (!(output.mediantime > unixStart)) return [3 /*break*/, 18];
                    date = Unix_timestamp(output.mediantime);
                    CoinJoinTx = [];
                    coinjoins = [];
                    for (_i = 0, _b = output.tx; _i < _b.length; _i++) {
                        CoinJoinTx = _b[_i];
                        i = CoinJoinTx.vout.length;
                        if (i > iMax) {
                            coinjoins.push(CoinJoinTx);
                        }
                    }
                    console.log("No. of transactions:", String(coinjoins.length).padStart(3, ' '), "in block", String(output.height).padStart(7, ' ') + ', approx.', String(Math.round((output.mediantime - unixStart) / 600)).padStart(4, ' '), 'blocks left');
                    _loop_1 = function (entries) {
                        var separateValues = [];
                        var count = {};
                        var highest = '';
                        var values = [];
                        for (var _i = 0, _a = entries.vout; _i < _a.length; _i++) {
                            values = _a[_i];
                            separateValues.push(values.value);
                        }
                        separateValues.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
                        // console.log(count);
                        highest = Object.keys(count).reduce(function (a, b) { return count[a] > count[b] ? a : b; });
                        if (Number(highest) >= denomination && count[highest] >= iMax / 2) {
                            // console.log("highest output is: ", highest)
                            // console.log("count of highest output is: ", count[highest])
                            found.push({
                                'height': output.height,
                                'date': date,
                                'value': highest,
                                'count': count[highest],
                                'txid': entries.txid
                            });
                        }
                    };
                    // targetBlockHeight
                    for (_c = 0, coinjoins_1 = coinjoins; _c < coinjoins_1.length; _c++) {
                        entries = coinjoins_1[_c];
                        _loop_1(entries);
                    }
                    return [4 /*yield*/, client.getBlockByHash(output.previousblockhash, { extension: 'json' })
                        // console.log("counterRounds is:",counterRounds)
                    ];
                case 17:
                    output = _e.sent();
                    // console.log("counterRounds is:",counterRounds)
                    if (counterRounds === 3) {
                        return [3 /*break*/, 18];
                    }
                    counterRounds += 1;
                    return [3 /*break*/, 16];
                case 18:
                    console.log("Starting price action");
                    for (_d = 0, found_1 = found; _d < found_1.length; _d++) {
                        entry = found_1[_d];
                        calculate = priceHistory[entry['date']];
                        console.log("Fetch price", calculate);
                        entry['total BTC'] = Number(entry['value']) * Number(entry['count']);
                        entry['USD value'] = calculate * entry['total BTC'];
                    }
                    console.log(found);
                    return [2 /*return*/, found];
            }
        });
    });
}
exports.getCoinJoins = getCoinJoins;
// getCoinJoins('2020-02-01','2020-02-19')
