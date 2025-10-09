import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signJwt } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Find admin by email in database
    const admin = await db.admin.findUnique({ where: { email } })

    if (!admin) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      )
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      )
    }

    // Check if admin is active
    if (!admin.isActive) {
      return NextResponse.json(
        { error: 'Аккаунт деактивирован' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = signJwt({ id: admin.id, email: admin.email, role: admin.role as any })

    console.log(`✅ Admin login: ${admin.name} (${admin.email})`)

    return NextResponse.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}