const express = require('express')

const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')

app.use(logger('combined'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.all('*', (req, res) => {
  let { headers, path, query, ip, originalUrl, method, body } = req

  if (headers['x-forwarded-for']) {
    ip = (headers['x-forwarded-for'] || '').split(/\s*,\s*/)[0]
  }
  console.log('request body ->', body)
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

module.exports = app
