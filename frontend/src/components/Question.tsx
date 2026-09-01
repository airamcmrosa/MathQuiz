import type { QuizQuestion } from '../types/quiz'

interface QuestionProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: number
  onAnswer: (answerIndex: number) => void
}

export function Question({ question, questionNumber, totalQuestions, selectedAnswer, onAnswer }: QuestionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl">
        <p className="text-sm text-indigo-500 font-medium mb-1">
          Pergunta {questionNumber} de {totalQuestions}
        </p>

        <h2 className="text-xl font-bold text-gray-800 mb-6">{question.text}</h2>

        <div
          role="radiogroup"
          aria-label={`Opções para: ${question.text}`}
          className="space-y-3"
        >
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx
            return (
              <button
                key={idx}
                role="radio"
                aria-checked={isSelected}
                onClick={() => onAnswer(idx)}
                className={`w-full text-left px-5 py-3 rounded-xl border-2 transition font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block w-6 h-6 rounded-full border-2 mr-3 align-middle transition ${
                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                  }`}
                />
                {option}
              </button>
            )
          })}
        </div>

        {selectedAnswer !== undefined && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            Avançando automaticamente…
          </p>
        )}
      </div>
    </div>
  )
}
