import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

// Example fallback clients if DB is empty (kept for reference but unused in DB path)
const clients: any[] = [
  {
    id: '1',
    name: 'Иван Петров',
    phone: '+7 (999) 123-45-67',
    address: 'ул. Ленина, д. 1, кв. 1',
    calories: 2000,
    specialFeatures: 'Без лука',
    deliveryDays: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    name: 'Мария Иванова',
    phone: '+7 (999) 987-65-43',
    address: 'ул. Советская, д. 5, кв. 12',
    calories: 1600,
    specialFeatures: 'Двойная порции курицы',
    deliveryDays: {
      monday: false,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: true,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true,
    createdAt: new Date('2024-01-20').toISOString()
  }
]

let orders: any[] = []

// Simple mock token verification
function verifyToken(token: string) {
  try {
    if (token && token.length > 10) {
      return {
        id: '1',
        email: 'admin@example.com',
        name: 'Middle Admin',
        role: 'MIDDLE_ADMIN'
      }
    }
    return null
  } catch (error) {
    return null
  }
}

// Function to get day of week in Russian
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

// Function to check if order already exists for specific date
function orderExistsForDate(clientId: string, targetDate: Date): boolean {
  const compareDate = new Date(targetDate)
  compareDate.setHours(0, 0, 0, 0)
  
  return orders.some(order => 
    order.customer?.id === clientId && 
    new Date(order.createdAt).setHours(0, 0, 0, 0) === compareDate.getTime()
  )
}

// Function to generate default delivery time based on client preferences
function generateDeliveryTime(): string {
  const now = new Date()
  const deliveryHour = 11 + Math.floor(Math.random() * 3) // 11:00 - 14:00
  const deliveryMinute = Math.floor(Math.random() * 60)
  
  now.setHours(deliveryHour, deliveryMinute, 0, 0)
  return now.toTimeString().slice(0, 5)
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { targetDate } = body

    // Use provided date or today
    const processDate = targetDate ? new Date(targetDate) : new Date()
    const dayOfWeek = getDayOfWeek(processDate)
    
    console.log(`Processing auto-orders for ${processDate.toDateString()} (${dayOfWeek})`)

    // Read active clients from DB (specialFeatures contains autoOrders config)
    const dbCustomers = await db.customer.findMany()
    const eligibleClients = [] as any[]
    for (const c of dbCustomers) {
      let settings: any = { autoOrdersEnabled: false, deliveryDays: {}, calories: c.preferences ? 1200 : 1200 }
      try { if (c.preferences) settings = { ...settings, ...JSON.parse(c.preferences) } } catch {}
      if (c.isActive && settings.autoOrdersEnabled && settings.deliveryDays?.[dayOfWeek] && !orderExistsForDate(c.id, processDate)) {
        eligibleClients.push({
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address,
          calories: settings.calories || 1200,
          specialFeatures: settings.specialFeatures || ''
        })
      }
    }

    console.log(`Found ${eligibleClients.length} eligible clients for auto-orders`)

    const createdOrders = []

    // Create orders for eligible clients (DB)
    for (const client of eligibleClients) {
      const lastOrder = await db.order.findFirst({ orderBy: { orderNumber: 'desc' } })
      const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1
      const created = await db.order.create({
        data: {
          orderNumber: nextOrderNumber,
          customerId: client.id,
          adminId: user.id,
          deliveryAddress: client.address,
          deliveryTime: generateDeliveryTime(),
          quantity: 1,
          calories: client.calories,
          specialFeatures: client.specialFeatures,
          paymentStatus: 'UNPAID',
          paymentMethod: 'CASH',
          isPrepaid: false,
          orderStatus: 'PENDING',
          createdAt: processDate
        },
        include: { customer: true }
      })
      createdOrders.push({
        id: created.id,
        orderNumber: created.orderNumber,
        customer: { id: created.customer?.id, name: created.customer?.name, phone: created.customer?.phone },
        customerName: created.customer?.name,
        customerPhone: created.customer?.phone,
        deliveryAddress: created.deliveryAddress,
        deliveryTime: created.deliveryTime,
        deliveryDate: processDate.toISOString().split('T')[0],
        quantity: created.quantity,
        calories: created.calories,
        specialFeatures: created.specialFeatures,
        paymentStatus: created.paymentStatus,
        paymentMethod: created.paymentMethod,
        isPrepaid: created.isPrepaid,
        orderStatus: created.orderStatus,
        isAutoOrder: true,
        createdAt: created.createdAt.toISOString()
      })
    }

    return NextResponse.json({
      message: `Автоматически создано ${createdOrders.length} заказов`,
      processedDate: processDate.toDateString(),
      dayOfWeek,
      eligibleClients: eligibleClients.length,
      createdOrders: createdOrders.length,
      orders: createdOrders
    })

  } catch (error) {
    console.error('Error creating auto orders:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    const user = verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Get date from query parameter or use today
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    // Get auto-orders statistics for target date
    const targetDateOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === targetDate.getTime() && order.isAutoOrder
    })

    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayOfWeek = getDayOfWeek(nextDay)
    
    const nextDayEligibleClients = clients.filter(client => {
      return client.isActive && 
             client.autoOrdersEnabled && 
             client.deliveryDays[nextDayOfWeek]
    })

    return NextResponse.json({
      todayStats: {
        date: targetDate.toDateString(),
        autoOrdersCreated: targetDateOrders.length,
        orders: targetDateOrders
      },
      tomorrowPreview: {
        date: nextDay.toDateString(),
        dayOfWeek: nextDayOfWeek,
        eligibleClients: nextDayEligibleClients.length,
        clients: nextDayEligibleClients.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          calories: c.calories
        }))
      }
    })

  } catch (error) {
    console.error('Error getting auto orders stats:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}