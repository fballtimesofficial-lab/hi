import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { clientIds, isActive } = body

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Не указаны ID клиентов' }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Не указан статус активности' }, { status: 400 })
    }

    const updateResult = await db.customer.updateMany({
      where: { id: { in: clientIds } },
      data: { isActive }
    })

    return NextResponse.json({
      message: `Статус ${isActive ? 'возобновлен' : 'приостановлен'} для ${updateResult.count} клиентов`,
      updatedCount: updateResult.count
    })

  } catch (error) {
    console.error('Error toggling client status:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}