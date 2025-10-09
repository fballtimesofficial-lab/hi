'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  Package, 
  Users, 
  Settings, 
  History, 
  User, 
  LogOut,
  Plus,
  Trash2,
  Pause,
  Play,
  Eye,
  Edit,
  Save,
  Filter,
  ChevronLeft,
  ChevronRight,
  Route
} from 'lucide-react'

interface Admin {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Order {
  id: string
  orderNumber: number
  customer: {
    name: string
    phone: string
  }
  deliveryAddress: string
  latitude?: number
  longitude?: number
  deliveryTime: string
  quantity: number
  calories: number
  specialFeatures: string
  paymentStatus: string
  paymentMethod: string
  orderStatus: string
  isPrepaid: boolean
  createdAt: string
}

interface Client {
  id: string
  name: string
  phone: string
  address: string
  calories: number
  specialFeatures: string
  createdAt: string
}

interface Stats {
  successfulOrders: number
  failedOrders: number
  pendingOrders: number
  inDeliveryOrders: number
  prepaidOrders: number
  unpaidOrders: number
  cardOrders: number
  cashOrders: number
  dailyCustomers: number
  evenDayCustomers: number
  oddDayCustomers: number
  specialPreferenceCustomers: number
  orders1200: number
  orders1600: number
  orders2000: number
  orders2500: number
  orders3000: number
  singleItemOrders: number
  multiItemOrders: number
}

export default function MiddleAdminPage() {
  const [activeTab, setActiveTab] = useState('statistics')
  const [lowAdmins, setLowAdmins] = useState<Admin[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)
  const [isCreateCourierModalOpen, setIsCreateCourierModalOpen] = useState(false)
  const [isCreateFeatureModalOpen, setIsCreateFeatureModalOpen] = useState(false)
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'LOW_ADMIN'
  })
  const [courierFormData, setCourierFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [featureFormData, setFeatureFormData] = useState({
    name: '',
    description: '',
    type: 'TEXT',
    options: ''
  })
  const [clientFormData, setClientFormData] = useState({
    name: '',
    phone: '',
    address: '',
    calories: 1200,
    specialFeatures: ''
  })
  const [orderFormData, setOrderFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryTime: '',
    quantity: 1,
    calories: 1200,
    specialFeatures: '',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    isPrepaid: false
  })
  const [parsedCoords, setParsedCoords] = useState<{lat: number, lng: number} | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isCreatingCourier, setIsCreatingCourier] = useState(false)
  const [isCreatingFeature, setIsCreatingFeature] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [createError, setCreateError] = useState('')
  const [orderError, setOrderError] = useState('')
  const [courierError, setCourierError] = useState('')
  const [featureError, setFeatureError] = useState('')
  const [clientError, setClientError] = useState('')
  const [filters, setFilters] = useState({
    successful: false,
    failed: false,
    pending: false,
    inDelivery: false,
    prepaid: false,
    unpaid: false,
    card: false,
    cash: false,
    daily: false,
    evenDay: false,
    oddDay: false,
    special: false,
    calories1200: false,
    calories1600: false,
    calories2000: false,
    calories2500: false,
    calories3000: false,
    singleItem: false,
    multiItem: false
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || user.role !== 'MIDDLE_ADMIN') {
      window.location.href = '/'
      return
    }

    fetchData()
  }, []) // Initial load

  useEffect(() => {
    // Re-fetch data when date or filters change
    if (selectedDate || filters) {
      fetchData()
    }
  }, [selectedDate, filters])

  const fetchData = async () => {
    try {
      // Fetch low admins
      const adminsResponse = await fetch('/api/admin/low-admins', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json()
        setLowAdmins(adminsData)
      }

      // Fetch orders
      const ordersUrl = selectedDate 
        ? `/api/orders?date=${selectedDate.toISOString().split('T')[0]}&filters=${JSON.stringify(filters)}`
        : `/api/orders?filters=${JSON.stringify(filters)}`
      
      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
      }

      // Fetch clients
      const clientsResponse = await fetch('/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
      }

      // Fetch stats
      const statsResponse = await fetch('/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleSelectAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)))
    }
  }

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      alert('Пожалуйста, выберите заказы для удаления')
      return
    }

    const confirmMessage = `Вы уверены, что хотите удалить ${selectedOrders.size} заказ(ов)?\n\nЭто действие нельзя отменить.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/admin/orders/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Успешно удалено ${data.deletedCount} заказ(ов)`)
        setSelectedOrders(new Set())
        fetchData()
      } else {
        const data = await response.json()
        alert(`❌ Ошибка: ${data.error || 'Ошибка удаления заказов'}`)
      }
    } catch (error) {
      console.error('Delete orders error:', error)
      alert('❌ Ошибка соединения с сервером. Пожалуйста, попробуйте еще раз.')
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError('')

    try {
      const response = await fetch('/api/admin/low-admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateModalOpen(false)
        setCreateFormData({ name: '', email: '', password: '', role: 'LOW_ADMIN' })
        fetchData()
      } else {
        setCreateError(data.error || 'Ошибка создания администратора')
      }
    } catch (error) {
      setCreateError('Ошибка соединения с сервером')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddressChange = (value: string) => {
    setOrderFormData(prev => ({ ...prev, deliveryAddress: value }))
    
    // Парсим координаты в реальном времени
    const parsed = parseGoogleMapsUrl(value)
    if (parsed.includes(',')) {
      const coords = parsed.split(',')
      const lat = parseFloat(coords[0].trim())
      const lng = parseFloat(coords[1].trim())
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setParsedCoords({ lat, lng })
      } else {
        setParsedCoords(null)
      }
    } else {
      setParsedCoords(null)
    }
  }

  const parseGoogleMapsUrl = (url: string) => {
    // Проверяем, является ли это Google Maps ссылка
    if (!url.includes('maps.google.com') && !url.includes('google.com/maps')) {
      return url // Возвращаем как есть, если это не Google Maps ссылка
    }

    try {
      const urlObj = new URL(url)
      const searchParams = urlObj.searchParams
      
      // Извлекаем координаты из параметра q
      const qParam = searchParams.get('q')
      if (qParam && qParam.includes(',')) {
        const coords = qParam.split(',')
        const lat = parseFloat(coords[0].trim())
        const lng = parseFloat(coords[1].trim())
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return `${lat}, ${lng}`
        }
      }
      
      // Извлекаем координаты из параметра ll
      const llParam = searchParams.get('ll')
      if (llParam && llParam.includes(',')) {
        const coords = llParam.split(',')
        const lat = parseFloat(coords[0].trim())
        const lng = parseFloat(coords[1].trim())
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return `${lat}, ${lng}`
        }
      }
      
      // Если в URL есть координаты после @
      const hashMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (hashMatch) {
        return `${hashMatch[1]}, ${hashMatch[2]}`
      }
      
      return url // Возвращаем оригинальный URL, если не удалось извлечь координаты
    } catch (error) {
      console.error('Error parsing Google Maps URL:', error)
      return url
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingOrder(true)
    setOrderError('')

    try {
      // Парсим адрес для извлечения координат из Google Maps ссылки
      const parsedAddress = parseGoogleMapsUrl(orderFormData.deliveryAddress)
      
      // Извлекаем координаты, если они есть в адресе
      let latitude = null
      let longitude = null
      
      if (parsedAddress.includes(',')) {
        const coords = parsedAddress.split(',')
        const lat = parseFloat(coords[0].trim())
        const lng = parseFloat(coords[1].trim())
        
        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat
          longitude = lng
        }
      }

      // Добавляем координаты в данные заказа
      const orderDataWithCoords = {
        ...orderFormData,
        deliveryAddress: parsedAddress,
        latitude,
        longitude
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderDataWithCoords)
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateOrderModalOpen(false)
        setParsedCoords(null)
        setOrderFormData({
          customerName: '',
          customerPhone: '',
          deliveryAddress: '',
          deliveryTime: '',
          quantity: 1,
          calories: 1200,
          specialFeatures: '',
          paymentStatus: 'UNPAID',
          paymentMethod: 'CASH',
          isPrepaid: false
        })
        fetchData()
      } else {
        setOrderError(data.error || 'Ошибка создания заказа')
      }
    } catch (error) {
      setOrderError('Ошибка соединения с сервером')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingCourier(true)
    setCourierError('')

    try {
      const response = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...courierFormData,
          role: 'COURIER'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateCourierModalOpen(false)
        setCourierFormData({ name: '', email: '', password: '' })
        // Show success message or refresh data
      } else {
        setCourierError(data.error || 'Ошибка создания курьера')
      }
    } catch (error) {
      setCourierError('Ошибка соединения с сервером')
    } finally {
      setIsCreatingCourier(false)
    }
  }

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingFeature(true)
    setFeatureError('')

    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(featureFormData)
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateFeatureModalOpen(false)
        setFeatureFormData({
          name: '',
          description: '',
          type: 'TEXT',
          options: ''
        })
        // Show success message or refresh data
      } else {
        setFeatureError(data.error || 'Ошибка создания особенности')
      }
    } catch (error) {
      setFeatureError('Ошибка соединения с сервером')
    } finally {
      setIsCreatingFeature(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingClient(true)
    setClientError('')

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientFormData)
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateClientModalOpen(false)
        setClientFormData({
          name: '',
          phone: '',
          address: '',
          calories: 1200,
          specialFeatures: ''
        })
        fetchData()
      } else {
        setClientError(data.error || 'Ошибка создания клиента')
      }
    } catch (error) {
      setClientError('Ошибка соединения с сервером')
    } finally {
      setIsCreatingClient(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchData()
      } else {
        const data = await response.json()
        console.error('Error deleting client:', data.error)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleOpenOrder = (orderId: string) => {
    // Find the order
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setIsOrderDetailsModalOpen(true)
    }
  }

  const handleOpenRoute = (orderId: string) => {
    // Find the order
    const order = orders.find(o => o.id === orderId)
    if (order) {
      // For now, we'll open Google Maps with the address
      // In a real app, this could integrate with a mapping service
      const encodedAddress = encodeURIComponent(order.deliveryAddress)
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
    }
  }

  const handleGetAdminRoute = (order: Order) => {
    try {
      let destination = order.deliveryAddress
      
      // Если есть координаты, используем их для точной навигации
      if (order.latitude && order.longitude) {
        destination = `${order.latitude},${order.longitude}`
      }
      
      // Создаем ссылку для навигации от текущего местоположения к точке назначения
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destination}&travelmode=driving&dir_action=navigate`
      
      // Открываем ссылку в новой вкладке
      window.open(navigationUrl, '_blank')
    } catch (error) {
      console.error('Error getting route:', error)
    }
  }

  const getDateRange = () => {
    const dates = []
    const today = selectedDate || new Date()
    
    for (let i = -4; i <= 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500'
      case 'IN_DELIVERY': return 'bg-yellow-500'
      case 'FAILED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Доставлен'
      case 'IN_DELIVERY': return 'В доставке'
      case 'FAILED': return 'Не доставлен'
      default: return 'Ожидает'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">Панель Среднего Администратора</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                {new Date().toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Профиль
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Клиенты
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Администраторы
            </TabsTrigger>
            <TabsTrigger value="interface" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Интерфейс
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              История
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats && (
                <>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, successful: true, failed: false})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Успешные заказы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.successfulOrders}</div>
                      <p className="text-xs text-slate-500">Выполнено</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, successful: false, failed: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Неуспешные заказы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.failedOrders}</div>
                      <p className="text-xs text-slate-500">Отменено</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, pending: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Ожидающие заказы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                      <p className="text-xs text-slate-500">Ожидают доставки</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, inDelivery: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        В доставке
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.inDeliveryOrders}</div>
                      <p className="text-xs text-slate-500">В процессе доставки</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, prepaid: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Предоплаченные</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.prepaidOrders}</div>
                      <p className="text-xs text-slate-500">Оплачено заранее</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, unpaid: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Неоплаченные</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.unpaidOrders}</div>
                      <p className="text-xs text-slate-500">Оплата при получении</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, card: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Оплата картой</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.cardOrders}</div>
                      <p className="text-xs text-slate-500">Карта</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, cash: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Оплата наличными</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.cashOrders}</div>
                      <p className="text-xs text-slate-500">Наличные</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, daily: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Ежедневные клиенты</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.dailyCustomers}</div>
                      <p className="text-xs text-slate-500">Каждый день</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, evenDay: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Четные дни</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.evenDayCustomers}</div>
                      <p className="text-xs text-slate-500">Четные числа</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, oddDay: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Нечетные дни</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.oddDayCustomers}</div>
                      <p className="text-xs text-slate-500">Нечетные числа</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, special: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Особые предпочтения</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.specialPreferenceCustomers}</div>
                      <p className="text-xs text-slate-500">С особенностями</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, calories1200: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">1200 калорий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.orders1200}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, calories1600: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">1600 калорий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.orders1600}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, calories2000: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">2000 калорий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.orders2000}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, calories2500: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">2500 калорий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.orders2500}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, calories3000: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">3000 калорий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.orders3000}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, singleItem: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">1 блюдо в заказе</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.singleItemOrders}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {setActiveTab('orders'); setFilters({...filters, multiItem: true})}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">2+ блюда в заказе</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.multiItemOrders}</div>
                      <p className="text-xs text-slate-500">Заказов</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Управление Заказами</CardTitle>
                    <CardDescription>
                      Просмотр и управление всеми заказами
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                      <Filter className="w-4 h-4 mr-2" />
                      Фильтры
                    </Button>
                    <Dialog open={isCreateOrderModalOpen} onOpenChange={setIsCreateOrderModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Создать заказ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Создать Новый Заказ</DialogTitle>
                          <DialogDescription>
                            Заполните информацию о новом заказе
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateOrder}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="customerName" className="text-right">
                                Имя клиента
                              </Label>
                              <Input
                                id="customerName"
                                value={orderFormData.customerName}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="customerPhone" className="text-right">
                                Телефон клиента
                              </Label>
                              <Input
                                id="customerPhone"
                                type="tel"
                                value={orderFormData.customerPhone}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="deliveryAddress" className="text-right">
                                Адрес доставки
                              </Label>
                              <div className="col-span-3 space-y-2">
                                <div className="relative">
                                  <Input
                                    id="deliveryAddress"
                                    value={orderFormData.deliveryAddress}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                    placeholder="ул. Ленина, д. 1, кв. 1 или Google Maps ссылка"
                                    className={`col-span-3 ${parsedCoords ? 'pr-10 border-green-500 focus:border-green-500' : ''}`}
                                    required
                                  />
                                  {parsedCoords && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-slate-500">
                                    Можно ввести текстовый адрес или вставить Google Maps ссылку
                                  </p>
                                  {parsedCoords && (
                                    <p className="text-xs text-green-600 font-medium">
                                      📍 Координаты определены: {parsedCoords.lat.toFixed(6)}, {parsedCoords.lng.toFixed(6)}
                                    </p>
                                  )}
                                </div>
                                {orderFormData.deliveryAddress.includes('maps.google.com') || orderFormData.deliveryAddress.includes('google.com/maps') ? (
                                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    💡 Пример Google Maps ссылки: https://maps.google.com/maps?q=41.316661,69.248480&ll=41.316661,69.248480&z=16
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400">
                                    💡 Для автоматического определения координат вставьте Google Maps ссылку
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="deliveryTime" className="text-right">
                                Время доставки
                              </Label>
                              <Input
                                id="deliveryTime"
                                type="time"
                                value={orderFormData.deliveryTime}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="quantity" className="text-right">
                                Количество
                              </Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={orderFormData.quantity}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="calories" className="text-right">
                                Калории
                              </Label>
                              <select
                                id="calories"
                                value={orderFormData.calories}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, calories: parseInt(e.target.value) }))}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="1200">1200 ккал</option>
                                <option value="1600">1600 ккал</option>
                                <option value="2000">2000 ккал</option>
                                <option value="2500">2500 ккал</option>
                                <option value="3000">3000 ккал</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="paymentMethod" className="text-right">
                                Оплата
                              </Label>
                              <select
                                id="paymentMethod"
                                value={orderFormData.paymentMethod}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="CASH">Наличные</option>
                                <option value="CARD">Карта</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="specialFeatures" className="text-right">
                                Особенности
                              </Label>
                              <Input
                                id="specialFeatures"
                                value={orderFormData.specialFeatures}
                                onChange={(e) => setOrderFormData(prev => ({ ...prev, specialFeatures: e.target.value }))}
                                className="col-span-3"
                                placeholder="Особые пожелания"
                              />
                            </div>
                            {orderError && (
                              <div className="col-span-4">
                                <Alert variant="destructive">
                                  <AlertDescription>{orderError}</AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => {
                              setIsCreateOrderModalOpen(false)
                              setParsedCoords(null)
                            }}>
                              Отмена
                            </Button>
                            <Button type="submit" disabled={isCreatingOrder}>
                              {isCreatingOrder ? 'Создание...' : 'Создать заказ'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isCreateCourierModalOpen} onOpenChange={setIsCreateCourierModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Создать курьера
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Создать Курьера</DialogTitle>
                          <DialogDescription>
                            Создайте новый аккаунт для курьера
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateCourier}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="courierName" className="text-right">
                                Имя
                              </Label>
                              <Input
                                id="courierName"
                                value={courierFormData.name}
                                onChange={(e) => setCourierFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="courierEmail" className="text-right">
                                Email
                              </Label>
                              <Input
                                id="courierEmail"
                                type="email"
                                value={courierFormData.email}
                                onChange={(e) => setCourierFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="courierPassword" className="text-right">
                                Пароль
                              </Label>
                              <Input
                                id="courierPassword"
                                type="password"
                                value={courierFormData.password}
                                onChange={(e) => setCourierFormData(prev => ({ ...prev, password: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                          </div>
                          {courierError && (
                            <Alert className="mb-4">
                              <AlertDescription>{courierError}</AlertDescription>
                            </Alert>
                          )}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateCourierModalOpen(false)}>
                              Отмена
                            </Button>
                            <Button type="submit" disabled={isCreatingCourier}>
                              {isCreatingCourier ? 'Создание...' : 'Создать'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isCreateFeatureModalOpen} onOpenChange={setIsCreateFeatureModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" style={{display: 'none'}}>
                          <Plus className="w-4 h-4 mr-2" />
                          Создать особенность
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Создать Особенность</DialogTitle>
                          <DialogDescription>
                            Создайте новую особенность для заказов
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateFeature}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="featureName" className="text-right">
                                Название
                              </Label>
                              <Input
                                id="featureName"
                                value={featureFormData.name}
                                onChange={(e) => setFeatureFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="featureDescription" className="text-right">
                                Описание
                              </Label>
                              <Input
                                id="featureDescription"
                                value={featureFormData.description}
                                onChange={(e) => setFeatureFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="featureType" className="text-right">
                                Тип
                              </Label>
                              <select
                                id="featureType"
                                value={featureFormData.type}
                                onChange={(e) => setFeatureFormData(prev => ({ ...prev, type: e.target.value }))}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="TEXT">Текст</option>
                                <option value="SELECT">Выбор из списка</option>
                                <option value="CHECKBOX">Флажок</option>
                              </select>
                            </div>
                            {featureFormData.type === 'SELECT' && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="featureOptions" className="text-right">
                                  Варианты
                                </Label>
                                <Input
                                  id="featureOptions"
                                  value={featureFormData.options}
                                  onChange={(e) => setFeatureFormData(prev => ({ ...prev, options: e.target.value }))}
                                  className="col-span-3"
                                  placeholder="Вариант1, Вариант2, Вариант3"
                                />
                              </div>
                            )}
                          </div>
                          {featureError && (
                            <Alert className="mb-4">
                              <AlertDescription>{featureError}</AlertDescription>
                            </Alert>
                          )}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateFeatureModalOpen(false)}>
                              Отмена
                            </Button>
                            <Button type="submit" disabled={isCreatingFeature}>
                              {isCreatingFeature ? 'Создание...' : 'Создать'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Date Selector */}
                <div className="flex items-center justify-center mb-6 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    className={!selectedDate ? "bg-primary text-primary-foreground" : ""}
                  >
                    Все заказы
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex space-x-1">
                    {getDateRange().map((date, index) => (
                      <Button
                        key={index}
                        variant={selectedDate && date.toDateString() === selectedDate.toDateString() ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => setSelectedDate(date)}
                      >
                        {date.getDate()}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Selected Date Indicator */}
                {selectedDate && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 text-center">
                      📅 Показаны заказы за {selectedDate.toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}

                {/* Filters Panel */}
                {showFilters && (
                  <div className="mb-6 p-4 border rounded-lg bg-slate-50">
                    <h3 className="font-medium mb-4">Фильтры</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.successful}
                          onChange={(e) => setFilters({...filters, successful: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Успешные заказы</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.failed}
                          onChange={(e) => setFilters({...filters, failed: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Неуспешные заказы</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.pending}
                          onChange={(e) => setFilters({...filters, pending: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Ожидающие заказы</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.inDelivery}
                          onChange={(e) => setFilters({...filters, inDelivery: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">В доставке</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.prepaid}
                          onChange={(e) => setFilters({...filters, prepaid: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Предоплаченные</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.unpaid}
                          onChange={(e) => setFilters({...filters, unpaid: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Неоплаченные</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.card}
                          onChange={(e) => setFilters({...filters, card: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Оплата картой</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.cash}
                          onChange={(e) => setFilters({...filters, cash: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Оплата наличными</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.daily}
                          onChange={(e) => setFilters({...filters, daily: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Ежедневные клиенты</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.evenDay}
                          onChange={(e) => setFilters({...filters, evenDay: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Четные дни</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Orders Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              checked={selectedOrders.size === orders.length && orders.length > 0}
                              onChange={handleSelectAllOrders}
                            />
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">№</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Клиент</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Время</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Кол-во</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Калории</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Особенности</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Адрес</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Статус</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Телефон</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Действия</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 cursor-pointer">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                              <input 
                                type="checkbox" 
                                className="rounded"
                                checked={selectedOrders.has(order.id)}
                                onChange={() => handleOrderSelect(order.id)}
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                              {order.orderNumber}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.customer.name}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.deliveryTime}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.quantity}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.calories}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.specialFeatures ? 'Есть' : 'Нет'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.deliveryAddress}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(order.orderStatus)} mr-2`}></div>
                                <span className="text-sm">{getStatusText(order.orderStatus)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {order.customer.phone}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenOrder(order.id)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Открыть
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleGetAdminRoute(order)}
                                >
                                  <Route className="w-4 h-4 mr-1" />
                                  Маршрут
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Actions */}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleDeleteSelectedOrders}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить выбранные ({selectedOrders.size})
                    </Button>
                    <Button variant="outline" size="sm">
                      Добавить в закладки
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsCreateFeatureModalOpen(true)}>
                      Создать особенность
                    </Button>
                  </div>
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить изменения
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Управление Клиентами</CardTitle>
                    <CardDescription>
                      Создавайте, редактируйте и удаляйте клиентов
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateClientModalOpen} onOpenChange={setIsCreateClientModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Создать клиента
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Создать Клиента</DialogTitle>
                        <DialogDescription>
                          Создайте нового клиента в системе
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateClient}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientName" className="text-right">
                              Имя
                            </Label>
                            <Input
                              id="clientName"
                              value={clientFormData.name}
                              onChange={(e) => setClientFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientPhone" className="text-right">
                              Телефон
                            </Label>
                            <Input
                              id="clientPhone"
                              value={clientFormData.phone}
                              onChange={(e) => setClientFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientAddress" className="text-right">
                              Адрес
                            </Label>
                            <Input
                              id="clientAddress"
                              value={clientFormData.address}
                              onChange={(e) => setClientFormData(prev => ({ ...prev, address: e.target.value }))}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientCalories" className="text-right">
                              Калории
                            </Label>
                            <select
                              id="clientCalories"
                              value={clientFormData.calories}
                              onChange={(e) => setClientFormData(prev => ({ ...prev, calories: parseInt(e.target.value) }))}
                              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="1200">1200 ккал</option>
                              <option value="1600">1600 ккал</option>
                              <option value="2000">2000 ккал</option>
                              <option value="2500">2500 ккал</option>
                              <option value="3000">3000 ккал</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientSpecialFeatures" className="text-right">
                              Особенности
                            </Label>
                            <Input
                              id="clientSpecialFeatures"
                              value={clientFormData.specialFeatures}
                              onChange={(e) => setClientFormData(prev => ({ ...prev, specialFeatures: e.target.value }))}
                              className="col-span-3"
                              placeholder="Особые пожелания (необязательно)"
                            />
                          </div>
                        </div>
                        {clientError && (
                          <Alert className="mb-4">
                            <AlertDescription>{clientError}</AlertDescription>
                          </Alert>
                        )}
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCreateClientModalOpen(false)}>
                            Отмена
                          </Button>
                          <Button type="submit" disabled={isCreatingClient}>
                            {isCreatingClient ? 'Создание...' : 'Создать'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Clients Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Имя</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Телефон</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Адрес</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Калории</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Особенности</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата создания</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {clients.map((client) => (
                          <tr key={client.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                              {client.name}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {client.phone}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {client.address}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {client.calories} ккал
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {client.specialFeatures || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Удалить
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Details Modal */}
          <Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Детали Заказа</DialogTitle>
                <DialogDescription>
                  Полная информация о заказе
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Номер заказа:
                    </Label>
                    <div className="col-span-3 font-semibold">
                      #{selectedOrder.orderNumber}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Клиент:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.customer.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Телефон:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.customer.phone}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Адрес:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.deliveryAddress}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Время доставки:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.deliveryTime}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Количество:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.quantity}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Калории:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.calories} ккал
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Особенности:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.specialFeatures || 'Нет'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Статус:
                    </Label>
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedOrder.orderStatus)} mr-2`}></div>
                        <span>{getStatusText(selectedOrder.orderStatus)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Оплата:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.paymentMethod === 'CARD' ? 'Карта' : 'Наличные'} - {selectedOrder.paymentStatus === 'PAID' ? 'Оплачено' : 'Не оплачено'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Предоплата:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.isPrepaid ? 'Да' : 'Нет'}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => handleGetAdminRoute(selectedOrder!)}
                  disabled={!selectedOrder}
                >
                  <Route className="w-4 h-4 mr-2" />
                  Маршрут
                </Button>
                <Button variant="outline" onClick={() => setIsOrderDetailsModalOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Admins Tab */}
          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Управление Низкими Администраторами и Курьерами</CardTitle>
                    <CardDescription>
                      Добавляйте, удаляйте и управляйте низкими администраторами и курьерами
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Добавить Администратора или Курьера</DialogTitle>
                        <DialogDescription>
                          Создайте нового низкого администратора или курьера
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateAdmin}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Имя
                            </Label>
                            <Input
                              id="name"
                              value={createFormData.name}
                              onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={createFormData.email}
                              onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                              Пароль
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={createFormData.password}
                              onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                              className="col-span-3"
                              required
                              minLength={6}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                              Роль
                            </Label>
                            <select
                              id="role"
                              value={createFormData.role}
                              onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value }))}
                              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="LOW_ADMIN">Низкий администратор</option>
                              <option value="COURIER">Курьер</option>
                            </select>
                          </div>
                          {createError && (
                            <div className="col-span-4">
                              <Alert variant="destructive">
                                <AlertDescription>{createError}</AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Отмена
                          </Button>
                          <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Создание...' : 'Создать'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-slate-500">{admin.email}</p>
                          <Badge variant={admin.isActive ? "default" : "secondary"}>
                            {admin.role === 'COURIER' ? 'Курьер' : 'Низкий администратор'}
                          </Badge>
                          <Badge variant={admin.isActive ? "default" : "secondary"} className="ml-2">
                            {admin.isActive ? "Активен" : "Приостановлен"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Пароль
                        </Button>
                        <Button variant="outline" size="sm">
                          {admin.isActive ? (
                            <Pause className="w-4 h-4 mr-1" />
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          {admin.isActive ? "Приостановить" : "Активировать"}
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interface Tab */}
          <TabsContent value="interface" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Редактирование Интерфейсов</CardTitle>
                <CardDescription>
                  Настройте интерфейсы для низких администраторов и курьеров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  Здесь будет редактор интерфейсов для низких администраторов и курьеров
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>История Действий</CardTitle>
                <CardDescription>
                  История действий среднего администратора и низких администраторов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  Здесь будет история действий
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}