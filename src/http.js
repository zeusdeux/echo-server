const http = require('http')
const { resolve } = require('path')
const express = require('express')

module.exports = httpLog => {
  const app = express()
  const logger = require('morgan')
  const bodyParser = require('body-parser')

  app.use(logger('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use('/hello', express.static(resolve(__dirname, '..', 'public')))

  app.all('*', (req, res) => {
    let { headers, path, query, ip, originalUrl, method, body } = req

    if (headers['x-forwarded-for']) {
      ip = (headers['x-forwarded-for'] || '').split(/\s*,\s*/)[0]
    }

    res.json({
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

  return http.createServer(app)
}
