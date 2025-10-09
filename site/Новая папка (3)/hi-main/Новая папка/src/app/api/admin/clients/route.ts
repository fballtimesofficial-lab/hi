import { NextRequest, NextResponse } from 'next/server'

// Mock data for clients (in real app, this would be in a database)
let clients: any[] = [
  {
    id: '1',
    name: 'Иван Петров',
    phone: '+7 (999) 123-45-67',
    address: 'ул. Ленина, д. 1, кв. 1',
    calories: 2000,
    specialFeatures: 'Без лука',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    name: 'Мария Иванова',
    phone: '+7 (999) 987-65-43',
    address: 'ул. Советская, д. 5, кв. 12',
    calories: 1600,
    specialFeatures: 'Двойная порция курицы',
    createdAt: new Date('2024-01-20').toISOString()
  }
]

// Simple mock token verification (in real app, use proper JWT verification)
function verifyToken(token: string) {
  try {
    // For demo purposes, we'll accept any non-empty token as valid
    // and return a mock user with MIDDLE_ADMIN role
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

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Verify token and check if user is MIDDLE_ADMIN or SUPER_ADMIN
    const user = verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    return NextResponse.json(clients)

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Verify token and check if user is MIDDLE_ADMIN or SUPER_ADMIN
    const user = verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, address, calories, specialFeatures } = body

    if (!name || !phone || !address || !calories) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    // Create new client
    const newClient = {
      id: Date.now().toString(),
      name,
      phone,
      address,
      calories: parseInt(calories),
      specialFeatures: specialFeatures || '',
      createdAt: new Date().toISOString()
    }

    clients.push(newClient)

    return NextResponse.json({ 
      message: 'Клиент успешно создан',
      client: newClient
    })

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}