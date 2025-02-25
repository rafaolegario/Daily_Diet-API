import { test, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../app'
import request from 'supertest'

describe('User routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npx knex migrate:rollback --all')
    execSync('npx knex migrate:latest')
  })

  test('should be able to register new User', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)
  })

  test('should be able to make login', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)

    await request(app.server)
      .post('/login')
      .send({
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(200)
  })
})
