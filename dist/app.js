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
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const credentials_1 = require("./credentials");
const local_1 = require("./local");
var fs = require('fs');
const Client = require('bitcoin-core');
const client = new Client({
    network: 'mainnet',
    username: credentials_1.user,
    password: credentials_1.pass,
    port: 8332,
    host: credentials_1.hostAddr
});
const app = express();
const port = 3000;
app.get('/', (req, res, next) => {
    res.send('Up and running!');
});
app.listen(port, err => {
    if (err) {
        return console.error(err);
    }
    return console.log(`server is listening on ${port}`);
});
app.get('/convert', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filename = req.query.filename;
    let USDValueWasabi = 0;
    let totalBTCWasabi = 0;
    let USDValueSamourai = 0;
    let totalBTCSamourai = 0;
    let coinjoinCount = 0;
    let WasabiCount = 0;
    let SamouraiCount = 0;
    const coinjoins = require(`../data/${filename}.json`); // (with path)
    for (let coinjoin of coinjoins) {
        if (coinjoin.type === 'Wasabi') {
            USDValueWasabi += coinjoin['USDValue'];
            totalBTCWasabi += coinjoin['totalBTC'];
            WasabiCount += 1;
        }
        else if (coinjoin.type === 'Samourai') {
            USDValueSamourai += coinjoin['USDvalue'];
            totalBTCSamourai += coinjoin['totalBTC'];
            SamouraiCount += 1;
        }
    }
    const separateValues = [];
    let count = {};
    let highest = '';
    let values = [];
    for (let coinjoin of coinjoins) {
        separateValues.push(coinjoin.txid);
    }
    separateValues.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
    highest = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
    if (Number(highest) > 1) {
        throw new Error('txids have been saved multiple times. Check the calculation');
    }
    // console.log("separate txids:", separateValues)
    // console.log("count of txids", Object.keys(count).length)
    // console.log("highes count:", count[highest])
    // console.log("Length of file entries",coinjoins.length)
    const result = `USD value Wasabi: $${Math.round(USDValueWasabi)},  total BTC Wasabi: ${totalBTCWasabi}, number of Wasabi CoinJoins: ${WasabiCount}\nUSD value Samourai: ${Math.round(USDValueSamourai)},  total BTC Samourai: ${totalBTCSamourai}, number of Samourai CoinJoins: ${SamouraiCount}`;
    res.send(result);
}));
app.get('/btc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dateStart = req.query.dateStart;
    const dateEnd = req.query.dateEnd;
    const withWhirlpool = req.query.SamouraiWhirlpool;
    let filename = req.query.filename;
    console.log(dateStart);
    console.log(dateEnd);
    const found = yield local_1.getCoinJoins(dateStart, dateEnd, filename, withWhirlpool);
    const result = JSON.stringify(found);
    // if (filename === undefined) {
    //   filename = 'coinjoins.json'
    // }
    // fs.writeFile(`./data/${filename}.json`, result, function(err) {
    // if (err) {
    //   console.log(err);
    //   }
    // });
    res.send(result);
}));
//# sourceMappingURL=app.js.map