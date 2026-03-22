import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
})

// GET /api/tags
router.get('/', async (req: AuthRequest, res: Response) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: 'asc' },
  })

  res.json(tags)
})

// POST /api/tags
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = tagSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
  }

  // Check for duplicate name for this user
  const exists = await prisma.tag.findUnique({
    where: { name_userId: { name: parsed.data.name, userId: req.userId! } },
  })

  if (exists) {
    return res.status(409).json({ error: 'Tag with this name already exists' })
  }

  const tag = await prisma.tag.create({
    data: { ...parsed.data, userId: req.userId! },
  })

  res.status(201).json(tag)
})

// PATCH /api/tags/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const tagId = Number(req.params.id)

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId: req.userId },
  })

  if (!existing) {
    return res.status(404).json({ error: 'Tag not found' })
  }

  const parsed = tagSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed' })
  }

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: parsed.data,
  })

  res.json(tag)
})

// DELETE /api/tags/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const tagId = Number(req.params.id)

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId: req.userId },
  })

  if (!existing) {
    return res.status(404).json({ error: 'Tag not found' })
  }

  await prisma.tag.delete({ where: { id: tagId } })

  res.json({ ok: true })
})

export default router
