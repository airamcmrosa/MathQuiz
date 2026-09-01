import { useReducer } from 'react'
import type { QuizState, StudentInfo, QuizSubmitPayload, QuizSubmitResponse } from '../types/quiz'
import { questions } from '../data/questions'

type QuizAction =
  | { type: 'START'; payload: StudentInfo }
  | { type: 'ANSWER'; payload: { questionIndex: number; answerIndex: number } }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: { resultKey: string } }
  | { type: 'SUBMIT_ERROR'; payload: { error: string } }

const initialState: QuizState = {
  stage: 'start',
  currentQuestion: 0,
  answers: [],
  score: 0,
  student: { name: '', email: '' },
  isSubmitting: false,
  submitError: null,
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        stage: 'quiz',
        student: action.payload,
      }

    case 'ANSWER': {
      const newAnswers = [...state.answers]
      newAnswers[action.payload.questionIndex] = action.payload.answerIndex

      const isLastQuestion = action.payload.questionIndex === questions.length - 1

      if (isLastQuestion) {
        const score = newAnswers.reduce((acc, answer, idx) => {
          return acc + (answer === questions[idx].correctIndex ? 1 : 0)
        }, 0)
        return {
          ...state,
          answers: newAnswers,
          score,
          stage: 'result',
          currentQuestion: action.payload.questionIndex,
        }
      }

      return {
        ...state,
        answers: newAnswers,
        currentQuestion: action.payload.questionIndex + 1,
      }
    }

    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, submitError: null }

    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, stage: 'submitted' }

    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, submitError: action.payload.error, stage: 'error' }

    default:
      return state
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  function startQuiz(student: StudentInfo) {
    dispatch({ type: 'START', payload: student })
  }

  function answerQuestion(questionIndex: number, answerIndex: number) {
    dispatch({ type: 'ANSWER', payload: { questionIndex, answerIndex } })
  }

  async function submitResult() {
    dispatch({ type: 'SUBMIT_START' })

    const payload: QuizSubmitPayload = {
      studentName: state.student.name,
      studentEmail: state.student.email,
      answers: state.answers,
      score: state.score,
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL as string
      const res = await fetch(`${apiUrl}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as QuizSubmitResponse

      if (!res.ok || !data.success) {
        dispatch({ type: 'SUBMIT_ERROR', payload: { error: data.error ?? 'Erro ao enviar resultado' } })
        return
      }

      dispatch({ type: 'SUBMIT_SUCCESS', payload: { resultKey: data.resultKey ?? '' } })
    } catch {
      dispatch({ type: 'SUBMIT_ERROR', payload: { error: 'Erro de conexão. Tente novamente.' } })
    }
  }

  return { state, startQuiz, answerQuestion, submitResult }
}
