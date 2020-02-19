import  express = require('express');
var reload = require('express-reload')
import {user,pass} from './credentials';
import axios from 'axios';

const Client = require('bitcoin-core');
const client = new Client({ 
  network: 'mainnet', 
  username: user, 
  password: pass, 
  port: 8332,
  host: '18.177.119.49'
});
export function Unix_timestamp(t)
{
const dt = new Date(t*1000);
const year = dt.getUTCFullYear();
const month = "0" + String(Number(dt.getUTCMonth())+1);
const date = "0" + dt.getUTCDate();
return date.substr(-2)+ '-' + month.substr(-2) + '-' + year;
}
export async function getCoinJoins(dateStart: string,dateEnd: string) {
  const DateStart = new Date(dateStart + 'T00:00:00Z');
  const ddStart = String(DateStart.getUTCDate()).padStart(2, '0');
  const mmStart = String(DateStart.getUTCMonth() + 1).padStart(2, '0');
  const yyyyStart = DateStart.getUTCFullYear();
  const dateStartString = ddStart + '-' + mmStart + '-' + yyyyStart;
  const DateEnd = new Date(dateEnd + 'T00:00:00Z');
  const ddEnd = String(DateEnd.getUTCDate()).padStart(2, '0');
  const mmEnd = String(DateEnd.getUTCMonth() + 1).padStart(2, '0');
  const yyyyEnd = DateEnd.getUTCFullYear();
  const dateEndString = ddEnd + '-' + mmEnd + '-' + yyyyEnd;
  console.log("DateStart", DateStart)
  console.log("DateEnd", DateEnd)
  const unixStart = DateStart.getTime()/1000.0;
  const unixEnd = DateEnd.getTime()/1000.0;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const unixToday = today.getTime()/1000.0;
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  var yyyy = today.getFullYear();
  const todayString = yyyy + '-' + mm + '-' + dd;

  let unixDate = unixStart
  let temp = 0;
  const priceHistory = [];
  while (unixDate < unixEnd) {
    let date = Unix_timestamp(unixDate)
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${date}`
    const response = await axios.get(url, { timeout: 10000} );
    priceHistory[date] = response.data.market_data.current_price.usd
    unixDate = unixDate + (60*60*24)
  }

  try{
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    const response = await axios.get(url, { timeout: 10000} );
    let date = Unix_timestamp(unixToday)
    priceHistory[date] = response.data.bitcoin.usd
  } catch {
    // continue
  }
  console.log("Coingecko response\n",priceHistory)


  let output: any = []
  let blockhash: string;
  if (dateEnd === todayString) {
    console.log("Starting from most recent block")
    output = await client.getBlockchainInformation();
    blockhash = output.bestblockhash;
  } else if (unixEnd < unixToday) {
    output = await client.getBlockchainInformation();
    const diffSecs = unixToday - unixEnd
    const diffBlocks = Math.round(diffSecs / 600);
    const targetBlockHeight = output.blocks - diffBlocks
    const blockstat = await client.getBlockStats(targetBlockHeight)
    output = await client.getBlockHeadersByHash(blockstat.blockhash, 1, { extension: 'json' });
    blockhash = output[0].hash;
  } else {
    console.log("Starting from most recent block")
    output = await client.getBlockchainInformation();
    blockhash = output.bestblockhash;
  }


  output = await client.getBlockByHash(blockhash, { extension: 'json' })
  let coinjoins = [];
  const found = [];
  const iMax: number = 50
  const denomination: number = 0.05;

  let counterRounds = 0;
  while (output.mediantime > unixStart) {
    const date = Unix_timestamp(output.mediantime)
    let CoinJoinTx: any = []
    coinjoins = [];
    for (CoinJoinTx of output.tx) {
      let i: number = CoinJoinTx.vout.length
      if (i > iMax) {
        coinjoins.push(CoinJoinTx)
      }
    }
    console.log("No. of transactions:",String(coinjoins.length).padStart(3, ' '), "in block", String(output.height).padStart(7, ' ')+ ', approx.', String(Math.round((output.mediantime-unixStart)/600)).padStart(4, ' '), 'blocks left')
    // targetBlockHeight
    for(let entries of coinjoins) {
      const separateValues = [];
      let count = {};
      let highest = '';
      let values: any = []
      for (values of entries.vout) {
        separateValues.push(values.value)
      }
      separateValues.forEach(function(i) { count[i] = (count[i]||0) + 1;});
      // console.log(count);
      highest = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);

      if (Number(highest) >= denomination && count[highest] >= iMax/2) {
        // console.log("highest output is: ", highest)
        // console.log("count of highest output is: ", count[highest])
      found.push({
        'height': output.height,
        'date': date,
        'value': highest,
        'count': count[highest],
        'txid': entries.txid})
      }
      // entries = [];
    }

    output = await client.getBlockByHash(output.previousblockhash, { extension: 'json' })
    // console.log("counterRounds is:",counterRounds)
    if (counterRounds === 3) {
      break
    }
    counterRounds += 1;
  }
console.log("Starting price action")
for (let entry of found) {
let calculate: number = priceHistory[entry['date']]
console.log("Fetch price", calculate)
entry['total BTC'] = Number(entry['value']) * Number(entry['count'])
entry['USD value'] = calculate * entry['total BTC']

}
console.log(found)
return found

}

// getCoinJoins('2020-02-01','2020-02-19')