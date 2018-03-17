#!/usr/bin/env node
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const url = require('url')
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

function parseUrls(value, urls) {
  return [...urls, value];
}

function parseMappings(value, mappings) {
  const paths = value.split('->').map(val => val.trim())
  if (paths.length !== 2) {
    console.log('Parse Error: can not parse the mapping ', value)
    return mappings
  }
  if (!Number.isInteger(+paths[1])) {
    console.log('Error: can only map to a number which specifies the number for url ', paths[1])
  }

  return [...mappings, { source: paths[0], destination: +paths[1]}]
}

program
  .version('0.0.12')
  .option('-u, --url <s>', 'The URL to proxy to', parseUrls, [])
  .option('-d, --debug', 'Log info while proxifying requests (Default = false)')
  .option(
    '-r, --rewrite "<s> -> <d>"',
    'Rewrite paths from source to destination',
    parseRewrite,
    []
  )
  .option(
    '-m, --map "<s> -> <d>"',
    'Maps paths to the url index',
    parseMappings,
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
  map: mappings,
  url: proxyUrls
} = program

// Parse CLI parameters
if (!proxyUrls || !proxyUrls.length) {
  console.log('No url was passed to proxy from')
  program.help()
  process.exit(1)
}

const handler = createHandler({
  proxyUrls,
  token,
  useHeaders,
  debug,
  tokenName,
  readOnly,
  rewrites,
  mappings,
  secure
})
const onListen = err => {
  if (err) {
    console.log('got back error initiating the server: ', err)
    return
  }

  console.log(
    `Proxying requests from ${secure
      ? 'https'
      : 'http'}://localhost:${port} => ${proxyUrls.map(url => (`\n\t ${url}`))}`
  )
  if (debug) {
    rewrites.map(r => console.log(`Rewrite ${r.source} => ${r.destination}`))
  }
}

if (!secure) {
  http.createServer(handler).listen(port, onListen)
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
