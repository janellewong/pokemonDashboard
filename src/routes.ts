import { Router } from 'express'
import mysql from 'mysql2/promise'
import routesInitializers from './routes-initializers'

const router = Router()

router.use('/initialize', routesInitializers)

function generateWhereClause(type, level, sign, move) {
  const str = []
  if (type) {
    str.push(`SpeciesHasType.TypeName = "${type}"`)
  }
  if (level && sign) {
    str.push(`Pokemon.Level ${sign} "${level}"`)
  }
  if (move) {
    str.push(`PokemonHasMove.MoveName = "${move}"`)
  }
  return str
}

//Filter by Type (Projection query & selection query)
router.get('/', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const [types] = await db.query(`
    SELECT * FROM Type
  `)
  console.log(req.query)
  const type = req.query.typeName
  const level = req.query.nlevel
  const sign = req.query.sign
  const move = req.query.moveName
  let pokemons: any = []
  const [pokemonSpecies] = await db.query('SELECT Species.PokedexID as id, Species.Name as name FROM Species;')
  const [locations] = await db.query('SELECT Location.Name as name FROM Location;')
  const [items] = await db.query('SELECT Item.Name as name FROM Item;')
  const [moves] = await db.query('SELECT Move.Name as name FROM Move;')

  let mainQuery = `
    SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Species.PokedexID as PokedexID, Pokemon.Level as level, SpeciesHasType.TypeName as typeName, Pokemon.Item as item, Pokemon.Gender as gender, Pokemon.LocationName as location, Pokemon.RegionName as region, GROUP_CONCAT(PokemonHasMove.MoveName) as moves
    FROM Pokemon
    JOIN Species ON Pokemon.PokedexID = Species.PokedexID
    JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
    LEFT JOIN PokemonHasMove ON PokemonHasMove.PokemonID = Pokemon.PokemonID
    GROUP BY Pokemon.PokemonID;
  `

  if (Object.keys(req.query).length > 0) {
    const clause = generateWhereClause(type, level, sign, move)
    mainQuery = `
      SELECT Pokemon.Name as nickname, Pokemon.PokemonID as ID, Species.Name as pokemonName, Species.PokedexID as PokedexID, Pokemon.Level as level, SpeciesHasType.TypeName as typeName, Pokemon.Item as item, Pokemon.Gender as gender, Pokemon.LocationName as location, Pokemon.RegionName as region, GROUP_CONCAT(PokemonHasMove.MoveName) as moves
      FROM Pokemon
      JOIN Species ON Pokemon.PokedexID = Species.PokedexID
      JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
      LEFT JOIN PokemonHasMove ON PokemonHasMove.PokemonID = Pokemon.PokemonID
      ${clause.length > 0 ? 'WHERE ' + generateWhereClause(type, level, sign, move).join(' AND ') : ''}
      GROUP BY Pokemon.PokemonID;
    `

  }
  const [queryData] = await db.query(mainQuery)
  pokemons = (queryData as any[]).map(x => {
    return { ...x, moves: x.moves?.split(',') }
  })
  return res.render('index.njk', { pokemons, types, navbar: true, pokemonSpecies, locations, items, moves, mainQuery })
})

router.get('/assistant', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const { typeLevelAggregationQueryRun, maxLevelPokemonQueryRun, allMovesQueryRun } = req.query
  const typeLevelAggregationQuery = `
  SELECT SpeciesHasType.TypeName as type, ROUND(AVG(Pokemon.Level), 0) as level, COUNT(Pokemon.PokedexID) as count
  FROM Pokemon
  JOIN Species ON Pokemon.PokedexID = Species.PokedexID
  JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
  GROUP BY SpeciesHasType.TypeName
  ORDER BY level DESC;
  `
  const maxLevelPokemonQuery = `
  SELECT Temp.typeName, Temp.nickName, Temp.pokemonName, Temp.ID, Temp.Level, MAX(Temp.level), Temp.PokedexID
  FROM (SELECT Pokemon.Name            as nickName,
              Pokemon.PokemonID       as ID,
              Pokemon.PokedexID       as PokedexID,
              Species.Name            as pokemonName,
              Pokemon.Level           as level,
              SpeciesHasType.TypeName as typeName
        FROM Pokemon
        JOIN Species ON Pokemon.PokedexID = Species.PokedexID
        JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID) AS Temp
  GROUP BY Temp.typeName;
  `
  const allMovesQuery = `
  SELECT Move.Name
  FROM   Move
  WHERE NOT EXISTS (
    SELECT Pokemon.name
    FROM  Pokemon
    WHERE  NOT EXISTS (
      SELECT  PHM.PokemonID
      FROM  PokemonHasMove PHM
      WHERE  Move.Name = PHM.MoveName
        AND Pokemon.PokemonID = PHM.PokemonID))
  `

  const [typeLevelAggregation] = await db.query(typeLevelAggregationQuery)
  const [maxLevelPokemon] = await db.query(maxLevelPokemonQuery)
  const [allMoves] = await db.query(allMovesQuery)

  return res.render('assistant.njk', {
    navbar: true,
    typeLevelAggregation: typeLevelAggregationQueryRun ? typeLevelAggregation : false,
    typeLevelAggregationQuery,
    maxLevelPokemon: maxLevelPokemonQueryRun ? maxLevelPokemon : false,
    maxLevelPokemonQuery,
    allMoves : allMovesQueryRun ? allMoves : false,
    allMovesQuery
  })
})

function makePokedexQuery(query: Record<string, string | string[]>) {
  const str = []
  if (query.regions) {
    if (Array.isArray(query.regions)) {
      str.push(`Species.RegionName IN (${query.regions.map(x => `"${x}"`).join(', ')})`)
    } else {
      str.push(`Species.RegionName = "${query.regions}"`)
    }
  }
  if (query.types) {
    if (Array.isArray(query.types)) {
      str.push(`SpeciesHasType.TypeName IN (${query.types.map(x => `"${x}"`).join(', ')})`)
    } else {
      str.push(`SpeciesHasType.TypeName = "${query.types}"`)
    }
  }
  return str
}

//Join Query + Projection + Aggregation (with HAVING -- using Group By to eliminate duplicate records from Joins)
router.get('/pokedex', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  const query = `
    SELECT Species.PokedexID as id, Species.Name as name, Species.RegionName as region,  SpeciesHasType.TypeName as type
    FROM Species
    JOIN SpeciesHasType ON SpeciesHasType.PokedexID = Species.PokedexID
    GROUP BY id
    ${ Object.keys(req.query).length > 0 ? 'HAVING ' + makePokedexQuery(req.query as any).join(' AND ') : '' };
  `
  const [queryData] = await db.query(query)
  return res.render('pokedex.njk', { species: queryData, query })
})

//Insert Pokemon (Insert query)
router.get('/insert', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const nickName = req.query.nickName
  const species = req.query.species
  const level = req.query.level
  const item = req.query.item
  const location = req.query.location
  const gender = req.query.gender

  if(item) {
    await db.query(`
    INSERT INTO Pokemon (Name, Gender, Level, Item, TrainerID, PokedexID, LocationName, RegionName)
    VALUES ("${nickName}", "${gender}", "${level}", "${item}", 1, "${species}", "${location}", (SELECT RegionName FROM Location WHERE Name = "${location}") );
  `)
  } else {
    await db.query(`
    INSERT INTO Pokemon (Name, Gender, Level, Item, TrainerID, PokedexID, LocationName, RegionName)
    VALUES ("${nickName}", "${gender}", "${level}", NULL, 1, "${species}", "${location}", (SELECT RegionName FROM Location WHERE Name = "${location}") );
  `)
  }

  return res.redirect('/')
})

//Delete Query
router.get('/deletion', async (req, res) => {
  console.log(req.query)
  const db = req.app.locals.database as mysql.Connection
  const ID = req.query.itemID
  await db.query(`
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

  await db.query(`
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
  if (newMove) {
    await db.query(`INSERT INTO PokemonHasMove VALUES ("${ID}", 1, "${newMove}")`)
  }
  return res.redirect('/')
})

//Remove Moves
router.get('/removeMove', async (req, res) => {
  const db = req.app.locals.database as mysql.Connection
  console.log(req.query)
  const ID = req.query.ID
  const newMove = req.query.move

  if (newMove) {
    await db.query(`DELETE FROM PokemonHasMove WHERE (PokemonID = "${ID}" AND MoveName = "${newMove}" AND TrainerID = "1")`)
  }
  return res.redirect('/')
})

export default router
