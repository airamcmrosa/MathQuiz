import { z } from 'zod'

export const QuizSubmitSchema = z.object({
  studentName: z.string().min(2).max(100),
  studentEmail: z.string().email(),
  answers: z.array(z.number().int().min(0).max(3)).length(10),
  score: z.number().int().min(0).max(10),
})

export type QuizSubmitPayload = z.infer<typeof QuizSubmitSchema>

export interface QuizResult {
  studentName: string
  studentEmail: string
  score: number
  answers: number[]
  completedAt: string
}

export interface SubmitResponse {
  success: boolean
  resultKey?: string
  error?: string
}
