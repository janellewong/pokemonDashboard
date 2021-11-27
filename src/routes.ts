import { Router } from 'express'
import mysql from 'mysql2/promise'
import routesInitializers from './routes-initializers'

const router = Router()

router.use('/initialize', routesInitializers)

//filter by type
router.get('/', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [types] = await db.query(`
    SELECT * FROM Type
  `)
  console.log(req.query)
  const type = req.query.typeName
  let pokemons: any = []
  if (type) {
    const [queryData] = await db.query(`
      SELECT Pokemon.Name as nickname, Species.Name as pokemonName, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      WHERE SpeciesHasType.TypeName = "${type}"
      GROUP BY Pokemon.PokemonID;
    `)
    pokemons = queryData
  } else {
    const [queryData] = await db.query(`
      SELECT Pokemon.Name as nickname, Species.Name as pokemonName, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      GROUP BY Pokemon.PokemonID;
    `)
    pokemons = queryData
  }
  return res.render('index.njk', { items: pokemons, types })
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

router.get('/updateName', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const ID = req.query.insID
  const NewName = req.query.insName

  const [queryData] = await db.query(`
      UPDATE Pokemon
      SET Name = NewName
      WHERE PokemonID = ID
    `)
  return res.render('index.njk', { items: queryData })

})

export default router