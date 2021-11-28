import { Router } from 'express'
import mysql from 'mysql2/promise'
import routesInitializers from './routes-initializers'

const router = Router()

router.use('/initialize', routesInitializers)

//Filter by Type (Projection query)
router.get('/', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [types] = await db.query(`
    SELECT * FROM Type
  `)
  console.log(req.query)
  const type = req.query.typeName
  const level = req.query.nlevel
  const sign = req.query.sign
  let pokemons: any = []
  const [pokemonSpecies] = await db.query('SELECT Species.PokedexID as id, Species.Name as name FROM Species;')
  const [typeLevelAggregation] = await db.query(`
    SELECT SpeciesHasType.TypeName as type, ROUND(AVG(Pokemon.Level), 0) as level, COUNT(Pokemon.PokedexID) as count
    FROM Pokemon
    JOIN Species ON Pokemon.PokedexID = Species.PokedexID
    JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
    GROUP BY SpeciesHasType.TypeName
    ORDER BY level DESC;
  `)
  if (type) {
    const [queryData] = await db.query(`
      SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Species.PokedexID as PokedexID, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      WHERE SpeciesHasType.TypeName = "${type}"
      GROUP BY Pokemon.PokemonID;
    `)
  } else if (level && sign) {
    const [queryData] = await db.query(`
      SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Species.PokedexID as PokedexID, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      WHERE Species.Level ${sign} "${level}"
      GROUP BY Pokemon.PokemonID;
    `)
  } else {
    const [queryData] = await db.query(`
      SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Species.PokedexID as PokedexID, Pokemon.Level as level, SpeciesHasType.TypeName as typeName
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      GROUP BY Pokemon.PokemonID;
    `)
    pokemons = queryData
  }
  return res.render('index.njk', { items: pokemons, types, navbar: true, pokemonSpecies, typeLevelAggregation })
})


//Join Query + Projection
router.get('/pokedex', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [queryData] = await db.query(`
    SELECT Species.PokedexID as id, Species.Name as name, Species.RegionName as region,  SpeciesHasType.TypeName as type
    FROM Species
    JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
    GROUP BY id;
  `)
  return res.render('pokedex.njk', { species: queryData })
})

//Insert Pokemon (Insert query)
router.get('/insert', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
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
  if( queryData[0] ){
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
  return res.redirect('/')
})

//Delete Query
router.get('/deletion', async (req, res) => {
  console.log(req.query)
  const db = req.app.locals.database as mysql.Connection
  const ID = req.query.itemID
  const [queryData] = await db.query(`
      DELETE 
      FROM Pokemon 
      WHERE (PokemonID = "${ID}" AND TrainerID = "1")
    `)
    return res.redirect('/')
})

//Sort Query
// router.get('/sort', async (req, res) => {
//   const db = req.app.locals.database as mysql.Connection
//   const [queryData] = await db.query('SELECT * FROM Pokemon1 ORDER BY Level ASC;')
//   return res.render('index.njk', { items: queryData })
// })

//Update Names (update query)
router.get('/updateName', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const ID = req.query.insID
  const NewName = req.query.insName

  const [queryData] = await db.query(`
      UPDATE Pokemon
      SET Name = "${NewName}"
      WHERE PokemonID = "${ID}"
    `)
  return res.redirect('/')

})


//Insert Moves
router.get('/insertMove', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const ID = req.query.ID
  const newMove = req.query.move

  await db.query(`
      INSERT INTO PokemonHasMove
      VALUES ("${ID}", 1, "${newMove}")
    `)
  return res.redirect('/')
})

//Find Pokemon with specific move (Join query)
router.get('/joinMoves', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const move = req.query.move

  const [queryData] = await db.query(`
      SELECT Pokemon.Name             as nickName,
             Pokemon.PokemonID        as ID
      FROM Pokemon
      JOIN PokemonHasMove ON Pokemon.PokemonID = PokemonHasMove.PokemonID
      WHERE "${move}" = PokemonHasMove.MoveName
    `)
  return res.render('index.njk', { moves: queryData })
})

//Finds max level of each type (Nested Aggregation Query)
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