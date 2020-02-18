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

client.getBlockchainInfo().then((help) => console.log(help));

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
    client.getInfo().then((help) => console.log(help));
    res.send(this.help);
    // res.send('The sedulous hyena ate the antelope!');
  });