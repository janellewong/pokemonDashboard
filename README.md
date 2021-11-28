# CPSC 304 Project - Pokémon Storage

Original Project Template from [https://github.com/dashboardphilippines/boilerplate-fullstack](https://github.com/dashboardphilippines/boilerplate-fullstack) (Made by Philly)

# Project Description

Our project looks into Pokémon, and attempts to create an application that is similar to the digital storage system utilized within the video games. Using the vast array of Pokémon species and regions requires the efficient storage and access of data. This project will make use of a system capable of storing a trainer’s Pokemon, as well as exploring important and identifying information associated with them.  


# Database Specifications

By definition, a database is an organized collection of related data usually stored on disk which has entities and relationships. The purpose of our database is to store, query, and update data on Pokemon while authenticating users’ on data access. Databases allow us to build relationships between data -- it provides functionality for quick analytics towards end-users in a very simple way to use. Using its organized structure allows us to build applications quickly and efficiently.

The main user of our database will be the Pokémon trainer, who uses the system to store their caught Pokemon. While the trainer will be able to view information about themselves and their Pokemon in the system, they cannot change any data associated with the Pokemon, except for adding and removing them entirely.  The database will keep track of various pieces of info, such as the Pokemon’s abilities, location they were initially caught in, items they may hold and their species, as well as offer some description of them.

## Additional Credits:
Type Match-Ups CSS from: [https://pokemondb.net/type](https://pokemondb.net/type)

## Changes made from previous Milestones
- Reverted normalized tables from milestone 2 to original tables (Item and Pokemon), as the attributes we added to be able to normalize them did not make much sense (Rachel gave us the OK for this on Piazza!)

- Removed some attributes from ‘Pokemon’ to make insertions simpler

- Changed some of the queries we listed in Milestone 3 after understanding the criteria better

- Pokemon no longer needs to have moves, so that an insertion of moves with every pokemon is no longer necessary (In this world, Pokemon can just be pets that don’t have to have combative abilities!)

- We initially wanted to go for using a tech stack that involved the use of REST APIs and React (through Next.JS) since the majority of the group is also currently taking CPSC 310. Though after doing Lab 7 on PHP, we quickly realized that adding React to our project would add a lot of unnecessary overhead, which would steer the direction of the project towards a CPSC 310 project rather than a CPSC 304 project. This is why we revamped our stack to a Server-Side Rendered project (where the HTML gets generated on the Node.JS side) similar to that of the PHP project from Lab 7. By reducing tech overhead, it allows our team to build code faster in a fraction of time.
 

