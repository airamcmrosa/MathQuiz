export interface QuizQuestion {
  id: number
  text: string
  options: string[]
  correctIndex: number
}

export interface StudentInfo {
  name: string
  email: string
}

export interface QuizSubmitPayload {
  studentName: string
  studentEmail: string
  answers: number[]
  score: number
}

export interface QuizSubmitResponse {
  success: boolean
  resultKey?: string
  error?: string
}

export type QuizStage = 'start' | 'quiz' | 'result' | 'submitted' | 'error'

export interface QuizState {
  stage: QuizStage
  currentQuestion: number
  answers: number[]
  score: number
  student: StudentInfo
  isSubmitting: boolean
  submitError: string | null
}
