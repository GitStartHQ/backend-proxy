#!/usr/bin/env node
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const url = require('url')
const request = require('request')
var program = require('commander')

const pkey = fs.readFileSync(path.join(__dirname, 'certs/server.key'))
const pcert = fs.readFileSync(path.join(__dirname, 'certs/server.crt'))
const createHandler = require('./lib/index')

function string(value) {
  return value.toString()
}

function parseRewrite(value, list) {
  const paths = value.split('->').map(val => val.trim())
  if (paths.length !== 2) {
    console.log('Parse Error: can not parse the rewrite ', value)
    return list
  }
  return [...list, { source: paths[0], destination: paths[1] }]
}

program
  .version('0.0.9')
  .option('-u, --url <s>', 'The URL to proxy to', string)
  .option('-d, --debug', 'Log info while proxifying requests (Default = false)')
  .option(
    '-r, --rewrite "<s> -> <d>"',
    'Rewrite paths from source to destination',
    parseRewrite,
    []
  )
  .option('-p, --port <n>', 'Port to serve the proxy requests on', parseInt)
  .option(
    '-h, --use-headers',
    'Send token as a http header instead of url query (Default = false)'
  )
  .option(
    '-n, --token-name <s>',
    'Name of the token query parameter / header name. (Default = token)',
    string
  )
  .option(
    '-s, --secure',
    'Listen on https instead of http, a self signed ssl certificate will be used (Default = false)'
  )
  .option('-t, --token <s>', 'Token to use for all requests', string)
  .option('-r, --read-only', 'Read only API calls. (Default = false)')
  .parse(process.argv)

const {
  port = 3000,
  useHeaders,
  tokenName = 'token',
  secure,
  token,
  debug,
  readOnly,
  rewrite: rewrites,
  url: proxyUrl
} = program

// Parse CLI parameters
if (!proxyUrl || !proxyUrl.length) {
  console.log('No url was passed to proxy from')
  program.help()
  process.exit(1)
}

const handler = createHandler({
  proxyUrl,
  token,
  useHeaders,
  debug,
  tokenName,
  readOnly,
  rewrites,
  secure
})
const errorHandler = err => {
  if (err) {
    console.log('got back error initiating the server: ', err)
    return
  }

  console.log(
    `Proxying requests from ${secure
      ? 'https'
      : 'http'}://localhost:${port} => ${proxyUrl}`
  )
  if (debug) {
    rewrites.map(r => console.log(`Rewrite ${r.source} => ${r.destination}`))
  }
}

if (!secure) {
  http.createServer(handler).listen(port, errorHandler)
} else {
  https
    .createServer(
      {
        key: pkey,
        cert: pcert
      },
      handler
    )
    .listen(port, errorHandler)
}
