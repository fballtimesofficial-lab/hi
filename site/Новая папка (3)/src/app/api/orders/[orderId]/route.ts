import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

// PATCH order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { orderId } = params
    const { action } = await request.json()

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
    }

    switch (action) {
      case 'start_delivery':
        if (user.role !== 'COURIER') {
          return NextResponse.json(
            { error: 'Только курьер может начать доставку' },
            { status: 403 }
          )
        }
        await db.order.update({ where: { id: orderId }, data: { orderStatus: 'IN_DELIVERY', courierId: user.id } })
        break

      case 'complete_delivery':
        if (user.role !== 'COURIER') {
          return NextResponse.json(
            { error: 'Только курьер может завершить доставку' },
            { status: 403 }
          )
        }
        await db.order.update({ where: { id: orderId }, data: { orderStatus: 'DELIVERED' } })
        break

      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        )
    }

    const refreshed = await db.order.findUnique({ where: { id: orderId } })
    return NextResponse.json(refreshed)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}