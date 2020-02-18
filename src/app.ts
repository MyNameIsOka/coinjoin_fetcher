import express from 'express';
import axios from 'axios';
import * as btc_cli from 'bitcoin-core';

import Client from 'bitcoin-core';
const client = new Client({ 
  network: 'mainnet', 
  username: 'user', 
  password: 'pass', 
  port: 8332 
});

async function getInfo() { // min and max included 
    const output = await client.getBlockchainInfo();
    return output
}

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

app.get('/btc', (req, res) => {
    const output = getInfo()
    console.log("Done btc call")
    res.send(output);
    // res.send('The sedulous hyena ate the antelope!');
  });