// Database-backed orders data
import { db } from './db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function getOrders() {
  try {
    const orders = await db.order.findMany({
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return orders.map(order => ({
      ...order,
      customer: order.customer,
      specialFeatures: order.specialFeatures ? 
        (typeof order.specialFeatures === 'string' ? order.specialFeatures : JSON.stringify(order.specialFeatures)) : ''
    }))
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

export async function updateOrderStatus(orderId: string, status: string, courierId?: string) {
  try {
    const updateData: any = { orderStatus: status }
    if (courierId) {
      updateData.courierId = courierId
    }
    
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    })
    
    return {
      ...updatedOrder,
      specialFeatures: updatedOrder.specialFeatures ? 
        (typeof updatedOrder.specialFeatures === 'string' ? updatedOrder.specialFeatures : JSON.stringify(updatedOrder.specialFeatures)) : ''
    }
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

export async function getNextPendingOrder() {
  try {
    const nextOrder = await db.order.findFirst({
      where: { orderStatus: 'PENDING' },
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    if (!nextOrder) return null
    
    return {
      ...nextOrder,
      specialFeatures: nextOrder.specialFeatures ? 
        (typeof nextOrder.specialFeatures === 'string' ? nextOrder.specialFeatures : JSON.stringify(nextOrder.specialFeatures)) : ''
    }
  } catch (error) {
    console.error('Error fetching next order:', error)
    return null
  }
}

export function verifyToken(token: string) {
  try {
    if (!token) return null
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}