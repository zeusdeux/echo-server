#! /usr/bin/env node

const http = require('http')
const debug = require('debug')
const {resolve} = require('path')


const express = require('express')
const app = express()
const httpServer = http.createServer(app)

const bodyParser = require('body-parser')
const logger = require('morgan')
const httpLog = debug('echo:http')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(resolve(__dirname, '..', 'public')))

app.all('*', ({headers, subdomains, path, query, protocol, hostname, ip, originalUrl, method, body}, res) => {
  if (headers['x-forwarded-for']) {
    ip = (headers['x-forwarded-for'] || '').split(/\s*,\s*/)[0]
  }

  res.json({
    protocol,
    hostname,
    subdomain: (subdomains || []).join('.'),
    ip,
    method,
    path,
    url: originalUrl,
    query,
    body
  })
})

app.use((err, _, res, next) => {
  console.error(err)
  console.error(err.stack)
  res.status(500).send('Oops! Something broke :(')
})

httpServer.listen(8585, _ => {
  httpLog(`HTTP server listening on 8585`)
  wsLog(`WS server listening on 8585`)
})

const WS = require('ws')
const websocketServer = new WS.Server({ noServer: true })
const wsLog = debug('echo:ws')

// share the http server from above for websocket by handling
// the http upgrade request using the ws package
httpServer.on('upgrade', (req, socket, head) => {
  httpLog('Received an HTTP UPGRADE request')
  websocketServer.handleUpgrade(req, socket, head, ws => {
    websocketServer.emit('connection', ws, req)
  })
})

websocketServer.on('connection', (ws, {headers, socket: {remoteAddress}}) => {
  let ip
  const echo = d => {
    wsLog(`Responding with ${d} to ${ip}`)
    ws.send(d)
  }

  if (headers['x-forwarded-for']) {
    ip = (headers['x-forwarded-for'] || '').split(/\s*,\s*/)[0]
  } else {
    ip = remoteAddress
  }

  wsLog(`New websocket connection from ${ip}`)

  ws.on('message', echo)
  ws.on('close', _ => {
    wsLog(`Closed connection for ${ip}`)
  })
})
