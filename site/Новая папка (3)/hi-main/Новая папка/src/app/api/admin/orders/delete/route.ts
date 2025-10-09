import { NextRequest, NextResponse } from 'next/server'
import { orders, verifyToken } from '@/lib/orders-data'

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = verifyToken(token || '')
    
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MIDDLE_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { orderIds } = await request.json()

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 })
    }

    // Get initial count for logging
    const initialCount = orders.length

    // Filter out the orders to be deleted
    const remainingOrders = orders.filter(order => !orderIds.includes(order.id))
    
    // Update the orders array
    orders.length = 0
    orders.push(...remainingOrders)

    const deletedCount = initialCount - orders.length

    console.log(`Deleted ${deletedCount} orders by ${user.role} ${user.name}`)

    return NextResponse.json({ 
      message: 'Orders deleted successfully',
      deletedCount 
    })

  } catch (error) {
    console.error('Delete orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}