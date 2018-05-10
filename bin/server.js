#! /usr/bin/env node

const WS = require('ws')
const port = Number.parseInt(process.env.PORT, 10)

const websocketServer = new WS.Server({ port })

websocketServer.on('listening', _ => console.log(`Echo WebSocket server Listening on ${port}`))

websocketServer.on('connection', ws => {
  const echo = ws.send.bind(ws)

  ws.on('message', echo)
})
