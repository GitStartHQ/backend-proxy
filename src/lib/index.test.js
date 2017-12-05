const createHandler = require('./index')
const request = require('supertest')
const http = require('http')

const closeTestServer = server =>
  new Promise((resolve, reject) => {
    server.close()
    server.on('close', err => {
      if (err) return reject(err)
      return resolve()
    })
  })

const createTestServer = handler =>
  new Promise((resolve, reject) => {
    const server = http.createServer(handler)
    server.listen(0, err => {
      if (err) return reject(err)
      return resolve(server)
    })
  })

const jsonHandler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ data: { name: 'John', age: 23 } }))
}

const infoHandler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({ url: req.url, headers: req.headers, method: req.method })
  )
}

const postHandler = (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(500)
    return res.end('Invalid request!')
  }

  let body = ''
  res.writeHead(200, { 'Content-Type': 'application/json' })
  req.on('data', data => (body += data))
  req.on('end', () => {
    res.end(
      JSON.stringify({
        body
      })
    )
  })
}

describe('Backend proxy lib', () => {
  describe('With JSON server', () => {
    let testServer, proxyServer
    beforeAll(async () => {
      testServer = await createTestServer(jsonHandler)
    })

    afterAll(async () => {
      await closeTestServer(testServer)
    })

    beforeEach(() => {
      proxyServer = http.createServer(
        createHandler({
          proxyUrl: `http://localhost:${testServer.address().port}`
        })
      )
    })

    it('respects CORS', async () => {
      const response = await request(proxyServer)
        .get('/users?length=25')
        .set('access-control-request-method', 'GET')
        .set('origin', 'http://localhost:8080')
        .set('access-control-request-method', 'GET')

      expect(response.header).toEqual(
        expect.objectContaining({
          'access-control-allow-credentials': 'true',
          'access-control-allow-methods': 'GET',
          'access-control-allow-origin': 'http://localhost:8080'
        })
      )
    })

    it('sends back data properly', async () => {
      const response = await request(proxyServer).get('/users?page=3')
      expect(response.body).toEqual({
        data: { name: 'John', age: 23 }
      })
    })
  })

  describe('When read only', () => {
    it('passes get request properly', async () => {
      const testServer = await createTestServer(jsonHandler)
      const proxyServer = http.createServer(
        createHandler({
          proxyUrl: `http://localhost:${testServer.address().port}`,
          readOnly: true
        })
      )

      expect((await request(proxyServer).get('/users')).body).toEqual({
        data: { name: 'John', age: 23 }
      })

      await closeTestServer(testServer)
    })

    it('blocks post, put & delete requests', async () => {
      // Note: we use a dummy proxy url that fails to make sure proxy does not
      // make a request to that url when blocking readonly requests
      const proxyServer = http.createServer(
        createHandler({ proxyUrl: `http://random_url.co/api`, readOnly: true })
      )

      expect((await request(proxyServer).post('/users')).status).toBe(500)
      expect((await request(proxyServer).put('/users')).status).toBe(500)
      expect((await request(proxyServer).delete('/users')).status).toBe(500)
    })
  })

  describe('when given path rewrites', () => {
    let testServer, proxyServer
    beforeAll(async () => {
      testServer = await createTestServer(infoHandler)
    })

    afterAll(async () => {
      await closeTestServer(testServer)
    })

    beforeEach(() => {
      proxyServer = http.createServer(
        createHandler({
          proxyUrl: `http://localhost:${testServer.address().port}/api/1`,
          rewrites: [{ source: '/old_path', destination: '/new_path' }],
        })
      )
    })

    it('rewrites the path properly', async () => {
      expect((await request(proxyServer).get('/old_path?length=25')).body).toEqual(
        expect.objectContaining({
          url: '/api/1/new_path?length=25'
        })
      )
    })
  })

  describe('when given a specific token', () => {
    let testServer, proxyServer
    beforeAll(async () => {
      testServer = await createTestServer(infoHandler)
    })

    afterAll(async () => {
      await closeTestServer(testServer)
    })

    beforeEach(() => {
      proxyServer = http.createServer(
        createHandler({
          proxyUrl: `http://localhost:${testServer.address().port}/api/1`,
          tokenName: 'testToken',
          token: '123'
        })
      )
    })

    it('generates the correct url with token', async () => {
      expect((await request(proxyServer).get('/users?length=25')).body).toEqual(
        expect.objectContaining({
          url: '/api/1/users?length=25&testToken=123'
        })
      )
    })

    it('suppors http header tokens', async () => {
      const anotherProxyServer = http.createServer(
        createHandler({
          proxyUrl: `http://localhost:${testServer.address().port}/api/1`,
          tokenName: 'test-token',
          token: '123',
          useHeaders: true
        })
      )

      const response = await request(anotherProxyServer).get('/users?length=25')
      expect(response.body.headers['test-token']).toEqual('123')
      expect(response.body.url).toEqual('/api/1/users?length=25')
    })
  })

  describe('when posting things', () => {
    let testServer, proxyServer
    beforeAll(async () => {
      testServer = await createTestServer(postHandler)
    })

    afterAll(async () => {
      await closeTestServer(testServer)
    })

    beforeEach(() => {
      proxyServer = http.createServer(
        createHandler({
          proxyUrl: `http://localhost:${testServer.address().port}/api/1`
        })
      )
    })

    it('posts data properly', async () => {
      const postBody = `{ "email": "peter@klaven", "password": "cityslicka" }`
      const response = await request(proxyServer)
        .post('/create')
        .set('Content-Type', 'application/json')
        .send(postBody)

      expect(response.body).toEqual({ body: postBody })
    })
  })

  describe('Test proxy', () => {
    let server
    beforeEach(() => {
      server = http.createServer(
        createHandler({ proxyUrl: 'https://reqres.in/api' })
      )
    })
    it('Proxy JSON properly', async () => {
      const response = await request(server).get('/users?page=3')
      expect(response.statusCode).toEqual(200)
    })
    it('Get body properly', async () => {
      const response = await request(server).get('/users/2')
      expect(response.body.data.id).toEqual(2)
    })
  })

  describe('Proxy with read only', () => {
    let server
    beforeEach(() => {
      server = http.createServer(
        createHandler({ proxyUrl: 'https://reqres.in/api', readOnly: true })
      )
    })
    it('Test read only', async () => {
      const response = await request(server).post('/users/1')
      expect(response.statusCode).toEqual(500)
    })
  })
})
