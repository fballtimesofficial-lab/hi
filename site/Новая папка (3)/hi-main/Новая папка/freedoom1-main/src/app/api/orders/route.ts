import { NextRequest, NextResponse } from 'next/server'
import { orders, verifyToken } from '@/lib/orders-data'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = verifyToken(token || '')
    
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'COURIER')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const filtersParam = searchParams.get('filters')
    
    let filters = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch (e) {
        console.error('Error parsing filters:', e)
      }
    }

    // Filter orders based on criteria
    let filteredOrders = [...orders]

    // Date filter
    if (date) {
      const targetDate = new Date(date)
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.toDateString() === targetDate.toDateString()
      })
    }

    // Status filters
    const statusFilters = []
    if (filters.successful) statusFilters.push('DELIVERED')
    if (filters.failed) statusFilters.push('FAILED')
    if (filters.pending) statusFilters.push('PENDING')
    if (filters.inDelivery) statusFilters.push('IN_DELIVERY')
    
    if (statusFilters.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        statusFilters.includes(order.orderStatus)
      )
    }

    // Payment filters
    if (filters.prepaid) {
      filteredOrders = filteredOrders.filter(order => order.isPrepaid)
    }

    if (filters.unpaid) {
      filteredOrders = filteredOrders.filter(order => !order.isPrepaid)
    }

    if (filters.card) {
      filteredOrders = filteredOrders.filter(order => order.paymentMethod === 'CARD')
    }

    if (filters.cash) {
      filteredOrders = filteredOrders.filter(order => order.paymentMethod === 'CASH')
    }

    // Calories filters
    if (filters.calories1200) {
      filteredOrders = filteredOrders.filter(order => order.calories === 1200)
    } else if (filters.calories1600) {
      filteredOrders = filteredOrders.filter(order => order.calories === 1600)
    } else if (filters.calories2000) {
      filteredOrders = filteredOrders.filter(order => order.calories === 2000)
    } else if (filters.calories2500) {
      filteredOrders = filteredOrders.filter(order => order.calories === 2500)
    } else if (filters.calories3000) {
      filteredOrders = filteredOrders.filter(order => order.calories === 3000)
    }

    // Special features filter
    if (filters.special) {
      filteredOrders = filteredOrders.filter(order => 
        order.specialFeatures && order.specialFeatures.trim() !== ''
      )
    }

    // Quantity filters
    if (filters.singleItem) {
      filteredOrders = filteredOrders.filter(order => order.quantity === 1)
    } else if (filters.multiItem) {
      filteredOrders = filteredOrders.filter(order => order.quantity >= 2)
    }

    return NextResponse.json(filteredOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = verifyToken(token || '')
    
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'COURIER')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const orderData = await request.json()
    
    // Get the next order number
    const lastOrder = orders.reduce((max, order) => 
      order.orderNumber > max ? order.orderNumber : max, 0)
    
    const nextOrderNumber = lastOrder + 1

    // Create new order
    const newOrder = {
      id: Date.now().toString(),
      orderNumber: nextOrderNumber,
      customer: {
        name: orderData.customerName,
        phone: orderData.customerPhone
      },
      deliveryAddress: orderData.deliveryAddress,
      latitude: orderData.latitude || null,
      longitude: orderData.longitude || null,
      deliveryTime: orderData.deliveryTime,
      quantity: orderData.quantity || 1,
      calories: orderData.calories,
      specialFeatures: orderData.specialFeatures,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      orderStatus: 'PENDING',
      isPrepaid: orderData.isPrepaid || false,
      createdAt: new Date().toISOString()
    }

    orders.push(newOrder)
    console.log(`Created order #${newOrder.orderNumber} for ${newOrder.customer.name}`)

    return NextResponse.json(newOrder)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}