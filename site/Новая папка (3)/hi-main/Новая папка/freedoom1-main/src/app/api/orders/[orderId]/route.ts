import { NextRequest, NextResponse } from 'next/server'
import { orders, verifyToken } from '@/lib/orders-data'

// PATCH order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
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

    const { orderId } = params
    const { action } = await request.json()

    const orderIndex = orders.findIndex(order => order.id === orderId)

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    const order = orders[orderIndex]
    let updatedOrder

    switch (action) {
      case 'start_delivery':
        if (user.role !== 'COURIER') {
          return NextResponse.json(
            { error: 'Только курьер может начать доставку' },
            { status: 403 }
          )
        }
        updatedOrder = {
          ...order,
          orderStatus: 'IN_DELIVERY',
          courierId: user.id
        }
        orders[orderIndex] = updatedOrder
        console.log(`Started delivery for order #${order.orderNumber}`)
        break

      case 'complete_delivery':
        if (user.role !== 'COURIER') {
          return NextResponse.json(
            { error: 'Только курьер может завершить доставку' },
            { status: 403 }
          )
        }
        updatedOrder = {
          ...order,
          orderStatus: 'DELIVERED'
        }
        orders[orderIndex] = updatedOrder
        console.log(`Completed delivery for order #${order.orderNumber}`)
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