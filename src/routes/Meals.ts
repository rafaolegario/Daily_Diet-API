import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/auth-middleware'

let CurrentSequence = 0


async function FindCurrentUser(req: FastifyRequest, rep: FastifyReply) {
  const sessionId = req.cookies.sessionId

  if (!sessionId) {
    return rep.status(404).send('User not found!')
  }

  const User = await knex('users').where('session_id', sessionId).first()

  if (!User) {
    return rep.status(404).send('User not found!')
  }

  return User
}

export async function Meals(app: FastifyInstance) {

  app.get('/',{ preHandler: [checkSessionIdExists] }, async (request, reply) =>{
    const User = await FindCurrentUser(request, reply)
    const user_id = User.id

    const meals = await knex('meals').where('user_id',user_id).select('*')

    if(meals.length == 0){
      return reply.status(200).send({ message:'You dont have registered meals'})
    }

    const userEmail = User.email
    const userName = User.name
    const user = {userEmail, userName}

    reply.status(200).send({ user, meals })
  })

  app.get('/:id',{ preHandler: [checkSessionIdExists] }, async (request, reply) =>{
    const User = await FindCurrentUser(request, reply)
    const user_id = User.id

    const IdParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = IdParamsSchema.parse(request.params)

    if(!id){
      return reply.status(400).send('All fields is required!')
    }

    const meal = await knex('meals').where('id',id).andWhere('user_id',user_id).first()

    if(!meal){
      return reply.status(200).send({ message:'You do not have meals registered with this ID'})
    }

    const userEmail = User.email
    const userName = User.name
    const user = {userEmail, userName}
    reply.status(200).send({user, meal })
  })

  app.post('/create',{ preHandler: [checkSessionIdExists] }, async (request, reply) => {
    const CreateMealsBodySchema = z.object({
      name: z.string(),
      calories: z.number(),
      on_diet: z.boolean(),
    })

    const { name, calories, on_diet } = CreateMealsBodySchema.parse(
      request.body,
    )

    if (!name || !calories) {
      return reply.status(400).send('All fields is required!')
    }

    const User = await FindCurrentUser(request, reply)

    const user_id = User.id

    if(on_diet){
      CurrentSequence++
      if(CurrentSequence > User.best_sequence){
        await knex('users').where('id', user_id).first().update({
          best_sequence: CurrentSequence
        })
      }
    }else{
      CurrentSequence = 0
    }

    const meal = await knex('meals').insert({
      user_id,
      id: randomUUID(),
      name,
      calories,
      on_diet,
    }).returning('*')

    reply.status(201).send(meal)
    
  })

  app.put('/:id',{preHandler:[checkSessionIdExists]}, async (request, reply) =>{
    const User = await FindCurrentUser(request, reply)
    const user_id = User.id

    const IdParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const CreateMealsBodySchema = z.object({
      name: z.string(),
      calories: z.number(),
      on_diet: z.boolean(),
    })

    const { name, calories, on_diet } = CreateMealsBodySchema.parse(
      request.body,
    )

    if (!name || !calories) {
      return reply.status(400).send('All fields is required!')
    }


    const { id } = IdParamsSchema.parse(request.params)

    if(!id){
      return reply.status(400).send('All fields is required!')
    }

    const meal = await knex('meals').where('id',id).andWhere('user_id',user_id).first()

    if(!meal){
      return reply.status(200).send({ message:'You do not have meals registered with this ID'})
    }

    const Altermeal = await knex('meals').where('id',id).andWhere('user_id',user_id).update({
      name,
      calories,
      on_diet
    }).returning('*')

    const userEmail = User.email
    const userName = User.name
    const user = {userEmail, userName}
    reply.status(200).send({user, before: meal, after: Altermeal })
  })

  app.delete('/:id',{ preHandler:[checkSessionIdExists]}, async (request, reply) =>{
    const User = await FindCurrentUser(request, reply)
    const user_id = User.id

    const IdParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = IdParamsSchema.parse(request.params)

    if(!id){
      return reply.status(400).send('All fields is required!')
    }

    const meal = await knex('meals').where('id',id).andWhere('user_id',user_id).first()

    if(!meal){
      return reply.status(200).send({ message:'You do not have meals registered with this ID'})
    }

     const userEmail = User.email
    const userName = User.name
    const user = {userEmail, userName}

    reply.status(200).send({user, message:'Deleted meal', meal })

    await knex('meals').where('id',id).andWhere('user_id',user_id).first().delete()
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const User = await FindCurrentUser(request, reply)
      const user_id = User.id
      const Best_sequence = User.best_sequence
  
      const meals_On_Diet = await knex('meals').where('user_id',user_id).andWhere('on_diet', 1).count('on_diet', {as: 'on_diet'}).first()
      const meals_Out_Diet = await knex('meals').where('user_id',user_id).andWhere('on_diet', 0).count('on_diet', {as: 'out_diet'}).first()
      const allMeals = await knex('meals').where('user_id',user_id)

      reply.status(200).send(
        {
          Total_Meals: allMeals.length,
          Meals_on_Diet: Number(meals_On_Diet?.on_diet || 0),
          Meals_out_Diet: Number(meals_Out_Diet?.out_diet || 0),
          Best_diet_Sequence: Best_sequence
        }
      )
      
    },
  )

  app.delete('/',{ preHandler:[checkSessionIdExists]}, async (request, reply) =>{
    const User = await FindCurrentUser(request, reply)
    const user_id = User.id

     await knex('meals').where('user_id',user_id).select('*').delete()
    reply.status(200).send('DEU GREEN')
  })
}
