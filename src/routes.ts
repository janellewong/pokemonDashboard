import { Router } from 'express'
import mysql from 'mysql2/promise'
import routesInitializers from './routes-initializers'

const router = Router()

router.use('/initialize', routesInitializers)

//Join Query + Projection
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
      SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      WHERE SpeciesHasType.TypeName = "${type}"
      GROUP BY Pokemon.PokemonID;
    `)
    pokemons = queryData
  } else {
    const [queryData] = await db.query(`
      SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      GROUP BY Pokemon.PokemonID;
    `)
    pokemons = queryData
  }
  return res.render('index.njk', { items: pokemons, types })
})

//Insert Query
router.get('/insert', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const ID = req.query.ID
  const nickName = req.query.nickName
  const species = req.query.species
  const level = req.query.level
  const item = req.query.item
  const location = req.query.location
  const gender = req.query.gender
  const region = req.query.region

  const [queryData] = await db.query(`
      SELECT * 
      FROM Location
      WHERE Location.Name = "${location}" and Location.RegionName = "${region}"
    `)
  if(queryData){
    if(item) {
      await db.query(`
      INSERT INTO Pokemon
      VALUES ("${ID}", "${nickName}", "${gender}", "${level}", "${item}", 1, "${species}", "${location}", "${region}" );
    `)
    } else {
      await db.query(`
      INSERT INTO Pokemon
      VALUES ("${ID}", "${nickName}", "${gender}", "${level}", NULL, 1, "${species}", "${location}", "${region}" );
    `)
    }
  }
  return res.redirect("/")
})

//Delete Query
router.get('/deletion', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('DELETE FROM Pokemon1 WHERE Name = "Pikachu";')
  return res.render('index.njk', { items: queryData })
})

//Sort Query
router.get('/sort', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query('SELECT * FROM Pokemon1 ORDER BY Level ASC;')
  return res.render('index.njk', { items: queryData })
})

//Update Query
router.get('/updateName', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const ID = req.query.insID
  const NewName = req.query.insName

  const [queryData] = await db.query(`
      UPDATE Pokemon
      SET Name = "${NewName}"
      WHERE PokemonID = "${ID}"
    `)
  return res.redirect("/")

})

//Nested Aggregation Query
router.get('/maxLevel', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const [queryData] = await db.query(`
    SELECT Temp.typeName, Temp.nickName, Temp.pokemonName, Temp.ID, Temp.Level, MAX(Temp.level)
    FROM (SELECT Pokemon.Name            as nickName,
                 Pokemon.PokemonID       as ID,
                 Species.Name            as pokemonName,
                 Pokemon.Level           as level,
                 SpeciesHasType.TypeName as typeName
          FROM Pokemon
          JOIN Species ON Pokemon.PokedexID = Species.PokedexID
          JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID) AS Temp
    GROUP BY Temp.typeName;
  `)
  return res.render('index.njk', { maxs: queryData })
})



export default router