import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Calculate statistics from database
    const [delivered, failed, pending, inDelivery, prepaid, unpaid, card, cash, c1200, c1600, c2000, c2500, c3000, singleItem, multiItem] = await Promise.all([
      db.order.count({ where: { orderStatus: 'DELIVERED' } }),
      db.order.count({ where: { orderStatus: 'FAILED' } }),
      db.order.count({ where: { orderStatus: 'PENDING' } }),
      db.order.count({ where: { orderStatus: 'IN_DELIVERY' } }),
      db.order.count({ where: { isPrepaid: true } }),
      db.order.count({ where: { paymentStatus: 'UNPAID' } }),
      db.order.count({ where: { paymentMethod: 'CARD' } }),
      db.order.count({ where: { paymentMethod: 'CASH' } }),
      db.order.count({ where: { calories: 1200 } }),
      db.order.count({ where: { calories: 1600 } }),
      db.order.count({ where: { calories: 2000 } }),
      db.order.count({ where: { calories: 2500 } }),
      db.order.count({ where: { calories: 3000 } }),
      db.order.count({ where: { quantity: 1 } }),
      db.order.count({ where: { quantity: { gte: 2 } } }),
    ])

    const stats = {
      successfulOrders: delivered,
      failedOrders: failed,
      pendingOrders: pending,
      inDeliveryOrders: inDelivery,
      prepaidOrders: prepaid,
      unpaidOrders: unpaid,
      cardOrders: card,
      cashOrders: cash,
      dailyCustomers: 0,
      evenDayCustomers: 0,
      oddDayCustomers: 0,
      specialPreferenceCustomers: await db.order.count({ where: { specialFeatures: { not: null } } }),
      orders1200: c1200,
      orders1600: c1600,
      orders2000: c2000,
      orders2500: c2500,
      orders3000: c3000,
      singleItemOrders: singleItem,
      multiItemOrders: multiItem,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}