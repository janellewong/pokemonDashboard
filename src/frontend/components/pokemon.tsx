import React from 'react'

const Pokemon = ({ name, image }: any) => {
  return (
  <div>
    <h1>{name}</h1>
    <img src={image} />
    <p>pika pika!!!</p>
  </div>
  )
}

export default Pokemon
