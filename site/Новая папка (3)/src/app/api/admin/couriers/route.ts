import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'
import bcrypt from 'bcryptjs'

function verifyRequestUser(request: NextRequest) {
  return verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyRequestUser(request)
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const courierData = await request.json()
    
    // Check if email already exists
    const existingAdmin = await db.admin.findUnique({
      where: { email: courierData.email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Администратор с таким email уже существует' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(courierData.password, 10)

    // Create courier
    const newCourier = await db.admin.create({
      data: {
        name: courierData.name,
        email: courierData.email,
        password: hashedPassword,
        role: 'COURIER',
        isActive: true,
        createdBy: user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log the action
    await db.actionLog.create({
      data: {
        adminId: user.id,
        action: 'CREATE_COURIER',
        entityType: 'ADMIN',
        entityId: newCourier.id,
        description: `Created courier account: ${newCourier.name} (${newCourier.email})`
      }
    })

    return NextResponse.json(newCourier)
  } catch (error) {
    console.error('Error creating courier:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}