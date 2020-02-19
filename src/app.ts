// import express from 'express';
import  express = require('express');
// var reload = require('express-reload')
import {user,pass,hostAddr} from './credentials';
import * as bitcoin from 'bitcoinjs-lib';
import * as block from '../data/block.json'
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

// async function getInfo() { // min and max included 
//     const [body, headers] = await client.getInfo();
//     const output = await client.getBlockchainInfo();
//     return [body, headers]
// }
// const path = __dirname + '/app.js'

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

app.get('/btc', async (req, res) => {
    const dateStart = req.query.dateStart;
    const dateEnd = req.query.dateEnd;
    console.log(dateStart)
    console.log(dateEnd)
    const output = await client.getBlockchainInformation();
    const output2 = await client.getBlockHeadersByHash(output.bestblockhash, 1, { extension: 'json' });
    // const output = await client.getInfo()
    const found = await getCoinJoins(dateStart,dateEnd)
    const result = JSON.stringify(found)
    fs.writeFile("coinjoins.json", result, function(err) {
    if (err) {
        console.log(err);
    }
});
    // const output = await client.getTransactionByHash('1ba2736614b5910a6b702ba63a8424082a659a110d3c7cd2b8552bd9886e3952', { extension: 'json' });
    // const output = block
    // console.log(output)
    // res.send(found);
    res.send(result);
    // res.send('The sedulous hyena ate the antelope!');
  });

// app.use(reload(path))