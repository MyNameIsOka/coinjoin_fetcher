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
  let USDValueWasabi: number = 0;
  let totalBTCWasabi: number = 0;
  let USDValueSamourai: number = 0;
  let totalBTCSamourai: number = 0;
  let coinjoinCount: number = 0;
  let WasabiCount: number = 0;
  let SamouraiCount: number = 0;

  const coinjoins = require(`../data/${filename}.json`); // (with path)
  for (let coinjoin of coinjoins) {
    if ( coinjoin.type === 'Wasabi' ) {
      USDValueWasabi += coinjoin['USDValue']
      totalBTCWasabi += coinjoin['totalBTC']
      WasabiCount += 1;
    } else if ( coinjoin.type === 'Samourai' ) {
      USDValueSamourai += coinjoin['USDValue']
      totalBTCSamourai += coinjoin['totalBTC']
      SamouraiCount += 1;
    }
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
  if (Number(highest) > 1) {
    throw new Error('txids have been saved multiple times. Check the calculation')
  }
  // console.log("separate txids:", separateValues)
  // console.log("count of txids", Object.keys(count).length)
  // console.log("highes count:", count[highest])
  // console.log("Length of file entries",coinjoins.length)
  const result = `USD value Wasabi: $${Math.round(USDValueWasabi)},  total BTC Wasabi: ${totalBTCWasabi}, number of Wasabi CoinJoins: ${WasabiCount}\nUSD value Samourai: $${Math.round(USDValueSamourai)},  total BTC Samourai: ${totalBTCSamourai}, number of Samourai CoinJoins: ${SamouraiCount}`
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