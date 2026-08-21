import 'dotenv/config'
import cors from 'cors'
import express from 'express'

const app = express()
const port = process.env.PORT || 5000
const registrations = []

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.post('/api/register', (request, response) => {
  const { name, email, password } = request.body

  if (!name || !email || !password) {
    return response.status(400).json({
      message: 'Name, email, and password are required.',
    })
  }

  const registration = {
    id: registrations.length + 1,
    name,
    email,
    createdAt: new Date().toISOString(),
  }

  registrations.push({ ...registration, password })

  return response.status(201).json({
    message: 'Registration successful.',
    user: registration,
  })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
