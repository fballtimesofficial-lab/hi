import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const filtersParam = searchParams.get('filters')
    const filters = filtersParam ? JSON.parse(filtersParam) : {}

    // Build Prisma where clause
    const where: any = {}
    if (date) {
      const day = new Date(date)
      const start = new Date(day)
      start.setHours(0, 0, 0, 0)
      const end = new Date(day)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start, lte: end }
    }
    if (filters.successful) where.orderStatus = 'DELIVERED'
    if (filters.failed) where.orderStatus = 'FAILED'
    if (filters.pending) where.orderStatus = 'PENDING'
    if (filters.inDelivery) where.orderStatus = 'IN_DELIVERY'
    if (filters.prepaid) where.isPrepaid = true
    if (filters.unpaid) where.paymentStatus = 'UNPAID'
    if (filters.card) where.paymentMethod = 'CARD'
    if (filters.cash) where.paymentMethod = 'CASH'
    if (filters.calories1200) where.calories = 1200
    if (filters.calories1600) where.calories = 1600
    if (filters.calories2000) where.calories = 2000
    if (filters.calories2500) where.calories = 2500
    if (filters.calories3000) where.calories = 3000
    if (filters.singleItem) where.quantity = 1
    if (filters.multiItem) where.quantity = { gt: 1 }

    const dbOrders = await db.order.findMany({ where, include: { customer: true } })

    const transformedOrders = dbOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customer: { name: o.customer?.name ?? 'Неизвестный клиент', phone: o.customer?.phone ?? '' },
      deliveryAddress: o.deliveryAddress,
      deliveryTime: o.deliveryTime,
      quantity: o.quantity,
      calories: o.calories,
      specialFeatures: o.specialFeatures ?? '',
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      orderStatus: o.orderStatus,
      isPrepaid: o.isPrepaid,
      createdAt: o.createdAt.toISOString(),
      customerName: o.customer?.name ?? 'Неизвестный клиент',
      customerPhone: o.customer?.phone ?? 'Нет телефона',
      deliveryDate: o.createdAt.toISOString().split('T')[0],
      isAutoOrder: false,
    }))

    return NextResponse.json(transformedOrders)

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      customerName, 
      customerPhone, 
      deliveryAddress, 
      deliveryTime, 
      quantity, 
      calories, 
      specialFeatures, 
      paymentStatus, 
      paymentMethod, 
      isPrepaid,
      date
    } = body

    if (!customerName || !customerPhone || !deliveryAddress || !calories) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    // Ensure customer exists or create
    let customer = await db.customer.findFirst({ where: { phone: customerPhone } })
    if (!customer) {
      customer = await db.customer.create({ data: { name: customerName, phone: customerPhone, address: deliveryAddress } })
    }

    // Determine next order number
    const lastOrder = await db.order.findFirst({ orderBy: { orderNumber: 'desc' } })
    const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

    const created = await db.order.create({
      data: {
        orderNumber: nextOrderNumber,
        customerId: customer.id,
        adminId: user.id,
        deliveryAddress,
        deliveryTime: deliveryTime || '12:00',
        quantity: quantity || 1,
        calories: parseInt(calories),
        specialFeatures: specialFeatures || '',
        paymentStatus: (paymentStatus || 'UNPAID') as any,
        paymentMethod: (paymentMethod || 'CASH') as any,
        orderStatus: 'PENDING',
        isPrepaid: isPrepaid || false,
      },
      include: { customer: true },
    })

    const transformedOrder = {
      id: created.id,
      orderNumber: created.orderNumber,
      customer: { name: created.customer?.name ?? customerName, phone: created.customer?.phone ?? customerPhone },
      deliveryAddress: created.deliveryAddress,
      deliveryTime: created.deliveryTime,
      quantity: created.quantity,
      calories: created.calories,
      specialFeatures: created.specialFeatures ?? '',
      paymentStatus: created.paymentStatus,
      paymentMethod: created.paymentMethod,
      orderStatus: created.orderStatus,
      isPrepaid: created.isPrepaid,
      createdAt: created.createdAt.toISOString(),
      customerName: created.customer?.name ?? customerName,
      customerPhone: created.customer?.phone ?? customerPhone,
      deliveryDate: date || created.createdAt.toISOString().split('T')[0],
      isAutoOrder: false,
    }

    console.log(`✅ Created manual order: ${transformedOrder.customerName} (#${nextOrderNumber})`)

    return NextResponse.json({ message: 'Заказ успешно создан', order: transformedOrder })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}