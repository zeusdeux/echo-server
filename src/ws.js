const WS = require('ws')

module.exports = wsLog => {
  const websocketServer = new WS.Server({ noServer: true })

  websocketServer.on(
    'connection',
    (ws, { headers, socket: { remoteAddress } }) => {
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
    }
  )

  return websocketServer
}
