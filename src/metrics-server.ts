'use strict'

import express from 'express'
import { register } from 'prom-client'

const server = express()

// Setup server for Prometheus scrapes
server.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (ex) {
    res.status(500).end(ex)
  }
})

export const metricsServer = () => {
  const port = process.env.PORT || 3000
  console.log(
    `Server listening to ${port}, metrics exposed on /metrics endpoint`
  )
  server.listen(port)
}
