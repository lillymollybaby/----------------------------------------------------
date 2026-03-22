import request from 'supertest'
import app from '../app'
import { prisma } from '../lib/prisma'

const EMAIL = `tasks_${Date.now()}@example.com`
let token: string
let userId: number
let taskId: number

beforeAll(async () => {
  const reg = await request(app).post('/api/auth/register').send({
    email: EMAIL,
    password: 'password123',
    name: 'Task Tester',
  })
  token = reg.body.accessToken
  userId = reg.body.user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.$disconnect()
})

describe('Tasks CRUD', () => {
  it('creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test task', priority: 'high' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Test task')
    taskId = res.body.id
  })

  it('lists tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('updates a task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Updated title')
  })

  it('changes task status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('in_progress')
  })

  it('rejects invalid status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid_status' })

    expect(res.status).toBe(400)
  })

  it('deletes a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })

  it('returns 404 for deleted task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})
