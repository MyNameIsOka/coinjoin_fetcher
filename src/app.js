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
// import express from 'express';
var express = require("express");
// var reload = require('express-reload')
var credentials_1 = require("./credentials");
// import * as block from '../data/block.json'
var local_1 = require("./local");
var fs = require('fs');
var Client = require('bitcoin-core');
var client = new Client({
    network: 'mainnet',
    username: credentials_1.user,
    password: credentials_1.pass,
    port: 8332,
    host: credentials_1.hostAddr
});
// async function getInfo() { // min and max included 
//     const [body, headers] = await client.getInfo();
//     const output = await client.getBlockchainInfo();
//     return [body, headers]
// }
// const path = __dirname + '/app.js'
var app = express();
var port = 3000;
app.get('/', function (req, res, next) {
    res.send('Up and running!');
});
app.listen(port, function (err) {
    if (err) {
        return console.error(err);
    }
    return console.log("server is listening on " + port);
});
app.get('/convert', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filename, USDValue, totalBTC, coinjoinCount, coinjoins, _i, coinjoins_1, coinjoin, separateValues, count, highest, values, _a, coinjoins_2, coinjoin, result;
    return __generator(this, function (_b) {
        filename = req.query.filename;
        USDValue = 0;
        totalBTC = 0;
        coinjoinCount = 0;
        coinjoins = require("../data/" + filename + ".json");
        // const coinjoins = require('../data/coinjoins.json'); // (with path)
        for (_i = 0, coinjoins_1 = coinjoins; _i < coinjoins_1.length; _i++) {
            coinjoin = coinjoins_1[_i];
            USDValue += coinjoin['USD value'];
            totalBTC += coinjoin['total BTC'];
            coinjoinCount += 1;
        }
        separateValues = [];
        count = {};
        highest = '';
        values = [];
        for (_a = 0, coinjoins_2 = coinjoins; _a < coinjoins_2.length; _a++) {
            coinjoin = coinjoins_2[_a];
            separateValues.push(coinjoin.txid);
        }
        separateValues.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
        highest = Object.keys(count).reduce(function (a, b) { return count[a] > count[b] ? a : b; });
        result = "USD value: $" + Math.round(USDValue) + ",  total BTC: " + totalBTC + ", number of CoinJoins: " + coinjoinCount;
        res.send(result);
        return [2 /*return*/];
    });
}); });
app.get('/btc', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dateStart, dateEnd, filename, found, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                dateStart = req.query.dateStart;
                dateEnd = req.query.dateEnd;
                filename = req.query.filename;
                console.log(dateStart);
                console.log(dateEnd);
                return [4 /*yield*/, local_1.getCoinJoins(dateStart, dateEnd)];
            case 1:
                found = _a.sent();
                result = JSON.stringify(found);
                if (filename === undefined) {
                    filename = 'coinjoins.json';
                }
                fs.writeFile("./data/" + filename + ".json", result, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                res.send(result);
                return [2 /*return*/];
        }
    });
}); });
