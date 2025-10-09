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
  Users, 
  Settings, 
  BarChart3, 
  History, 
  User, 
  LogOut,
  Plus,
  Trash2,
  Pause,
  Play,
  Eye,
  Edit,
  Save
} from 'lucide-react'

interface Admin {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

interface ActionLog {
  id: string
  action: string
  entityType: string
  description: string
  createdAt: string
  admin: {
    name: string
  }
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState('admins')
  const [middleAdmins, setMiddleAdmins] = useState<Admin[]>([])
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || user.role !== 'SUPER_ADMIN') {
      window.location.href = '/'
      return
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch middle admins
      const adminsResponse = await fetch('/api/admin/middle-admins', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json()
        setMiddleAdmins(adminsData)
      }

      // Fetch action logs
      const logsResponse = await fetch('/api/admin/action-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        // API returns { logs: [...], total: ..., hasMore: ... }
        setActionLogs(logsData.logs || logsData)
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

  const toggleAdminStatus = async (adminId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/${adminId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling admin status:', error)
    }
  }

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого администратора?')) return
    
    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError('')

    try {
      const response = await fetch('/api/admin/middle-admins', {
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
        setCreateFormData({ name: '', email: '', password: '' })
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
              <h1 className="text-xl font-semibold text-slate-900">Панель Супер Администратора</h1>
            </div>
            <div className="flex items-center space-x-4">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Администраторы
            </TabsTrigger>
            <TabsTrigger value="interface" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Интерфейс
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              История
            </TabsTrigger>
          </TabsList>

          {/* Admins Tab */}
          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Управление Средними Администраторами</CardTitle>
                    <CardDescription>
                      Добавляйте, удаляйте и управляйте средними администраторами системы
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить администратора
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Добавить Среднего Администратора</DialogTitle>
                        <DialogDescription>
                          Создайте нового среднего администратора для системы
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
                  {middleAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-slate-500">{admin.email}</p>
                          <Badge variant={admin.isActive ? "default" : "secondary"}>
                            {admin.isActive ? "Активен" : "Приостановлен"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Пароль
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleAdminStatus(admin.id, admin.isActive)}
                        >
                          {admin.isActive ? (
                            <Pause className="w-4 h-4 mr-1" />
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          {admin.isActive ? "Приостановить" : "Активировать"}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteAdmin(admin.id)}
                        >
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
                  Выберите администратора и настройте его интерфейс
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Выберите администратора</h3>
                    <div className="space-y-2">
                      {middleAdmins.map((admin) => (
                        <div 
                          key={admin.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAdmin?.id === admin.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setSelectedAdmin(admin)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-sm text-slate-500">{admin.email}</p>
                            </div>
                            <Edit className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Настройки интерфейса</h3>
                    {selectedAdmin ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-slate-50">
                          <p className="text-sm text-slate-600 mb-2">
                            Здесь можно настроить кнопки и элементы интерфейса для {selectedAdmin.name}
                          </p>
                          <div className="space-y-2">
                            <div className="p-2 bg-white rounded border">📊 Статистика</div>
                            <div className="p-2 bg-white rounded border">📦 Заказы</div>
                            <div className="p-2 bg-white rounded border">👥 Администраторы</div>
                            <div className="p-2 bg-white rounded border">⚙️ Интерфейс</div>
                          </div>
                        </div>
                        <Button className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить изменения
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg bg-slate-50 text-center text-slate-500">
                        Выберите администратора для редактирования интерфейса
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Всего администраторов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{middleAdmins.length}</div>
                  <p className="text-xs text-slate-500">Средние администраторы</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Активные администраторы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {middleAdmins.filter(a => a.isActive).length}
                  </div>
                  <p className="text-xs text-slate-500">Сейчас онлайн</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Всего действий</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{actionLogs.length}</div>
                  <p className="text-xs text-slate-500">За все время</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Действий сегодня</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {actionLogs.filter(log => {
                      const logDate = new Date(log.createdAt).toDateString()
                      const today = new Date().toDateString()
                      return logDate === today
                    }).length}
                  </div>
                  <p className="text-xs text-slate-500">Сегодня</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>История Действий</CardTitle>
                <CardDescription>
                  Полная история всех действий в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actionLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm text-slate-500">
                            {new Date(log.createdAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="font-medium">{log.description}</p>
                        <p className="text-sm text-slate-500">
                          Выполнил: {log.admin.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}