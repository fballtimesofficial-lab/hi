import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MIDDLE_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { orderIds } = await request.json()

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 })
    }

    // Delete orders from database
    const deleteResult = await db.order.deleteMany({
      where: {
        id: {
          in: orderIds
        }
      }
    })

    const deletedCount = deleteResult.count

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