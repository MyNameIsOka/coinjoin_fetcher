import express from 'express';
import axios from 'axios';
import * as btc_cli from 'bitcoin-core';
import {user,pass} from './credentials';
// import * as Client from 'bitcoin-core';

const Client = require('bitcoin-core');
const client = new Client({ 
  network: 'mainnet', 
  username: user, 
  password: pass, 
  port: 8332 
});

// async function getInfo() { // min and max included 
//     const [body, headers] = await client.getInfo();
//     const output = await client.getBlockchainInfo();
//     return [body, headers]
// }

const app = express();
const port = 3000;
app.get('/', (req, res) => {
  res.send('The sedulous hyena ate the antelope!');
});
app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on ${port}`);
});

app.get('/btc', async (req, res) => {
    const output = await client.getBlockchainInfo()
    console.log(output)
    res.send(output);
    // res.send('The sedulous hyena ate the antelope!');
  });