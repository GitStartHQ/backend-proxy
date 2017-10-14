#!/usr/bin/env node
const http = require('http')
const url = require('url')
const request = require('request')
var program = require('commander');

const createHandler = require('./lib/index')

var proxyUrl = ''
var token = ''
var tokenName = 'token'
var readOnly = false
var useHeaders = false
var port = 3000

function string(value) {
  return value.toString()
}

program
  .version('0.1.0')
  .option('-u, --url <s>', 'The URL to proxy to', string)
  .option('-p, --port <n>', 'Port to serve the proxy requests on', parseInt)
  .option('-h, --use-headers', 'Send token as a http header instead of url query (Default = false)')
  .option('-n, --token-name <s>', 'Name of the token query parameter / header name. (Default = token)', string)
  .option('-t, --token <s>', 'Token to use for all requests', string)
  .option('-r, --read-only', 'Read only API calls. (Default = false)')
  .parse(process.argv)

// Parse CLI parameters
if (!program.url || !program.url.length) {
  console.log('No url was passed to proxy from')
  program.help()
  process.exit(1)
} else {
  proxyUrl = program.url  
}
if (program.port) {
  port = program.port  
}
if (program.useHeaders) {
  useHeaders = program.useHeaders  
}
if (program.tokenName) {
  tokenName = program.tokenName  
}
if (program.token) {
  token = program.token  
}
if (program.readOnly) {
  readOnly = program.readOnly  
}

const server = http
  .createServer(
    createHandler({ proxyUrl, token, useHeaders, tokenName, readOnly })
  )
  .listen(port)

console.log('Proxying to ' + proxyUrl)
console.log('Proxified URL http://localhost:' + port)
