import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { clientIds, deleteOrders = true, daysBack = 30 } = body

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Не указаны ID клиентов для удаления' }, { status: 400 })
    }

    let deletedClients = 0
    let deletedOrders = 0

    try {
      // Начинаем транзакцию
      await db.$transaction(async (tx) => {
        // Сначала удаляем заказы клиентов за указанный период
        if (deleteOrders) {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - daysBack)
          startDate.setHours(0, 0, 0, 0)

          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 30) // +30 дней от текущей даты
          endDate.setHours(23, 59, 59, 999)

          // Получаем информацию о клиентах для поиска заказов
          const clientsToDelete = await tx.customer.findMany({
            where: {
              id: { in: clientIds }
            },
            select: {
              id: true,
              name: true,
              phone: true
            }
          })

          // Удаляем заказы, созданные автоматически для этих клиентов
          for (const client of clientsToDelete) {
            const ordersResult = await tx.order.deleteMany({
              where: {
                customerId: client.id,
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            })
            deletedOrders += ordersResult.count
          }
        }

        // Теперь удаляем самих клиентов
        const clientsResult = await tx.customer.deleteMany({
          where: {
            id: { in: clientIds }
          }
        })
        deletedClients = clientsResult.count
      })

      return NextResponse.json({
        success: true,
        deletedClients,
        deletedOrders,
        message: `Успешно удалено ${deletedClients} клиентов и ${deletedOrders} заказов`
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Ошибка при удалении данных из базы данных',
        details: dbError instanceof Error ? dbError.message : 'Неизвестная ошибка'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Delete clients API error:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}