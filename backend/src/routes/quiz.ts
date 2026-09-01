import { Router, type Request, type Response } from 'express'
import { QuizSubmitSchema, type QuizResult, type SubmitResponse } from '../types/quiz'
import { saveToS3 } from '../services/s3Service'

const router = Router()

router.post('/api/quiz/submit', async (req: Request, res: Response) => {
  const parsed = QuizSubmitSchema.safeParse(req.body)

  if (!parsed.success) {
    const response: SubmitResponse = {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
    res.status(400).json(response)
    return
  }

  const { studentName, studentEmail, answers, score } = parsed.data

  const result: QuizResult = {
    studentName,
    studentEmail,
    score,
    answers,
    completedAt: new Date().toISOString(),
  }

  const timestamp = Date.now()
  const key = `results/${studentEmail}/${timestamp}.json`
  const bucket = process.env.S3_BUCKET as string

  try {
    await saveToS3(bucket, key, result)
    const response: SubmitResponse = { success: true, resultKey: key }
    res.status(200).json(response)
  } catch (err) {
    console.error('[s3 upload failed]', err)
    const response: SubmitResponse = { success: false, error: 'Failed to save result' }
    res.status(503).json(response)
  }
})

export default router
