import express = require('express');
import { getCoinJoins } from './local';
import * as fs from 'fs';
export type CoinJoins = {
  height: number;
  date: string;
  value: string;
  count: number;
  txid: string;
  totalBTC: number;
  usdValue: number;
  type: string;
};

const app = express();
const port = 3000;

app.get('/', (req, res, next) => {
  res.send('Up and running!');
});
app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }

  return console.log(`server is listening on ${port}`);
});
app.get('/convert', async (req, res) => {
  const filename: string = req.query.filename;

  const rawData = fs.readFileSync(`../data/${filename}.json`);
  const coinjoins: CoinJoins[] = JSON.parse(rawData.toString());

  // import * as coinjoins from `../data/${filename}.json`;

  let usdValueWasabi = 0;
  let totalBTCWasabi = 0;
  let usdValueSamourai = 0;
  let totalBTCSamourai = 0;
  const coinjoinCount = 0;
  let wasabiCount = 0;
  let samouraiCount = 0;

  // const coinjoins = require(`../data/${filename}.json`); // (with path)

  for (const coinjoin of coinjoins) {
    if (coinjoin.type === 'Wasabi') {
      usdValueWasabi += coinjoin.usdValue;
      totalBTCWasabi += coinjoin.totalBTC;
      wasabiCount += 1;
    } else if (coinjoin.type === 'Samourai') {
      usdValueSamourai += coinjoin.usdValue;
      totalBTCSamourai += coinjoin.totalBTC;
      samouraiCount += 1;
    }
  }
  const foundTxIds = [];
  const count: { [txId: string]: number } = {};
  let highest = '';
  const values: any = [];

  for (const coinjoin of coinjoins) {
    foundTxIds.push(coinjoin.txid);
  }

  for (const foundTxId of foundTxIds) {
    count[foundTxId] = (count[foundTxId] || 0) + 1;
  }

  highest = Object.keys(count).reduce((a, b) => (count[a] > count[b] ? a : b));
  if (Number(highest) > 1) {
    throw new Error('txids have been saved multiple times. Check the calculation');
  }
  const result = `USD value Wasabi: $${Math.round(
    usdValueWasabi
  )},  total BTC Wasabi: ${totalBTCWasabi}, number of Wasabi CoinJoins: ${wasabiCount}\nUSD value Samourai: $${Math.round(
    usdValueSamourai
  )},  total BTC Samourai: ${totalBTCSamourai}, number of Samourai CoinJoins: ${samouraiCount}`;

  res.send(result);
});
app.get('/btc', async (req, res) => {
  const dateStart = req.query.dateStart;
  const dateEnd = req.query.dateEnd;
  const withWhirlpool = req.query.SamouraiWhirlpool;
  const filename: string = req.query.filename;

  console.log(dateStart);
  console.log(dateEnd);
  const found = await getCoinJoins(dateStart, dateEnd, filename, withWhirlpool);
  const result = JSON.stringify(found);

  res.send(result);
});
