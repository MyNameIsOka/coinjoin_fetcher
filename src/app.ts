import  express = require('express');
import {user,pass,hostAddr} from './credentials';
import { getCoinJoins } from './local'

var fs = require('fs');
const Client = require('bitcoin-core');
const client = new Client({
  network: 'mainnet',
  username: user,
  password: pass,
  port: 8332,
  host: hostAddr
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
app.get('/convert', async (req, res) => {
  let filename: string = req.query.filename;
  let USDValue: number = 0;
  let totalBTC: number = 0;
  let coinjoinCount: number = 0;
  const coinjoins = require(`../data/${filename}.json`); // (with path)
  // const coinjoins = require('../data/coinjoins.json'); // (with path)
  for (let coinjoin of coinjoins) {
    USDValue += coinjoin['USD value']
    totalBTC += coinjoin['total BTC']
    coinjoinCount += 1;
  }
  const separateValues = [];
  let count = {};
  let highest = '';
  let values: any = []
  for (let coinjoin of coinjoins) {
    separateValues.push(coinjoin.txid)
  }
  separateValues.forEach(function(i) { count[i] = (count[i]||0) + 1;});
  highest = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
  // console.log("separate txids:", separateValues)
  // console.log("count of txids", Object.keys(count).length)
  // console.log("highes count:", count[highest])
  // console.log("Length of file entries",coinjoins.length)
  const result = `USD value: $${Math.round(USDValue)},  total BTC: ${totalBTC}, number of CoinJoins: ${coinjoinCount}`
  res.send(result);

})
app.get('/btc', async (req, res) => {
    const dateStart = req.query.dateStart;
    const dateEnd = req.query.dateEnd;
    const withWhirlpool = req.query.SamouraiWhirlpool;
    let filename: string = req.query.filename;
    console.log(dateStart)
    console.log(dateEnd)
    const found = await getCoinJoins(dateStart, dateEnd, filename, withWhirlpool)
    const result = JSON.stringify(found)
    // if (filename === undefined) {
    //   filename = 'coinjoins.json'
    // }
    // fs.writeFile(`./data/${filename}.json`, result, function(err) {
    // if (err) {
    //   console.log(err);
    //   }
    // });
    res.send(result);
  });