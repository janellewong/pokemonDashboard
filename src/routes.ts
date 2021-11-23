import { Router } from 'express'
import mysql from 'mysql2/promise'
import routesInitializers from './routes-initializers'

const router = Router()

router.use('/initialize', routesInitializers)

router.get('/', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('SELECT * FROM test;')
  return res.render('index.njk', { items: queryData })
})

router.get('/filter/gender', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('SELECT * FROM Pokemon1 WHERE Gender = "male";')
  return res.render('index.njk', { items: queryData })
})

router.get('/insertion', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('INSERT INTO  Pokemon1 (Pokemon ID, Name, Gender, Nature, Level, ItemID, TrainerID, PokedexID, LocationName) VALUES 	(1, "Sparky", "Female", "Brave", 40, 1, 2, 25, "Pallet Town");')
  return res.render('index.njk', { items: queryData })
})

router.get('/deletion', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('DELETE FROM Pokemon1 WHERE Name = "Pikachu";')
  return res.render('index.njk', { items: queryData })
})

router.get('/sort', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('SELECT * FROM Pokemon1 ORDER BY Level ASC;')
  return res.render('index.njk', { items: queryData })
})

export default router
