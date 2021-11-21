require('dotenv').config()
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import next from 'next'
import { parse } from 'url'

const app = express()
app.set('trust proxy', true)
app.use(cors())
app.use(compression())

const dev = process.env.NODE_ENV !== 'production'
const nextJSApp = next({ dir: './src/frontend', dev })
const handle = nextJSApp.getRequestHandler()

app.get('/api/pokemon', (req, res) => {
  return res.json([
    {
      id: 1,
      name: 'Bulbasaur'
    },
    {
      id: 25,
      name: 'Pikachu'
    }
  ])
})

nextJSApp.prepare().then(() => {
  app.use((req: any, res: any) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server Ready on port ${process.env.PORT || 3000}`)
  })
})
