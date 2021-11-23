require('dotenv').config()
import express from 'express'
import mysql from 'mysql2/promise'
import nunjucks from 'nunjucks'
import routes from './routes'

const app = express()

nunjucks.configure('templates', {
  autoescape: true,
  express: app
});

(async () => {
  const database = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
  })

  app.locals.database = database

  app.use(routes)

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server Ready on port ${process.env.PORT || 3000}`)
  })
})()
