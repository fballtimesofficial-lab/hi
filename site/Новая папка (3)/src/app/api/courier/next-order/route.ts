import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    
    if (!user || user.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Find next pending order from DB
    const nextOrder = await db.order.findFirst({ where: { orderStatus: { in: ['PENDING', 'IN_DELIVERY'] } }, orderBy: { createdAt: 'asc' } })

    if (!nextOrder) {
      return NextResponse.json({ message: 'No pending orders' }, { status: 404 })
    }

    return NextResponse.json(nextOrder)
  } catch (error) {
    console.error('Error fetching next order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}