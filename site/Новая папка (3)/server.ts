// server.ts - Next.js Standalone + Socket.IO + Auto Order Scheduler
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = Number(process.env.PORT || 3000);
const hostname = '0.0.0.0';

// In-memory storage (in production, use database)
let clients: any[] = [
  {
    id: '1',
    name: 'Иван Петров',
    phone: '+7 (999) 123-45-67',
    address: 'ул. Ленина, д. 1, кв. 1',
    calories: 2000,
    specialFeatures: 'Без лука',
    deliveryDays: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago - eligible for next month
    lastAutoOrderCheck: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Мария Иванова',
    phone: '+7 (999) 987-65-43',
    address: 'ул. Советская, д. 5, кв. 12',
    calories: 1600,
    specialFeatures: 'Двойная порции курицы',
    deliveryDays: {
      monday: false,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: true,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago - not eligible yet
    lastAutoOrderCheck: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Сергей Смирнов',
    phone: '+7 (999) 555-12-34',
    address: 'ул. Цветочная, д. 8, кв. 5',
    calories: 1800,
    specialFeatures: 'Экстра сыр',
    deliveryDays: {
      monday: true,
      tuesday: true,
      wednesday: false,
      thursday: false,
      friday: true,
      saturday: true,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago - eligible and should have gotten orders already
    lastAutoOrderCheck: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago - should get orders again
  }
];

let orders: any[] = [];

// Auto Order Scheduler Functions
// Updated: Next 30 days logic
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

function generateDeliveryTime(): string {
  const hour = 11 + Math.floor(Math.random() * 3) // 11:00 - 14:00
  const minute = Math.floor(Math.random() * 60)
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function has30DaysPassed(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff >= 30
}

async function createAutoOrdersForClient(client: any, startDate: Date, endDate: Date): Promise<any[]> {
  const createdOrders = []
  const currentDate = new Date(startDate)
  
  try {
    // Check if client exists in database by phone (more reliable than id)
    const dbClient = await db.customer.findUnique({
      where: { phone: client.phone }
    })
    
    if (!dbClient) {
      console.error(`❌ Client ${client.name} not found in database`)
      return []
    }
    
    console.log(`✅ Found client ${client.name} in database with ID: ${dbClient.id}`)
    
    // Get a default admin ID (you might want to create one or use existing)
    const defaultAdmin = await db.admin.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (!defaultAdmin) {
      console.error(`❌ No default admin found for creating orders`)
      return []
    }
    
    while (currentDate <= endDate) {
      const dayOfWeek = getDayOfWeek(currentDate)
      
      if (client.deliveryDays[dayOfWeek]) {
        try {
          // Get the highest order number from database
          const lastOrder = await db.order.findFirst({
            orderBy: { orderNumber: 'desc' }
          })
          const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

          // Create order in database
          const newOrder = await db.order.create({
            data: {
              orderNumber: nextOrderNumber,
              customerId: dbClient.id, // Use the database client ID
              adminId: defaultAdmin.id,
              deliveryAddress: client.address,
              deliveryTime: generateDeliveryTime(),
              quantity: 1,
              calories: client.calories,
              specialFeatures: client.specialFeatures || '',
              paymentStatus: 'UNPAID',
              paymentMethod: 'CASH',
              isPrepaid: false,
              orderStatus: 'PENDING',
            },
            include: {
              customer: {
                select: {
                  orderPattern: true
                }
              }
            }
          })
          
          createdOrders.push(newOrder)
          console.log(`📦 Created order #${nextOrderNumber} for ${client.name} on ${currentDate.toISOString().split('T')[0]}`)
        } catch (error) {
          console.error(`❌ Error creating order for ${client.name}:`, error)
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  } catch (error) {
    console.error(`❌ Error in createAutoOrdersForClient:`, error)
  }
  
  return createdOrders
}

function updateClientLastCheck(clientId: string) {
  const client = clients.find(c => c.id === clientId)
  if (client) {
    client.lastAutoOrderCheck = new Date().toISOString()
  }
}

// Main Auto Order Scheduler
async function runAutoOrderScheduler() {
  try {
    console.log('🤖 Auto Order Scheduler started')
    
    const today = new Date()
    
    // Find clients who need auto orders for next 30 days
    const eligibleClients = clients.filter(client => {
      if (!client.isActive || !client.autoOrdersEnabled) {
        return false
      }
      
      const daysSinceCreation = has30DaysPassed(client.createdAt)
      const daysSinceLastCheck = has30DaysPassed(client.lastAutoOrderCheck || client.createdAt)
      
      const isEligible = daysSinceCreation || daysSinceLastCheck
      
      if (isEligible) {
        console.log(`👤 Client ${client.name} is eligible for auto orders (created: ${new Date(client.createdAt).toDateString()}, last check: ${new Date(client.lastAutoOrderCheck || client.createdAt).toDateString()})`)
      } else {
        console.log(`⏳ Client ${client.name} is not yet eligible (created: ${new Date(client.createdAt).toDateString()}, last check: ${new Date(client.lastAutoOrderCheck || client.createdAt).toDateString()})`)
      }
      
      return isEligible
    })
    
    console.log(`👥 Found ${eligibleClients.length} eligible clients for auto orders (from ${clients.length} total active clients)`)
    
    if (eligibleClients.length === 0) {
      console.log('ℹ️ No eligible clients found for auto order creation')
      return
    }
    
    let totalOrdersCreated = 0
    
    // Process each eligible client
    for (const client of eligibleClients) {
      // Create orders for NEXT 30 DAYS (not next month)
      const startDate = new Date(today)
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 30)
      
      console.log(`📅 Creating orders for ${client.name} for period: ${startDate.toDateString()} - ${endDate.toDateString()} (next 30 days)`)
      
      const clientOrders = await createAutoOrdersForClient(client, startDate, endDate)
      totalOrdersCreated += clientOrders.length
      
      // Update client's last check date
      updateClientLastCheck(client.id)
      
      console.log(`✅ Created ${clientOrders.length} orders for ${client.name} and updated last check date`)
    }
    
    console.log(`🎉 Scheduler completed. Total orders created: ${totalOrdersCreated}`)
    
  } catch (error) {
    console.error('❌ Scheduler error:', error)
  }
}

async function initializeDatabaseClients() {
  try {
    console.log('🔄 Initializing database clients...')
    
    // First, ensure we have a default admin
    let defaultAdmin = await db.admin.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (!defaultAdmin) {
      const hashed = await bcrypt.hash('admin123', 10)
      defaultAdmin = await db.admin.create({
        data: {
          email: 'admin@delivery.com',
          password: hashed,
          name: 'Default Admin',
          role: 'SUPER_ADMIN',
          isActive: true
        }
      })
      console.log(`✅ Created default admin: ${defaultAdmin.name}`)
    } else {
      console.log(`ℹ️ Default admin already exists: ${defaultAdmin.name}`)
    }
    
    for (const client of clients) {
      // Check if client already exists
      const existingClient = await db.customer.findUnique({
        where: { phone: client.phone }
      })
      
      if (!existingClient) {
        // Create client in database
        const createdClient = await db.customer.create({
          data: {
            id: client.id,
            name: client.name,
            phone: client.phone,
            address: client.address,
            preferences: client.specialFeatures,
            orderPattern: 'daily' // Default pattern
          }
        })
        console.log(`✅ Created client in database: ${createdClient.name}`)
      } else {
        console.log(`ℹ️ Client already exists in database: ${existingClient.name}`)
      }
    }
    
    console.log('✅ Database clients initialization completed')
  } catch (error) {
    console.error('❌ Error initializing database clients:', error)
  }
}

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, async () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
      
      // Initialize database clients first
      await initializeDatabaseClients();
      
      // Start Auto Order Scheduler after server starts
      console.log('🚀 Starting Auto Order Scheduler...');
      
      // Run scheduler immediately on startup
      setTimeout(() => {
        runAutoOrderScheduler();
      }, 10000); // Wait 10 seconds after server starts to ensure database is ready
      
      // Schedule to run every hour (in production, you might want to run it daily)
      setInterval(() => {
        runAutoOrderScheduler();
      }, 60 * 60 * 1000); // Every hour
      
      console.log('⏰ Auto Order Scheduler will run every hour');
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Make scheduler functions available globally for API endpoints
(global as any).autoOrderScheduler = {
  runScheduler: runAutoOrderScheduler,
  getClients: () => clients,
  getOrders: () => orders,
  addClient: async (client: any) => {
    clients.push(client);
    console.log(`✅ Added new client: ${client.name}`);
    
    // Create auto orders for new client - 30 days forward from today
    if (client.autoOrdersEnabled && client.isActive) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const autoOrders = await createAutoOrdersForClient(client, startDate, endDate);
      console.log(`📦 Created ${autoOrders.length} auto orders for new client: ${client.name} (next 30 days)`);
    }
  }
};

// Start the server
createCustomServer();
