# backend-proxy
[![CircleCI](https://circleci.com/gh/murcul/backend-proxy.svg?style=shield)](https://circleci.com/gh/murcul/backend-proxy) [![npm version](https://badge.fury.io/js/backend-proxy.svg)](https://badge.fury.io/js/backend-proxy) [![npm](https://img.shields.io/npm/dt/backend-proxy.svg)](https://www.npmjs.com/package/backend-proxy)

Backend proxy is a tool to route your REST API through a proxy

## Install

```bash
$ npm i -g backend-proxy
```

## Usage

```bash
$ backend-proxy --url PROXY_URL --token-name --token TOKEN --use-headers --port 3000 --read-only
```

## Options

| Option        | Input         | Default  | Required |
| :-------------: |:-------------:| :-----:| :-----:|
| --port | Port on which proxy will serve requests | 3000 |  |
| --url | Url to proxy to | N/A | * |
| --secure | Listen over https instead of http. Will use a test self signed certificate | false |  |
| --token-name | Name of the token query parameter / header name used to pass token | token |  |
| --token | Token to use for requests | N/A |  |
| --use-headers | Pass token as a http header instead of a url query string | false |  |
| --read-only | Only allow GET requests | false |  |
| --rewrite | Transforms paths from when proxying request | * |  |
| --debug | Print extra information for debugging | false |  |
| --secure | Print extra information for debugging | false |  |


## Example

```bash
$ backend-proxy --url https://reqres.in/api
```
Then
```bash
GET http://localhost:3000/users/2
```
proxies to
```bash
GET https://reqres.in/api/users/2
```

### Path Rewrites
`--rewrite` option can be used multiple times to transform many paths like so:
```bash
$ backend-proxy --url https://reqres.in/api --rewrite "/users -> /clients" --rewrite "/customers -> /clients"
```
Then
```bash
GET http://localhost:3000/users/2
GET http://localhost:3000/customers/4
```
proxies to
```bash
GET https://reqres.in/api/clients/2
GET https://reqres.in/api/clients/4
```

### URL mappings
`--map` option can be used to select a url if multiple urls are given. This can be used in scenarios where
multiple paths map to different urls.

```bash
$ backend-proxy --url http://url_1.com --url http://url_2.com --map "/users -> 0" --map "/posts -> 1"
```

In above example, `/users/25` will proxy to `http://url_1.com/users/25` where as `/posts/22` will proxy to `http://url_2.com/posts/22`
Note that url that comes first gets precedence. Either the first mapping matched will be used, or fall back to first url given. The mapped number is an index, and starts from 0 not 1

## License

Licensed under the [MIT License](https://github.com/murcul/backend-proxy/blob/master/LICENSE)

[View this on npm](https://www.npmjs.com/package/backend-proxy)

Made with ❤ by [Rikin Katyal](https://github.com/sirvar)

