import React from 'react'
import { NextPage } from 'next'
import Pokemon from 'frontend/components/pokemon'

const PikachuPage: NextPage = () => {
  return (
    <div>
      <Pokemon
        name="Pikachu"
        image="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
      />
      <Pokemon
        name="Bulbasaur"
        image="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
      />
    </div>
  )
}

export default PikachuPage
