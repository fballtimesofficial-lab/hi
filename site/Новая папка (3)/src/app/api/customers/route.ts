import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'LOW_ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const customers = await db.customer.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'LOW_ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const customerData = await request.json()
    
    // Create customer
    const newCustomer = await db.customer.create({
      data: {
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        preferences: customerData.preferences ? JSON.stringify(customerData.preferences) : null,
        orderPattern: customerData.orderPattern || null
      }
    })

    // Log the action
    await db.actionLog.create({
      data: {
        adminId: user.id,
        action: 'CREATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: newCustomer.id,
        description: `Created customer: ${newCustomer.name}`
      }
    })

    return NextResponse.json(newCustomer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}