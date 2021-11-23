import { Router } from 'express'
import axios from 'axios'

// These are routes meant to help initialize the database. These all return SQL statements to fill in necessary data.

const includedRegions = ['kanto', 'johto', 'hoenn', 'sinnoh']

const router = Router()

router.get('/species', async (req, res) => {
  const axiosRes = await axios('https://pokeapi.co/api/v2/pokemon-species?limit=493')
  return res.send('INSERT INTO Species (PokedexID, Name, RegionName) VALUES ' + axiosRes.data.results.map(({ name }, i) => {
    let region = 'Kanto'
    if (i+1 > 386) {
      region = 'Sinnoh'
    } else if (i+1 > 251) {
      region = 'Hoenn'
    } else if (i+1 > 151) {
      region = 'Johto'
    }
    return `(${i+1}, "${name}", "${region}")` + (i !== axiosRes.data.results.length - 1 ? ',' : ';')
  }).join(' '))
})

router.get('/species/types', async (req, res) => {
  let val = ''
  for (let i = 1; i <= 493; i++) {
    const axiosRes = await axios(`https://pokeapi.co/api/v2/pokemon/${i}`)
    for (const type of axiosRes.data.types) {
      val+=`(${i}, "${type.type.name}"),`
    }
  }
  return res.send('INSERT INTO SpeciesHasType (PokedexID, TypeName) VALUES ' + val.replace(/.$/, ';'))
})

router.get('/locations', async (req, res) => {
  let val = ''
  for (let i = 1; i <= 796; i++) {
    try {
      const axiosRes = await axios(`https://pokeapi.co/api/v2/location/${i}/`)
      const data = axiosRes.data
      if (includedRegions.includes(data.region.name)) {
        val+=`("${data.name}", "${data.region.name}"),`
      }
    } catch (e) {
      // do nothing
    }
  }
  return res.send('INSERT INTO Location (Name, RegionName) VALUES ' + val.replace(/.$/, ';'))
})

router.get('/moves', async (req, res) => {
  let val = ''
  for (let i = 1; i <= 844; i++) {
    try {
      const axiosRes = await axios(`https://pokeapi.co/api/v2/move/${i}/`)
      const data = axiosRes.data
      console.log(i, data.name, data.type.name, data.power, data.accuracy, data.damage_class.name)
      val+=`("${data.name}", "${data.type.name}", "${data.power}", "${data.accuracy}", "${data.damage_class.name}"),`
    } catch (e) {
      console.log(i)
      // do nothing
    }
  }
  return res.send('INSERT INTO Move (Name, Type, Power, Accuracy, Effect) VALUES ' + val.replace(/.$/, ';'))
})

router.get('/items', async (req, res) => {
  let val = ''
  let val2 = ''
  for (let i = 1; i <= 954; i++) {
    try {
      const axiosRes = await axios(`https://pokeapi.co/api/v2/item/${i}/`)
      const data = axiosRes.data
      if (data.attributes.some(x => x.name === 'holdable')) {
        val+=`(${i}, "${data.name}", "${data.category.name}"),`
        val2+=`("${data.name}", "${data.category.name}", "${data.effect_entries[0].short_effect}"),`
        console.log(i, data.name, data.category.name, data.effect_entries[0].short_effect)
      } else {
        throw new Error()
      }
    } catch (e) {
      console.log(i)
      // do nothing
    }
  }
  return res.send(
    'INSERT INTO Item1 (ItemID, Name, Type) VALUES ' + val.replace(/.$/, ';') +
    'INSERT INTO Item2 (Name, Type, Effect) VALUES ' + val2.replace(/.$/, ';')
  )
})

export default router
