import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

function verifyRequestUser(request: NextRequest) {
  return verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyRequestUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = adminId ? { adminId } : {}

    const actionLogs = await db.actionLog.findMany({
      where,
      include: {
        admin: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await db.actionLog.count({ where })

    return NextResponse.json({
      logs: actionLogs,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching action logs:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}