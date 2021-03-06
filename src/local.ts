import { user, pass, hostAddr } from './credentials';
import axios from 'axios';
import * as fs from 'fs';
import { CoinJoins } from './app';
import { equalOutputs, denomination } from './params';

import Client from 'bitcoin-core';
const client = new Client({
  network: 'mainnet',
  username: user,
  password: pass,
  port: 8332,
  host: hostAddr,
});

export function unixTimestamp(t: number) {
  // unixTimestamp
  const dt = new Date(t * 1000);
  const year = dt.getUTCFullYear();
  const month = '0' + String(Number(dt.getUTCMonth()) + 1);
  const date = '0' + dt.getUTCDate();

  return date.substr(-2) + '-' + month.substr(-2) + '-' + year;
}
export async function getCoinJoins(dateStart: string, dateEnd: string, filename: string, withWhirlpool: boolean) {
  const foundCoinJoins: CoinJoins[] = [];

  const DateStart = new Date(dateStart + 'T00:00:00Z');
  const ddStart = String(DateStart.getUTCDate()).padStart(2, '0');
  const mmStart = String(DateStart.getUTCMonth() + 1).padStart(2, '0');
  const yyyyStart = DateStart.getUTCFullYear();
  const dateStartString = ddStart + '-' + mmStart + '-' + yyyyStart;
  const _DateEnd = new Date(dateEnd + 'T23:59:59Z');
  const DateEnd = new Date(
    Date.UTC(
      _DateEnd.getUTCFullYear(),
      _DateEnd.getUTCMonth(),
      _DateEnd.getUTCDate(),
      _DateEnd.getUTCHours(),
      _DateEnd.getUTCMinutes(),
      _DateEnd.getUTCSeconds()
    )
  );
  const ddEnd = String(DateEnd.getUTCDate()).padStart(2, '0');
  const mmEnd = String(DateEnd.getUTCMonth() + 1).padStart(2, '0');
  const yyyyEnd = DateEnd.getUTCFullYear();
  const dateEndString = ddEnd.substr(-2) + '-' + mmEnd.substr(-2) + '-' + yyyyEnd;
  const unixStart = DateStart.getTime() / 1000.0;
  const unixEnd = DateEnd.getTime() / 1000.0;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const unixToday = today.getTime() / 1000.0;
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  const yyyy = today.getFullYear();
  const todayString = yyyy + '-' + mm + '-' + dd;

  let unixDate = unixStart;
  const priceHistory: { [key: string]: number } = {};

  console.log('unixDate:', unixDate);
  console.log('unixEnd:', unixEnd);
  while (unixDate < unixEnd) {
    const date = unixTimestamp(unixDate);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${date}`;
    const response = await axios.get(url, { timeout: 10000 });

    priceHistory[date] = response.data.market_data.current_price.usd;
    unixDate = unixDate + 60 * 60 * 24;
  }

  try {
    console.log('dateEnd is: ', dateEndString);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateEndString}`;
    const response = await axios.get(url, { timeout: 10000 });

    priceHistory[dateEndString] = response.data.market_data.current_price.usd;
  } catch (e) {
    console.log(e);
  }
  console.log('Coingecko response\n', priceHistory);

  let output: any = [];
  let blockhash: string;

  if (dateEnd === todayString) {
    console.log('Starting from most recent block');
    output = await client.getBlockchainInformation();
    blockhash = output.bestblockhash;
  } else if (unixEnd < unixToday) {
    output = await client.getBlockchainInformation();
    const diffSecs = unixToday - unixEnd;
    const diffBlocks = Math.round(diffSecs / 600);
    const targetBlockHeight = output.blocks - diffBlocks;
    const blockstat = await client.getBlockStats(targetBlockHeight);

    output = await client.getBlockHeadersByHash(blockstat.blockhash, 1, { extension: 'json' });
    while (output[0].mediantime > unixEnd) {
      output = await client.getBlockHeadersByHash(output[0].previousblockhash, 1, { extension: 'json' });
    }
    console.log('\nStarting from block height:', output[0].height);
    blockhash = output[0].hash;
  } else {
    console.log('Starting from most recent block');
    output = await client.getBlockchainInformation();
    blockhash = output.bestblockhash;
  }

  console.log('getBlockHeadersByHash:\n', output);
  output = await client.getBlockByHash(blockhash, { extension: 'json' });
  let coinjoins = [];
  // let found = [];
  const iMax = equalOutputs * 2;
  // const denomination = 0.05;

  let initial = true;

  while (output.mediantime > unixStart) {
    const date = unixTimestamp(output.mediantime);

    // found = [];
    let coinJoinTx: any = [];

    coinjoins = [];
    for (coinJoinTx of output.tx) {
      const i: number = coinJoinTx.vout.length;

      if (i > iMax) {
        coinjoins.push(coinJoinTx);
      } else if (
        (coinJoinTx.vout.length as number) === 5 &&
        (coinJoinTx.vin.length as number) === 5 &&
        [
          coinJoinTx.vout[0].value,
          coinJoinTx.vout[1].value,
          coinJoinTx.vout[2].value,
          coinJoinTx.vout[3].value,
          coinJoinTx.vout[4].value,
        ].every(Object.is.bind(0, coinJoinTx.vout[0].value))
      ) {
        coinjoins.push(coinJoinTx);
      }
    }

    // targetBlockHeight
    let cjCount = 0;
    let whirlpoolCount = 0;
    let atLeastOneCoinJoin = false;

    for (const entry of coinjoins) {
      const foundValues = [];
      const count: { [key: string]: number } = {};
      let highest = '';
      let values: any = [];

      for (values of entry.vout) {
        foundValues.push(String(values.value));
      }
      for (const foundValue of foundValues) {
        count[foundValue] = (count[foundValue] || 0) + 1;
      }

      highest = Object.keys(count).reduce((a, b) => (count[a] > count[b] ? a : b));

      if (
        Number(highest) >= denomination &&
        count[highest] >= equalOutputs &&
        Number(entry.vin.length) >= equalOutputs
      ) {
        const CoinJoinType = 'Wasabi';

        cjCount += 1;
        const calculate: number = priceHistory[date];
        const totalBTC = Number(highest) * Number(count[highest]);
        const usdValue = calculate * totalBTC;

        if (isNaN(usdValue)) {
          cjCount -= 1;
          continue;
        }
        foundCoinJoins.push({
          height: output.height,
          date,
          value: highest,
          count: count[highest],
          txid: entry.txid,
          totalBTC,
          usdValue,
          type: CoinJoinType,
        });
        atLeastOneCoinJoin = true;
      } else if (
        (entry.vout.length as number) === 5 &&
        ((entry.vout[0].value as number) === 0.01 ||
          (entry.vout[0].value as number) === 0.05 ||
          (entry.vout[0].value as number) === 0.5)
      ) {
        const CoinJoinType = 'Samourai';

        whirlpoolCount += 1;
        const calculate: number = priceHistory[date];
        const totalBTC = entry.vout[0].value * entry.vout.length;
        const usdValue = calculate * totalBTC;

        if (isNaN(usdValue)) {
          whirlpoolCount -= 1;
          continue;
        }
        foundCoinJoins.push({
          height: output.height,
          date,
          value: highest,
          count: count[highest],
          txid: entry.txid,
          totalBTC,
          usdValue,
          type: CoinJoinType,
        });
        atLeastOneCoinJoin = true;
      }
    }
    if (!atLeastOneCoinJoin) {
      console.log(
        'No. of CoinJoins:',
        String(0).padStart(3, ' '),
        'in block',
        String(output.height).padStart(7, ' ') + ', approx.',
        String(Math.round((output.mediantime - unixStart) / 600)).padStart(4, ' '),
        'blocks left'
      );
      // found = [];
      output = await client.getBlockByHash(output.previousblockhash, { extension: 'json' });
      continue;
    }
    if (initial === true) {
      const result = JSON.stringify(foundCoinJoins);

      if (filename === undefined) {
        filename = 'coinjoins.json';
      }
      // tslint:disable-next-line: only-arrow-functions
      fs.writeFile(`./data/${filename}.json`, result, function (err) {
        if (err) {
          console.log(err);
        }
      });
      initial = false;
    } else {
      // tslint:disable-next-line: only-arrow-functions
      fs.readFile(`./data/${filename}.json`, 'utf8', function (err, data) {
        if (err) {
          console.log(err);
        } else {
          const obj = JSON.parse(data);

          obj.push(...foundCoinJoins);
          const result = JSON.stringify(obj);

          // tslint:disable-next-line: no-shadowed-variable && only-arrow-functions
          fs.writeFile(`./data/${filename}.json`, result, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }

    console.log(
      'No. of CoinJoins:',
      String(cjCount + whirlpoolCount).padStart(3, ' '),
      'in block',
      String(output.height).padStart(7, ' ') + ', approx.',
      String(Math.round((output.mediantime - unixStart) / 600)).padStart(4, ' '),
      'blocks left'
    );
    output = await client.getBlockByHash(output.previousblockhash, { extension: 'json' });
    // console.log("counterRounds is:",counterRounds)
    // if (counterRounds === 10) {
    //   break
    // }
    // counterRounds += 1;
  }
  console.log(foundCoinJoins);

  return foundCoinJoins;
}

// getCoinJoins('2020-02-01','2020-02-19')
