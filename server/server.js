import dns from 'node:dns'
import crypto from 'node:crypto'
import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '1.1.1.1'])

const app = express()

const port = process.env.PORT || 5000
const mongoUri = process.env.MONGO_URI

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigin = process.env.CLIENT_URL
      const isLocalOrigin = !origin || origin === 'http://localhost:5173'
      const isVercelOrigin = origin?.endsWith('.vercel.app')

      if (isLocalOrigin || origin === allowedOrigin || isVercelOrigin) {
        return callback(null, true)
      }

      return callback(new Error('Origin is not allowed by CORS'))
    },
  })
)

app.use(express.json())

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const User = mongoose.model('User', userSchema)

// Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')

  return `${salt}:${hash}`
}

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':')
  if (!salt || !storedHash) return false

  const passwordHash = crypto.scryptSync(password, salt, 64)
  const expectedHash = Buffer.from(storedHash, 'hex')

  return passwordHash.length === expectedHash.length && crypto.timingSafeEqual(passwordHash, expectedHash)
}

// Test route
app.get('/', (request, response) => {
  response.json({
    message: 'Server is running',
  })
})

// Database health check
app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
  })
})

// Registration API
app.post('/api/register', async (request, response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return response.status(503).json({
        message: 'Database is unavailable. Check MONGO_URI and MongoDB Atlas network access.',
      })
    }

    const name = request.body.name?.trim()
    const email = request.body.email?.trim().toLowerCase()
    const phone = request.body.phone?.trim()
    const dob = request.body.dob?.trim()
    const gender = request.body.gender?.trim()
    const password = request.body.password

    // Check required fields
    if (!name || !email || !phone || !dob || !gender || !password) {
      return response.status(400).json({
        message: 'All registration fields are required',
      })
    }

    // Validate email
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return response.status(400).json({
        message: 'Please provide a valid email address',
      })
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      return response.status(400).json({
        message: 'Phone number must contain exactly 10 digits',
      })
    }

    // Validate password
    if (password.length < 6) {
      return response.status(400).json({
        message: 'Password must be at least 6 characters',
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      dob,
      gender,
      password: hashPassword(password),
    })

    return response.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)

    if (error.code === 11000) {
      return response.status(409).json({
        message: 'Email is already registered',
      })
    }

    return response.status(500).json({
      message: 'Server error',
    })
  }
})

// Login API
app.post('/api/login', async (request, response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return response.status(503).json({
        message: 'Database is unavailable. Check MONGO_URI and MongoDB Atlas network access.',
      })
    }

    const email = request.body.email?.trim().toLowerCase()
    const password = request.body.password

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user || !verifyPassword(password, user.password)) {
      return response.status(401).json({ message: 'Invalid email or password' })
    }

    return response.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

app.put('/api/account/:id', async (request, response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return response.status(503).json({ message: 'Database is unavailable.' })
    }

    const updates = {
      name: request.body.name?.trim(),
      phone: request.body.phone?.trim(),
      dob: request.body.dob?.trim(),
      gender: request.body.gender?.trim(),
    }

    if (!updates.name || !/^\d{10}$/.test(updates.phone) || !updates.dob || !['Male', 'Female', 'Other'].includes(updates.gender)) {
      return response.status(400).json({ message: 'Please provide valid account details' })
    }

    const user = await User.findByIdAndUpdate(request.params.id, updates, { new: true, runValidators: true })
    if (!user) return response.status(404).json({ message: 'User not found' })

    return response.json({
      message: 'Account updated successfully',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, dob: user.dob, gender: user.gender },
    })
  } catch (error) {
    console.error('Account update error:', error)
    return response.status(500).json({ message: 'Unable to update account' })
  }
})

app.get('/api/users', async (request, response) => {
  try {
    const users = await User.find({}).select('name email phone dob gender createdAt').sort({ createdAt: -1 })
    return response.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        createdAt: user.createdAt,
      })),
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return response.status(500).json({ message: 'Unable to load users' })
  }
})

app.get('/api/stats', async (request, response) => {
  try {
    const totalUsers = await User.countDocuments()
    const currentDate = new Date()
    const startOfDay = new Date(currentDate)
    startOfDay.setHours(0, 0, 0, 0)

    const activeToday = await User.countDocuments({ createdAt: { $gte: startOfDay } })
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const signupsThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } })

    return response.json({
      totalUsers,
      activeToday,
      signupsThisWeek,
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return response.status(500).json({ message: 'Unable to load stats' })
  }
})

app.delete('/api/users/:id', async (request, response) => {
  try {
    const user = await User.findByIdAndDelete(request.params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found' })
    }

    return response.json({ message: 'User removed successfully' })
  } catch (error) {
    console.error('User delete error:', error)
    return response.status(500).json({ message: 'Unable to remove user' })
  }
})

// Start server
async function startServer() {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })

  if (!mongoUri) {
    console.error('MONGO_URI is missing. Add it to server/.env')
    return
  }

  await connectToMongo()
}

async function connectToMongo() {
  try {
    await mongoose.connect(mongoUri, {
      authSource: 'admin',
      serverSelectionTimeoutMS: 5000,
    })
    console.log('MongoDB connected successfully')
  } catch (error) {
    if (error.message.includes('bad auth')) {
      console.error('MongoDB authentication failed. Check the Atlas database user credentials and URL-encode special password characters.')
    } else {
      console.error('MongoDB connection failed:', error.message)
    }
    setTimeout(connectToMongo, 10000)
  }
}

startServer()
