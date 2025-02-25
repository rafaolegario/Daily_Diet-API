import { test, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../app'
import request from 'supertest'

describe('Meals routes', () => {
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

  test('should be able to create new Meal', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/login')
      .send({
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(200)

    const cookies = loginResponse.get('Set-Cookie') as string[]

    await request(app.server)
      .post('/meals/create')
      .send({
        name: 'pizza',
        calories: 1000,
        diet: false,
      })
      .set('Cookie', cookies)
      .expect(201)
  })

  test('should be able to list all meals', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/login')
      .send({
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(200)

    const cookies = loginResponse.get('Set-Cookie') as string[]

    request(app.server).get('/means').set('Cookie', cookies).expect(200)
  })

  test('should be able to get specific meal', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/login')
      .send({
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(200)

    const cookies = loginResponse.get('Set-Cookie') as string[]

    const response = await request(app.server)
      .post('/meals/create')
      .send({
        name: 'pizza',
        calories: 1000,
        diet: false,
      })
      .set('Cookie', cookies)
      .expect(201)

    const id = response.body.id
    request(app.server).get(`/meals/${id}`).set('Cookie', cookies).expect(200)
  })

  test('should be able to delete specific meal', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/login')
      .send({
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(200)

    const cookies = loginResponse.get('Set-Cookie') as string[]

    const response = await request(app.server)
      .post('/meals/create')
      .send({
        name: 'pizza',
        calories: 1000,
        diet: false,
      })
      .set('Cookie', cookies)
      .expect(201)

    const id = response.body.id
    request(app.server)
      .delete(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(200)
  })

  test('should be able to update specific meal', async () => {
    await request(app.server)
      .post('/register')
      .send({
        name: 'Jonh Doe',
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/login')
      .send({
        email: 'jonhDoe@gmail.com',
        password: '1234pass',
      })
      .expect(200)

    const cookies = loginResponse.get('Set-Cookie') as string[]

    const response = await request(app.server)
      .post('/meals/create')
      .send({
        name: 'pizza',
        calories: 1000,
        diet: false,
      })
      .set('Cookie', cookies)
      .expect(201)

    const id = response.body.id
    request(app.server)
      .put(`/meals/${id}`)
      .send({
        name: 'salada',
        calories: 250,
        diet: true,
      })
      .set('Cookie', cookies)
      .expect(200)
  })
})
