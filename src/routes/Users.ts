import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function Users(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
    })

    const { name, email, password } = createUserBodySchema.parse(request.body)

    if (!name || !email || !password) {
      return reply.status(400).send('All fields is required!')
    }

    const userExists = await knex('users').where('email', email).first()

    if (userExists) {
      return reply
        .status(401)
        .send('This user email already registered!, try again!')
    }

    await knex('users')
      .insert({
        id: randomUUID(),
        name,
        email,
        password,
      })
      .returning('*')

    reply.status(201).send('created')
  })

  app.post('/login', async (request, reply) => {
    const LoginUserBodySchema = z.object({
      email: z.string(),
      password: z.string(),
    })

    const { email, password } = LoginUserBodySchema.parse(request.body)

    if (!email || !password) {
      return reply.status(400).send('All fields is required!')
    }

    const userExists = await knex('users').where('email', email).first()

    if (!userExists || userExists.password !== password) {
      return reply.status(401).send('Invalid email or password!, try again.')
    }

    let sessionId = request.cookies.sessionId
    const userSessionId = userExists.sesion_id

    if (!userSessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      })

      await knex('users').where('email', email).update({
        session_id: sessionId,
      })

      return reply
        .status(200)
        .send({ message: 'Successful, you are logged in', user: userExists })
    }

    if (userExists.sesion_id !== sessionId) {
      return reply.status(401).send('Unauthorized')
    }

    reply
      .status(200)
      .send({ message: 'You are already logged in', user: userExists })
  })
}
