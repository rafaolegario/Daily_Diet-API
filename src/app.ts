import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { Users } from './routes/Users'
import { Meals } from './routes/Meals'

export const app = fastify()

app.register(cookie)
app.register(Users)
app.register(Meals, {
  prefix: '/meals',
})
