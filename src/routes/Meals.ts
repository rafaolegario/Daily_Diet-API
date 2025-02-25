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
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const User = await FindCurrentUser(request, reply)
      const userid = User.id

      const meals = await knex('meals').where('user_id', userid).select('*')

      if (meals.length === 0) {
        return reply
          .status(200)
          .send({ message: 'You dont have registered meals' })
      }

      const userEmail = User.email
      const userName = User.name
      const user = { userEmail, userName }

      reply.status(200).send({ user, meals })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const User = await FindCurrentUser(request, reply)
      const userid = User.id

      const IdParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = IdParamsSchema.parse(request.params)

      if (!id) {
        return reply.status(400).send('All fields is required!')
      }

      const meal = await knex('meals')
        .where('id', id)
        .andWhere('user_id', userid)
        .first()

      if (!meal) {
        return reply
          .status(200)
          .send({ message: 'You do not have meals registered with this ID' })
      }

      const userEmail = User.email
      const userName = User.name
      const user = { userEmail, userName }
      reply.status(200).send({ user, meal })
    },
  )

  app.post(
    '/create',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const CreateMealsBodySchema = z.object({
        name: z.string(),
        calories: z.number(),
        diet: z.boolean(),
      })

      const { name, calories, diet } = CreateMealsBodySchema.parse(request.body)

      if (!name || !calories) {
        return reply.status(400).send('All fields is required!')
      }

      const User = await FindCurrentUser(request, reply)

      const userid = User.id

      if (diet) {
        CurrentSequence++
        if (CurrentSequence > User.best_sequence) {
          await knex('users').where('id', userid).first().update({
            best_sequence: CurrentSequence,
          })
        }
      } else {
        CurrentSequence = 0
      }

      const meal = await knex('meals')
        .insert({
          user_id: userid,
          id: randomUUID(),
          name,
          calories,
          on_diet: diet,
        })
        .returning('*')

      reply.status(201).send(meal)
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const User = await FindCurrentUser(request, reply)
      const userid = User.id

      const IdParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const CreateMealsBodySchema = z.object({
        name: z.string(),
        calories: z.number(),
        diet: z.boolean(),
      })

      const { name, calories, diet } = CreateMealsBodySchema.parse(request.body)

      if (!name || !calories) {
        return reply.status(400).send('All fields is required!')
      }

      const { id } = IdParamsSchema.parse(request.params)

      if (!id) {
        return reply.status(400).send('All fields is required!')
      }

      const meal = await knex('meals')
        .where('id', id)
        .andWhere('user_id', userid)
        .first()

      if (!meal) {
        return reply
          .status(200)
          .send({ message: 'You do not have meals registered with this ID' })
      }

      if (diet) {
        CurrentSequence++
        if (CurrentSequence > User.best_sequence) {
          await knex('users').where('id', userid).first().update({
            best_sequence: CurrentSequence,
          })
        }
      } else {
        CurrentSequence = 0
      }

      const Altermeal = await knex('meals')
        .where('id', id)
        .andWhere('user_id', userid)
        .update({
          name,
          calories,
          on_diet: diet,
        })
        .returning('*')

      const userEmail = User.email
      const userName = User.name
      const user = { userEmail, userName }
      reply.status(200).send({ user, before: meal, after: Altermeal })
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const User = await FindCurrentUser(request, reply)
      const userid = User.id

      const IdParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = IdParamsSchema.parse(request.params)

      if (!id) {
        return reply.status(400).send('All fields is required!')
      }

      const meal = await knex('meals')
        .where('id', id)
        .andWhere('user_id', userid)
        .first()

      if (!meal) {
        return reply
          .status(200)
          .send({ message: 'You do not have meals registered with this ID' })
      }

      const userEmail = User.email
      const userName = User.name
      const user = { userEmail, userName }

      reply.status(200).send({ user, message: 'Deleted meal', meal })

      await knex('meals')
        .where('id', id)
        .andWhere('user_id', userid)
        .first()
        .delete()
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const User = await FindCurrentUser(request, reply)
      const userid = User.id
      const BestSequence = User.best_sequence

      const mealsOnDiet = await knex('meals')
        .where('user_id', userid)
        .andWhere('on_diet', 1)
        .count('on_diet', { as: 'on_diet' })
        .first()
      const mealsOutDiet = await knex('meals')
        .where('user_id', userid)
        .andWhere('on_diet', 0)
        .count('on_diet', { as: 'out_diet' })
        .first()
      const allMeals = await knex('meals').where('user_id', userid)

      reply.status(200).send({
        Total_Meals: allMeals.length,
        Meals_on_Diet: Number(mealsOnDiet?.on_diet || 0),
        Meals_out_Diet: Number(mealsOutDiet?.out_diet || 0),
        Best_diet_Sequence: BestSequence,
      })
    },
  )
}
