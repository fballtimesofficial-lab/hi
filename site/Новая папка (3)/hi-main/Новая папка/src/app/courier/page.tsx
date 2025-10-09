'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  MapPin, 
  Phone, 
  User, 
  LogOut,
  Play,
  X,
  Route,
  Clock,
  Utensils
} from 'lucide-react'

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
  specialFeatures?: string
  orderStatus: string
}

export default function CourierPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [isOrderOpen, setIsOrderOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to format special features
  const formatSpecialFeatures = (features: string | undefined) => {
    if (!features || features === 'undefined' || features === 'null') return 'Нет'
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(features)
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .filter(([_, value]) => value === true || value === 'true') // Only show true values
          .map(([key, value]) => {
            // Translate common keys to Russian
            const translations: Record<string, string> = {
              'priority': 'Приоритет',
              'spicy': 'Острое',
              'vegetarian': 'Вегетарианское',
              'noOnions': 'Без лука',
              'extraSauce': 'Дополнительный соус'
            }
            return translations[key] || key
          })
          .join(', ') || 'Нет'
      }
      return features
    } catch {
      // If not JSON, return as is
      return features
    }
  }

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || user.role !== 'COURIER') {
      window.location.href = '/'
      return
    }

    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const ordersData = await response.json()
        console.log('Fetched orders:', ordersData)
        
        // Фильтруем только доступные для доставки заказы
        const availableOrders = ordersData.filter((order: Order) => 
          order.orderStatus === 'PENDING' || order.orderStatus === 'IN_DELIVERY'
        )
        
        // Проверяем и очищаем данные заказов
        const cleanedOrders = availableOrders.map((order: Order) => ({
          ...order,
          customer: order.customer || { name: 'Неизвестный клиент', phone: 'Нет телефона' },
          specialFeatures: order.specialFeatures || '',
          latitude: order.latitude || undefined,
          longitude: order.longitude || undefined
        }))
        
        setOrders(cleanedOrders)
        
        // Если нет текущего заказа, выбираем первый доступный
        if (!currentOrder && cleanedOrders.length > 0) {
          setCurrentOrder(cleanedOrders[0])
        }
        
        // Если есть текущий заказ, обновляем его данные
        if (currentOrder) {
          const updatedCurrent = cleanedOrders.find((order: Order) => order.id === currentOrder.id)
          if (updatedCurrent) {
            setCurrentOrder(updatedCurrent)
          } else {
            // Текущий заказ больше не доступен
            setCurrentOrder(cleanedOrders.length > 0 ? cleanedOrders[0] : null)
            setIsOrderOpen(false)
          }
        }
      } else {
        console.error('Failed to fetch orders:', response.status)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextOrder = async () => {
    try {
      const response = await fetch('/api/courier/next-order', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const orderData = await response.json()
        console.log('Next order:', orderData)
        
        // Очищаем и проверяем данные заказа
        const cleanedOrder = {
          ...orderData,
          customer: orderData.customer || { name: 'Неизвестный клиент', phone: 'Нет телефона' },
          specialFeatures: orderData.specialFeatures || '',
          latitude: orderData.latitude || undefined,
          longitude: orderData.longitude || undefined
        }
        
        setCurrentOrder(cleanedOrder)
        setIsOrderOpen(false)
      } else {
        console.log('No pending orders available')
        setCurrentOrder(null)
      }
    } catch (error) {
      console.error('Error fetching next order:', error)
      setCurrentOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenOrder = async () => {
    if (!currentOrder) {
      console.log('No current order selected')
      return
    }
    
    console.log('Opening order:', currentOrder.id, currentOrder.orderNumber)
    
    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'start_delivery' })
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        setIsOrderOpen(true)
        // Refresh orders to get updated status
        fetchOrders()
        console.log('Order opened successfully')
      } else {
        const errorData = await response.json()
        console.error('Error starting delivery:', errorData.error)
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error starting delivery:', error)
      alert('Произошла ошибка при начале доставки')
    }
  }

  const handleCloseOrder = async () => {
    if (!currentOrder) {
      console.log('No current order selected')
      return
    }
    
    console.log('Closing order:', currentOrder.id, currentOrder.orderNumber)
    
    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'complete_delivery' })
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        // Swipe animation and update orders
        await new Promise(resolve => setTimeout(resolve, 300))
        fetchOrders()
        setIsOrderOpen(false)
        console.log('Order closed successfully')
      } else {
        const errorData = await response.json()
        console.error('Error completing delivery:', errorData.error)
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error completing delivery:', error)
      alert('Произошла ошибка при завершении доставки')
    }
  }

  const handleSelectOrder = (order: Order) => {
    setCurrentOrder(order)
    setIsOrderOpen(false)
  }

  const handleGetRoute = async () => {
    if (!currentOrder) return
    
    try {
      let destination = currentOrder.deliveryAddress
      
      // Если есть координаты, используем их для точной навигации
      if (currentOrder.latitude && currentOrder.longitude) {
        destination = `${currentOrder.latitude},${currentOrder.longitude}`
      }
      
      // Создаем ссылку для навигации от текущего местоположения к точке назначения
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destination}&travelmode=driving&dir_action=navigate`
      
      // Открываем ссылку в новой вкладке
      window.open(navigationUrl, '_blank')
    } catch (error) {
      console.error('Error getting route:', error)
    }
  }

  const handleViewOrderDetails = () => {
    if (!currentOrder) return
    
    // Показываем детальную информацию о заказе
    const details = `
      Заказ #${currentOrder.orderNumber}
      Клиент: ${currentOrder.customer.name}
      Телефон: ${currentOrder.customer.phone}
      Адрес: ${currentOrder.deliveryAddress}
      Время: ${currentOrder.deliveryTime}
      Блюд: ${currentOrder.quantity} шт.
      Калории: ${currentOrder.calories}
      Особенности: ${formatSpecialFeatures(currentOrder.specialFeatures) || 'Нет'}
    `
    
    alert(details)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">Панель Курьера</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Orders List */}
        {orders.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Доступные заказы ({orders.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      currentOrder?.id === order.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Заказ #{order.orderNumber}</div>
                        <div className="text-sm text-slate-600">{order.customer.name}</div>
                        <div className="text-sm text-slate-600">{order.deliveryAddress}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={order.orderStatus === 'PENDING' ? 'secondary' : 'default'}
                          className={order.orderStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {order.orderStatus === 'PENDING' ? 'Ожидает' : 'В доставке'}
                        </Badge>
                        <div className="text-sm text-slate-500 mt-1">{order.deliveryTime}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentOrder ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Заказ #{currentOrder.orderNumber}</h2>
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {isOrderOpen ? 'В доставке' : 'Ожидает'}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{currentOrder.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!isOrderOpen ? (
                      <Button 
                        onClick={handleOpenOrder}
                        className="bg-green-700 hover:bg-green-800"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Открыть заказ
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleCloseOrder}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Закрыть заказ
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Информация о клиенте
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Имя клиента</p>
                          <p className="font-medium">{currentOrder.customer.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Телефон</p>
                          <p className="font-medium">{currentOrder.customer.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Адрес доставки</p>
                          <p className="font-medium">{currentOrder.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Детали заказа
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Package className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Количество блюд</p>
                          <p className="font-medium">{currentOrder.quantity} шт.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Utensils className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Калории</p>
                          <p className="font-medium">{currentOrder.calories} ккал</p>
                        </div>
                      </div>
                      
                      {currentOrder.specialFeatures && (
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                          <div>
                            <p className="text-sm text-slate-500">Особенности</p>
                            <p className="font-medium">{formatSpecialFeatures(currentOrder.specialFeatures)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                  <Button 
                    onClick={handleViewOrderDetails}
                    size="lg"
                    variant="outline"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Информация о заказе
                  </Button>
                  <Button 
                    onClick={handleGetRoute}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Route className="w-5 h-5 mr-2" />
                    Маршрут
                  </Button>
                </div>

                {/* Instructions */}
                {isOrderOpen && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Инструкции:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Нажмите "Маршрут" чтобы запустить навигацию от вашего текущего местоположения</li>
                      <li>2. Google Maps автоматически построит маршрут и начнет навигацию</li>
                      <li>3. Следуйте по маршруту к адресу доставки</li>
                      <li>4. После доставки заказа нажмите "Закрыть заказ"</li>
                      <li>5. Смахните вправо для перехода к следующему заказу</li>
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Нет доступных заказов
                </h3>
                <p className="text-slate-600 mb-6">
                  В настоящее время нет доступных заказов для доставки. 
                  Пожалуйста, подождите или обновите страницу позже.
                </p>
                <Button onClick={fetchOrders}>
                  Обновить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}