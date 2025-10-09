# 🤖 Автоматическое Создание Заказов - Инструкция по Настройке

## 📋 Обзор

Система автоматического создания заказов позволяет автоматически создавать заказы для клиентов на основе их предпочтений по дням недели.

## 🎯 Как это работает

1. **Настройка клиента**: При создании клиента указываются дни недели, когда ему нужно доставлять заказы
2. **Автоматическое создание**: Система каждый день проверяет, каким клиентам нужно создать заказы
3. **Уведомления**: Клиентам автоматически отправляются уведомления о созданных заказах

## 🔧 API Эндпоинты

### 1. Создание авто-заказов вручную
```
POST /api/admin/auto-orders/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetDate": "2024-01-15" // опционально, по умолчанию сегодня
}
```

### 2. Получение статистики
```
GET /api/admin/auto-orders/create
Authorization: Bearer <token>
```

### 3. Планировщик (для cron)
```
POST /api/admin/auto-orders/schedule
X-Cron-Token: <cron-secret-token>
```

### 4. Health check
```
GET /api/admin/auto-orders/schedule
X-Cron-Token: <cron-secret-token>
```

## ⏰ Настройка Cron Job

### Вариант 1: CronJob.org (бесплатный сервис)
1. Зарегистрируйтесь на [cron-job.org](https://cron-job.org)
2. Создайте новую задачу:
   - **URL**: `https://yourdomain.com/api/admin/auto-orders/schedule`
   - **Method**: `POST`
   - **Headers**: `X-Cron-Token: your-secret-token`
   - **Schedule**: `0 8 * * *` (каждый день в 8:00 UTC)
   - **Timezone**: Ваша временная зона

### Вариант 2: Vercel Cron Jobs
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/auto-orders/schedule",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Вариант 3: Linux Cron
```bash
# Откройте crontab
crontab -e

# Добавьте строку (каждый день в 8:00)
0 8 * * * curl -X POST https://yourdomain.com/api/admin/auto-orders/schedule -H "X-Cron-Token: your-secret-token"
```

### Вариант 4: GitHub Actions
```yaml
# .github/workflows/auto-orders.yml
name: Auto Orders Scheduler

on:
  schedule:
    - cron: '0 8 * * *' # Каждый день в 8:00 UTC
  workflow_dispatch: # Для ручного запуска

jobs:
  create-auto-orders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto Orders
        run: |
          curl -X POST \
            https://yourdomain.com/api/admin/auto-orders/schedule \
            -H "X-Cron-Token: ${{ secrets.CRON_TOKEN }}"
```

## 🔐 Безопасность

1. **Установите секретный токен** в переменных окружения:
   ```bash
   CRON_SECRET_TOKEN=your-very-secure-random-string
   ```

2. **Используйте HTTPS** для всех запросов

3. **Регулярно проверяйте логи** на предмет ошибок

## 📊 Мониторинг

### Health Check
Проверяйте состояние системы:
```bash
curl -H "X-Cron-Token: your-token" \
     https://yourdomain.com/api/admin/auto-orders/schedule
```

### Логи
Система логирует:
- 🤖 Запуск планировщика
- 📋 Найденные клиенты
- ✅ Созданные заказы
- 📧 Отправленные уведомления
- 📊 Статистика выполнения

## 🎛️ Управление через интерфейс

### Кнопки в панели администратора:
1. **🤖 Создать авто-заказы** - принудительное создание
2. **📊 Статистика авто-заказов** - просмотр статистики

### Управление клиентами:
1. **⏸️ Приостановить выбранных** - остановить авто-заказы
2. **▶️ Возобновить выбранных** - возобновить с текущего дня

## 🚨 Важные замечания

1. **Дубликаты**: Система не создает заказы, если они уже существуют на сегодня
2. **Время доставки**: Автоматически генерируется (11:00-14:00)
3. **Оплата**: По умолчанию "Наличные", "Не оплачено"
4. **Статус**: "PENDING" (ожидает обработки)
5. **Уведомления**: В демо-режиме только логирование

## 🔔 Уведомления (для реальной реализации)

### Email уведомления:
```javascript
// Пример функции отправки email
async function sendEmailNotification(client, order) {
  await emailService.send({
    to: client.email,
    subject: `Ваш заказ #${order.id} создан`,
    template: 'auto-order-created',
    data: { client, order }
  })
}
```

### SMS уведомления:
```javascript
// Пример функции отправки SMS
async function sendSMSNotification(client, order) {
  await smsService.send({
    to: client.phone,
    message: `Ваш заказ на ${order.deliveryDate} создан. Доставка в ${order.deliveryTime}`
  })
}
```

## 📈 Масштабирование

Для больших нагрузок:
1. **База данных**: Используйте реальные таблицы вместо mock данных
2. **Очередь**: Добавьте очередь для обработки уведомлений
3. **Кэширование**: Кэшируйте результаты запросов клиентов
4. **Мониторинг**: Добавьте метрики и алерты

## 🛠️ Отладка

### Тестирование cron:
```bash
# Тестовый запуск
curl -X POST \
     -H "X-Cron-Token: your-token" \
     -H "Content-Type: application/json" \
     -d '{"targetDate":"2024-01-15"}' \
     https://yourdomain.com/api/admin/auto-orders/create
```

### Проверка логов:
```bash
# Vercel
vercel logs

# Другие платформы
tail -f /var/log/app.log
```

---

## 🎉 Готово!

После настройки cron job система будет автоматически создавать заказы каждый день в указанное время. Администраторы могут управлять процессом через веб-интерфейс и отслеживать статистику.