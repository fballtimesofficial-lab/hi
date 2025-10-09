import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

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
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get all orders
    const allOrders = await db.order.findMany({
      include: {
        customer: {
          select: {
            orderPattern: true
          }
        }
      }
    })

    // Get today's orders
    const todayOrders = allOrders.filter(order => 
      order.createdAt >= startOfDay && order.createdAt < endOfDay
    )

    // Calculate statistics
    const stats = {
      successfulOrders: allOrders.filter(o => o.orderStatus === 'DELIVERED').length,
      failedOrders: allOrders.filter(o => o.orderStatus === 'FAILED').length,
      pendingOrders: allOrders.filter(o => o.orderStatus === 'PENDING').length,
      inDeliveryOrders: allOrders.filter(o => o.orderStatus === 'IN_DELIVERY').length,
      prepaidOrders: allOrders.filter(o => o.isPrepaid).length,
      unpaidOrders: allOrders.filter(o => !o.isPrepaid).length,
      cardOrders: allOrders.filter(o => o.paymentMethod === 'CARD').length,
      cashOrders: allOrders.filter(o => o.paymentMethod === 'CASH').length,
      dailyCustomers: allOrders.filter(o => o.customer.orderPattern === 'daily').length,
      evenDayCustomers: allOrders.filter(o => o.customer.orderPattern === 'every_other_day_even').length,
      oddDayCustomers: allOrders.filter(o => o.customer.orderPattern === 'every_other_day_odd').length,
      specialPreferenceCustomers: allOrders.filter(o => o.specialFeatures && o.specialFeatures !== '{}').length,
      orders1200: allOrders.filter(o => o.calories === 1200).length,
      orders1600: allOrders.filter(o => o.calories === 1600).length,
      orders2000: allOrders.filter(o => o.calories === 2000).length,
      orders2500: allOrders.filter(o => o.calories === 2500).length,
      orders3000: allOrders.filter(o => o.calories === 3000).length,
      singleItemOrders: allOrders.filter(o => o.quantity === 1).length,
      multiItemOrders: allOrders.filter(o => o.quantity >= 2).length
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