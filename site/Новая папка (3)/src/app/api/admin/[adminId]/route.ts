import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getBearerToken, verifyJwt } from '@/lib/auth'

// DELETE admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { adminId: string } }
) {
  try {
    const user = verifyJwt(getBearerToken(request.headers.get('authorization')) || '')
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { adminId } = params

    // Check if admin exists and is middle admin
    const admin = await db.admin.findUnique({
      where: { id: adminId }
    })

    if (!admin || admin.role !== 'MIDDLE_ADMIN') {
      return NextResponse.json(
        { error: 'Администратор не найден' },
        { status: 404 }
      )
    }

    // Delete admin
    await db.admin.delete({
      where: { id: adminId }
    })

    // Log the action
    await db.actionLog.create({
      data: {
        adminId: user.id,
        action: 'DELETE_ADMIN',
        entityType: 'ADMIN',
        entityId: adminId,
        description: `Deleted middle admin: ${admin.name}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}