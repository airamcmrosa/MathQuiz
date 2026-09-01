import express from 'express'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import healthRouter from './routes/health'
import quizRouter from './routes/quiz'

// Validate required environment variables before starting
const requiredEnvVars = ['S3_BUCKET', 'AWS_REGION', 'PORT', 'FRONTEND_URL'] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[startup] Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

const app = express()
const port = parseInt(process.env.PORT as string, 10)

app.use(corsMiddleware)
app.use(express.json())

app.use(healthRouter)
app.use(quizRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`)
})

export { app }
