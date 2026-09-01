interface ResultProps {
  studentName: string
  score: number
  total: number
  isSubmitting: boolean
  submitError: string | null
  onSubmit: () => void
}

export function Result({ studentName, score, total, isSubmitting, submitError, onSubmit }: ResultProps) {
  const percentage = Math.round((score / total) * 100)

  const feedback =
    percentage >= 80
      ? { message: 'Excelente!', color: 'text-green-600', bg: 'bg-green-50' }
      : percentage >= 60
      ? { message: 'Bom trabalho!', color: 'text-indigo-600', bg: 'bg-indigo-50' }
      : { message: 'Continue praticando!', color: 'text-orange-600', bg: 'bg-orange-50' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Resultado de {studentName}</h2>

        <div className={`${feedback.bg} rounded-xl p-6 my-6`}>
          <p className={`text-5xl font-extrabold ${feedback.color}`}>
            {score}/{total}
          </p>
          <p className={`text-lg font-semibold mt-2 ${feedback.color}`}>
            {feedback.message}
          </p>
          <p className="text-gray-500 text-sm mt-1">{percentage}% de acertos</p>
        </div>

        {submitError && (
          <p role="alert" className="text-red-500 text-sm mb-4">
            {submitError}
          </p>
        )}

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-wait text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
        >
          {isSubmitting ? 'Enviando…' : 'Enviar resultado por email'}
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Você receberá seu resultado no email informado.
        </p>
      </div>
    </div>
  )
}
