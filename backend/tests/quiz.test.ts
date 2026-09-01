import request from 'supertest'
import { app } from '../src/index'

// Mock S3 service to avoid real AWS calls
jest.mock('../src/services/s3Service', () => ({
  saveToS3: jest.fn(),
}))

import { saveToS3 } from '../src/services/s3Service'
const mockSaveToS3 = saveToS3 as jest.MockedFunction<typeof saveToS3>

const validPayload = {
  studentName: 'Maria Rosa',
  studentEmail: 'maria@example.com',
  answers: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
  score: 5,
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.S3_BUCKET = 'test-bucket'
  process.env.AWS_REGION = 'us-east-1'
  process.env.PORT = '3001'
  process.env.FRONTEND_URL = 'http://localhost:5173'
})

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('POST /api/quiz/submit', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/quiz/submit').send({})
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/quiz/submit')
      .send({ ...validPayload, studentEmail: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when answers array has wrong length', async () => {
    const res = await request(app)
      .post('/api/quiz/submit')
      .send({ ...validPayload, answers: [0, 1, 2] })
    expect(res.status).toBe(400)
  })

  it('returns 400 when score is out of range', async () => {
    const res = await request(app)
      .post('/api/quiz/submit')
      .send({ ...validPayload, score: 11 })
    expect(res.status).toBe(400)
  })

  it('returns 200 with resultKey on valid payload', async () => {
    mockSaveToS3.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .post('/api/quiz/submit')
      .send(validPayload)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.resultKey).toMatch(/^results\/maria@example\.com\/\d+\.json$/)
  })

  it('calls saveToS3 with correct bucket and data shape', async () => {
    mockSaveToS3.mockResolvedValueOnce(undefined)

    await request(app).post('/api/quiz/submit').send(validPayload)

    expect(mockSaveToS3).toHaveBeenCalledWith(
      'test-bucket',
      expect.stringMatching(/^results\/maria@example\.com\/\d+\.json$/),
      expect.objectContaining({
        studentName: 'Maria Rosa',
        studentEmail: 'maria@example.com',
        score: 5,
        answers: validPayload.answers,
        completedAt: expect.any(String),
      })
    )
  })

  it('returns 503 when S3 throws an error', async () => {
    mockSaveToS3.mockRejectedValueOnce(new Error('S3 unavailable'))

    const res = await request(app).post('/api/quiz/submit').send(validPayload)

    expect(res.status).toBe(503)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Failed to save result')
  })
})
