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
var fs = require('fs');
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
function getCoinJoins(dateStart, dateEnd, filename, withWhirlpool) {
    return __awaiter(this, void 0, void 0, function* () {
        let found;
        const DateStart = new Date(dateStart + 'T00:00:00Z');
        const ddStart = String(DateStart.getUTCDate()).padStart(2, '0');
        const mmStart = String(DateStart.getUTCMonth() + 1).padStart(2, '0');
        const yyyyStart = DateStart.getUTCFullYear();
        const dateStartString = ddStart + '-' + mmStart + '-' + yyyyStart;
        const _DateEnd = new Date(dateEnd + 'T00:00:00Z');
        const DateEnd = new Date(Date.UTC(_DateEnd.getUTCFullYear(), _DateEnd.getUTCMonth(), _DateEnd.getUTCDate()));
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
            const blockstat = yield client.getBlockStats(targetBlockHeight);
            output = yield client.getBlockHeadersByHash(blockstat.blockhash, 1, { extension: 'json' });
            while (output[0].mediantime > unixEnd) {
                output = yield client.getBlockHeadersByHash(output[0].previousblockhash, 1, { extension: 'json' });
            }
            console.log("\nStarting from block height:", output[0].height);
            blockhash = output[0].hash;
        }
        else {
            console.log("Starting from most recent block");
            output = yield client.getBlockchainInformation();
            blockhash = output.bestblockhash;
        }
        console.log("getBlockHeadersByHash:\n", output);
        output = yield client.getBlockByHash(blockhash, { extension: 'json' });
        let coinjoins = [];
        // let found = [];
        const iMax = 50;
        const denomination = 0.05;
        let counterRounds = 0;
        let initial = true;
        while (output.mediantime > unixStart) {
            const date = Unix_timestamp(output.mediantime);
            found = [];
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
            for (const entries of coinjoins) {
                const separateValues = [];
                const count = {};
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
                    const calculate = priceHistory[date];
                    const totalBTC = Number(highest) * Number(count[highest]);
                    const usdValue = calculate * totalBTC;
                    if (isNaN(usdValue)) {
                        cjCount -= 1;
                        continue;
                    }
                    found.push({
                        'height': output.height,
                        'date': date,
                        'value': highest,
                        'count': count[highest],
                        'txid': entries.txid,
                        'total BTC': totalBTC,
                        'USD value': usdValue
                    });
                }
            }
            if (found.length === 0) {
                console.log("\nNo CoinJoin found in block:", output.height);
                found = [];
                output = yield client.getBlockByHash(output.previousblockhash, { extension: 'json' });
                continue;
            }
            console.log("\"found\" data\n", found);
            if (initial === true) {
                const result = JSON.stringify(found);
                if (filename === undefined) {
                    filename = 'coinjoins.json';
                }
                yield fs.writeFile(`./data/${filename}.json`, result, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                initial = false;
            }
            else {
                yield fs.readFile(`./data/${filename}.json`, 'utf8', yield function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        const obj = JSON.parse(data);
                        console.log("\nread file data\n", obj);
                        // const foundStringified = JSON.stringify(found)
                        console.log("\n \"found\" data to be pushed to the file\n", found);
                        obj.push(...found);
                        const result = JSON.stringify(obj);
                        fs.writeFile(`./data/${filename}.json`, result, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });
            }
            console.log("No. of CoinJoins:", String(cjCount).padStart(3, ' '), "in block", String(output.height).padStart(7, ' ') + ', approx.', String(Math.round((output.mediantime - unixStart) / 600)).padStart(4, ' '), 'blocks left');
            output = yield client.getBlockByHash(output.previousblockhash, { extension: 'json' });
            // console.log("counterRounds is:",counterRounds)
            // if (counterRounds === 10) {
            //   break
            // }
            // counterRounds += 1;
        }
        console.log(found);
        return found;
    });
}
exports.getCoinJoins = getCoinJoins;
// getCoinJoins('2020-02-01','2020-02-19')
//# sourceMappingURL=local.js.map