#!/usr/bin/env node
const http = require('http')
const url = require('url')
const request = require('request')
var program = require('commander');

const createHandler = require('./lib/index')

function string(value) {
  return value.toString()
}

function parseRewrite(value, list) {
  const paths = value.split('->').map(val => val.trim());
  if (path.length !== 2) {
    return list;
  }
  return [...list, { source: paths[0], destination: paths[1] }];
}

program
  .version('0.0.9')
  .option('-u, --url <s>', 'The URL to proxy to', string)
  .option('-r, --rewrite "<s> -> <s>"', 'Rewrite paths from source to destination', parseRewrite, [])
  .option('-p, --port <n>', 'Port to serve the proxy requests on', parseInt)
  .option('-h, --use-headers', 'Send token as a http header instead of url query (Default = false)')
  .option('-n, --token-name <s>', 'Name of the token query parameter / header name. (Default = token)', string)
  .option('-t, --token <s>', 'Token to use for all requests', string)
  .option('-r, --read-only', 'Read only API calls. (Default = false)')
  .parse(process.argv)

const { port = 3000, useHeaders, tokenName, token = 'token', readOnly, rewrites, url: proxyUrl } = program;

// Parse CLI parameters
if (!proxyUrl || !proxyUrl.length) {
  console.log('No url was passed to proxy from')
  program.help()
  process.exit(1)
}

const server = http
  .createServer(
    createHandler({ proxyUrl, token, useHeaders, tokenName, readOnly, rewrites })
  )
  .listen(port)

console.log('Proxying to ' + proxyUrl)
console.log('Proxified URL http://localhost:' + port)
