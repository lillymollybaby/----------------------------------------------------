import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function generateTokens(userId: number) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any }
  )

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any }
  )

  return { accessToken, refreshToken }
}

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  const { accessToken, refreshToken } = generateTokens(user.id)

  // Store refresh token in DB
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  })

  res.status(201).json({ user, accessToken, refreshToken })
})

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const { accessToken, refreshToken } = generateTokens(user.id)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  })

  const { password: _, ...safeUser } = user

  res.json({ user: safeUser, accessToken, refreshToken })
})

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' })
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { userId: number }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    // Rotate the refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } })

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.userId)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: payload.userId, expiresAt },
    })

    res.json({ accessToken, refreshToken: newRefreshToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId: req.userId },
    })
  }

  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  if (!user) return res.status(404).json({ error: 'User not found' })

  res.json(user)
})

router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).max(50).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed' })
  }

  const { name, currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const updates: { name?: string; password?: string } = {}

  if (name) updates.name = name

  if (currentPassword && newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    updates.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: updates,
    select: { id: true, email: true, name: true, createdAt: true },
  })

  res.json(updated)
})

export default router
