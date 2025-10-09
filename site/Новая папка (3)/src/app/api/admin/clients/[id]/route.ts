import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const clientId = params.id

    // Ensure client exists
    const existing = await db.customer.findUnique({ where: { id: clientId } })
    if (!existing) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // Optionally cascade delete related orders
    await db.order.deleteMany({ where: { customerId: clientId } })
    const deleted = await db.customer.delete({ where: { id: clientId } })

    return NextResponse.json({ message: 'Клиент успешно удален', client: deleted })

  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}