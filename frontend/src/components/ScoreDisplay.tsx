import type { QuizQuestion } from '../types/quiz'

interface ScoreDisplayProps {
  questions: QuizQuestion[]
  answers: number[]
  score: number
}

export function ScoreDisplay({ questions, answers, score }: ScoreDisplayProps) {
  return (
    <div className="mt-6 space-y-2 text-left">
      <h3 className="font-semibold text-gray-700 mb-3">Resumo das respostas</h3>
      {questions.map((q, idx) => {
        const isCorrect = answers[idx] === q.correctIndex
        return (
          <div
            key={q.id}
            className={`p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            <span aria-hidden="true" className="mr-2">{isCorrect ? '✓' : '✗'}</span>
            <span className="font-medium">Q{idx + 1}:</span> {q.text}
            {!isCorrect && (
              <p className="ml-4 mt-1 text-xs text-gray-500">
                Correto: {q.options[q.correctIndex]}
              </p>
            )}
          </div>
        )
      })}
      <p className="text-center font-semibold text-gray-700 pt-2">
        Total: {score}/{questions.length}
      </p>
    </div>
  )
}

export function Submitted({ studentEmail }: { studentEmail: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-green-500 text-6xl mb-4" aria-hidden="true">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resultado enviado!</h2>
        <p className="text-gray-500">
          Você receberá seu resultado em <span className="font-medium text-indigo-600">{studentEmail}</span> em breve.
        </p>
      </div>
    </div>
  )
}
