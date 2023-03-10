import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import fetch from 'node-fetch';

import bodyParser from 'body-parser';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
var Sellsy = require("node-sellsy").default;


dotenv.config();

const app = express()
app.use(cors());

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


;["CONSUMER_KEY", "CONSUMER_SECRET"].forEach(key => {
  if (!process.env[key]) {
    console.error(`⚠️  missing ${key} environment variable. please refer to the README.\n`)
    process.exit(1)
  }
})

app.get("/", (req, res) => {
  if (!req.headers['x-user-token'] || !req.headers['x-user-secret']) {
    res.json({
      error: true,
      msg: 'missing headers'
    })
    return;
  }
  var sellsy = new Sellsy({
    creds: {
      consumerKey: process.env.CONSUMER_KEY,
      consumerSecret: process.env.CONSUMER_SECRET,
      userToken: req.headers['x-user-token'],
      userSecret: req.headers['x-user-secret']
    }
  })
  sellsy
    .api({
      method: req.query.method,
      params: req.query.params && JSON.parse(req.query.params)
    })
    .then(data => {
      res.json(data)
    })
    .catch(e => {
      res.json({
        error: true,
        e
      })
    })
})


// proxify sellsy calls as-is
// compat with node-bookeo client-side
const sellsyProxy = (req, res) => {

  var url = 'https://apifeed.sellsy.com/0/'

  let params = "";
  params += `&request=${req.body.request}`;
  params += `&io_mode=${req.body.io_mode}`;
  params += `&do_in=${encodeURIComponent(req.body.do_in)}`;

  return fetch(url /*"http://127.0.0.1:8282"*/, {
    method: req.method,
    headers: {
      'authorization': req.headers.authorization,
      'content-type': req.headers['content-type'],
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS, GET',
    },
    body: params
  }).then(r => r.json())
  .then(json => {
    res.json(json)
    return json
  }).catch(r => {
    console.error(r)
    res.json({
      error: r
    })
  })

}

app.post("/", sellsyProxy)

const PORT = process.env.PORT || 8282

app.listen(PORT, () => {
  console.log(`sellsy-proxy listening on http://127.0.0.1:${PORT}`)
})