import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus, verifyToken } from '@/lib/orders-data'

// PATCH order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = verifyToken(token || '')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { orderId } = await params
    const { action } = await request.json()

    let updatedOrder

    switch (action) {
      case 'start_delivery':
        if (user.role !== 'COURIER') {
          return NextResponse.json(
            { error: 'Только курьер может начать доставку' },
            { status: 403 }
          )
        }
        updatedOrder = await updateOrderStatus(orderId, 'IN_DELIVERY', user.id)
        console.log(`Started delivery for order #${updatedOrder.orderNumber}`)
        break

      case 'complete_delivery':
        if (user.role !== 'COURIER') {
          return NextResponse.json(
            { error: 'Только курьер может завершить доставку' },
            { status: 403 }
          )
        }
        updatedOrder = await updateOrderStatus(orderId, 'DELIVERED')
        console.log(`Completed delivery for order #${updatedOrder.orderNumber}`)
        break

      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        )
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}