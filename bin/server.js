#! /usr/bin/env node

const debug = require('debug')
const wsLog = debug('echo:ws')
const httpLog = debug('echo:http')

const httpServer = require('../src/http')(httpLog)
const wsServer = require('../src/ws')(wsLog)

// share the http server from above for websocket by handling
// the http upgrade request using the ws package
httpServer.on('upgrade', (req, socket, head) => {
  httpLog('Received an HTTP UPGRADE request')
  wsServer.handleUpgrade(req, socket, head, ws => {
    wsServer.emit('connection', ws, req)
  })
})

httpServer.listen(8585, _ => {
  httpLog(`HTTP server listening on 8585`)
  wsLog(`WS server listening on 8585`)
})
