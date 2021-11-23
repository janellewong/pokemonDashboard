import { Router } from 'express'
import mysql from 'mysql2/promise'

const router = Router()

router.get('/', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('SELECT * FROM test;')
  return res.render('index.njk', { items: queryData })
})

export default router
