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
}
