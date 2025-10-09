import { NextRequest, NextResponse } from 'next/server'
import { getNextPendingOrder, verifyToken } from '@/lib/orders-data'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = verifyToken(token || '')
    
    if (!user || user.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const nextOrder = await getNextPendingOrder()

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