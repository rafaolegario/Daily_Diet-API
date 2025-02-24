import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { Users } from './routes/Users'

export const app = fastify()

app.register(cookie)
app.register(Users)

