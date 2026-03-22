import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
})

const updateTaskSchema = createTaskSchema.partial()

// Stats must be defined before /:id to avoid route conflict
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const [total, inProgress, doneToday, overdue] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: 'in_progress' } }),
    prisma.task.count({
      where: { userId, status: 'done', updatedAt: { gte: startOfDay, lt: endOfDay } },
    }),
    prisma.task.count({
      where: { userId, status: { not: 'done' }, dueDate: { lt: now } },
    }),
  ])

  // Last 7 days activity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recent = await prisma.task.findMany({
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  })

  const activityMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    activityMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const task of recent) {
    const day = task.createdAt.toISOString().slice(0, 10)
    if (activityMap[day] !== undefined) activityMap[day]++
  }

  const activity = Object.entries(activityMap).map(([date, count]) => ({ date, count }))

  res.json({ total, inProgress, doneToday, overdue, activity })
})

// GET /api/tasks
router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, priority, tagId, search } = req.query

  const where: Record<string, unknown> = { userId: req.userId }

  if (status) where.status = status
  if (priority) where.priority = priority
  if (tagId) where.tags = { some: { id: Number(tagId) } }
  if (search) where.title = { contains: String(search), mode: 'insensitive' }

  const tasks = await prisma.task.findMany({
    where,
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json(tasks)
})

// GET /api/tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { tags: true },
  })

  if (!task) return res.status(404).json({ error: 'Task not found' })

  res.json(task)
})

// POST /api/tasks
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
  }

  const { tagIds, dueDate, ...rest } = parsed.data

  const task = await prisma.task.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.userId!,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: { tags: true },
  })

  res.status(201).json(task)
})

// PATCH /api/tasks/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const taskId = Number(req.params.id)

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId: req.userId },
  })

  if (!existing) return res.status(404).json({ error: 'Task not found' })

  const parsed = updateTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed' })
  }

  const { tagIds, dueDate, ...rest } = parsed.data

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...rest,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      tags: tagIds !== undefined ? { set: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: { tags: true },
  })

  res.json(task)
})

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const taskId = Number(req.params.id)
  const parsed = z.enum(['todo', 'in_progress', 'done']).safeParse(req.body.status)

  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' })

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId: req.userId },
  })

  if (!existing) return res.status(404).json({ error: 'Task not found' })

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: parsed.data },
    include: { tags: true },
  })

  res.json(task)
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.task.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  })

  if (!existing) return res.status(404).json({ error: 'Task not found' })

  await prisma.task.delete({ where: { id: Number(req.params.id) } })

  res.json({ ok: true })
})

export default router
