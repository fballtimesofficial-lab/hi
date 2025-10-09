import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const middleAdmins = await db.admin.findMany({
      where: { role: 'MIDDLE_ADMIN' },
      include: {
        createdAdmins: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(middleAdmins)
  } catch (error) {
    console.error('Error fetching middle admins:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const existingAdmin = await db.admin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Администратор с таким email уже существует' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create middle admin
    const newAdmin = await db.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'MIDDLE_ADMIN',
        isActive: true,
        createdBy: user.id
      }
    })

    // Log the action
    await db.actionLog.create({
      data: {
        adminId: user.id,
        action: 'CREATE_ADMIN',
        entityType: 'ADMIN',
        entityId: newAdmin.id,
        description: `Created middle admin: ${name}`
      }
    })

    return NextResponse.json({
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      role: newAdmin.role,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt
    })
  } catch (error) {
    console.error('Error creating middle admin:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}