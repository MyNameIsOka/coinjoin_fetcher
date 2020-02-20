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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var reload = require('express-reload');
const credentials_1 = require("./credentials");
const axios_1 = __importDefault(require("axios"));
const Client = require('bitcoin-core');
const client = new Client({
    network: 'mainnet',
    username: credentials_1.user,
    password: credentials_1.pass,
    port: 8332,
    host: credentials_1.hostAddr
});
function Unix_timestamp(t) {
    const dt = new Date(t * 1000);
    const year = dt.getUTCFullYear();
    const month = "0" + String(Number(dt.getUTCMonth()) + 1);
    const date = "0" + dt.getUTCDate();
    return date.substr(-2) + '-' + month.substr(-2) + '-' + year;
}
exports.Unix_timestamp = Unix_timestamp;
function getCoinJoins(dateStart, dateEnd) {
    return __awaiter(this, void 0, void 0, function* () {
        const DateStart = new Date(dateStart + 'T00:00:00Z');
        const ddStart = String(DateStart.getUTCDate()).padStart(2, '0');
        const mmStart = String(DateStart.getUTCMonth() + 1).padStart(2, '0');
        const yyyyStart = DateStart.getUTCFullYear();
        const dateStartString = ddStart + '-' + mmStart + '-' + yyyyStart;
        const DateEnd = new Date(dateEnd + 'T00:00:00Z');
        const ddEnd = String(DateEnd.getUTCDate()).padStart(2, '0');
        const mmEnd = String(DateEnd.getUTCMonth() + 1).padStart(2, '0');
        const yyyyEnd = DateEnd.getUTCFullYear();
        const dateEndString = ddEnd.substr(-2) + '-' + mmEnd.substr(-2) + '-' + yyyyEnd;
        const unixStart = DateStart.getTime() / 1000.0;
        const unixEnd = DateEnd.getTime() / 1000.0;
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const unixToday = today.getTime() / 1000.0;
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        var yyyy = today.getFullYear();
        const todayString = yyyy + '-' + mm + '-' + dd;
        let unixDate = unixStart;
        let temp = 0;
        const priceHistory = [];
        while (unixDate < unixEnd) {
            let date = Unix_timestamp(unixDate);
            const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${date}`;
            const response = yield axios_1.default.get(url, { timeout: 10000 });
            priceHistory[date] = response.data.market_data.current_price.usd;
            unixDate = unixDate + (60 * 60 * 24);
        }
        try {
            console.log("dateEnd is: ", dateEndString);
            const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateEndString}`;
            const response = yield axios_1.default.get(url, { timeout: 10000 });
            let date = Unix_timestamp(unixToday);
            priceHistory[dateEndString] = response.data.market_data.current_price.usd;
        }
        catch (e) {
            console.log(e);
        }
        console.log("Coingecko response\n", priceHistory);
        let output = [];
        let blockhash;
        if (dateEnd === todayString) {
            console.log("Starting from most recent block");
            output = yield client.getBlockchainInformation();
            blockhash = output.bestblockhash;
        }
        else if (unixEnd < unixToday) {
            output = yield client.getBlockchainInformation();
            const diffSecs = unixToday - unixEnd;
            const diffBlocks = Math.round(diffSecs / 600);
            const targetBlockHeight = output.blocks - diffBlocks;
            console.log("Starting from block", targetBlockHeight);
            const blockstat = yield client.getBlockStats(targetBlockHeight);
            output = yield client.getBlockHeadersByHash(blockstat.blockhash, 1, { extension: 'json' });
            blockhash = output[0].hash;
        }
        else {
            console.log("Starting from most recent block");
            output = yield client.getBlockchainInformation();
            blockhash = output.bestblockhash;
        }
        output = yield client.getBlockByHash(blockhash, { extension: 'json' });
        let coinjoins = [];
        const found = [];
        const iMax = 50;
        const denomination = 0.05;
        let counterRounds = 0;
        while (output.mediantime > unixStart) {
            const date = Unix_timestamp(output.mediantime);
            let CoinJoinTx = [];
            coinjoins = [];
            for (CoinJoinTx of output.tx) {
                let i = CoinJoinTx.vout.length;
                if (i > iMax) {
                    coinjoins.push(CoinJoinTx);
                }
            }
            // targetBlockHeight
            let cjCount = 0;
            for (let entries of coinjoins) {
                const separateValues = [];
                let count = {};
                let highest = '';
                let values = [];
                for (values of entries.vout) {
                    separateValues.push(values.value);
                }
                separateValues.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
                // console.log(count);
                highest = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
                if (Number(highest) >= denomination && count[highest] >= iMax / 2 && Number(entries.vin.length) >= iMax / 2) {
                    cjCount += 1;
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
            }
            console.log("No. of CoinJoins:", String(cjCount).padStart(3, ' '), "in block", String(output.height).padStart(7, ' ') + ', approx.', String(Math.round((output.mediantime - unixStart) / 600)).padStart(4, ' '), 'blocks left');
            output = yield client.getBlockByHash(output.previousblockhash, { extension: 'json' });
            // console.log("counterRounds is:",counterRounds)
            // if (counterRounds === 10) {
            //   break
            // }
            // counterRounds += 1;
        }
        console.log("Starting price action");
        for (let entry of found) {
            let calculate = priceHistory[entry['date']];
            console.log("Fetch price", calculate);
            entry['total BTC'] = Number(entry['value']) * Number(entry['count']);
            entry['USD value'] = calculate * entry['total BTC'];
        }
        console.log(found);
        return found;
    });
}
exports.getCoinJoins = getCoinJoins;
// getCoinJoins('2020-02-01','2020-02-19')
//# sourceMappingURL=local.js.map