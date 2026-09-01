import { useState } from 'react'
import type { StudentInfo } from '../types/quiz'

interface QuizStartProps {
  onStart: (student: StudentInfo) => void
}

export function QuizStart({ onStart }: QuizStartProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isNameValid = name.trim().length >= 2
  const canStart = isEmailValid && isNameValid

  function validateEmail(value: string) {
    setEmail(value)
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Email inválido')
    } else {
      setEmailError('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canStart) return
    onStart({ name: name.trim(), email: email.trim() })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Quiz</h1>
        <p className="text-gray-500 text-center mb-8">
          Responda 10 perguntas e receba seu resultado por email.
        </p>

        <form onSubmit={handleSubmit} noValidate aria-label="Formulário de início do quiz">
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo <span aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              aria-invalid={name.length > 0 && !isNameValid}
              minLength={2}
              maxLength={100}
              placeholder="Seu nome completo"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          <div className="mb-8">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => validateEmail(e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              placeholder="seu@email.com"
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
                emailError ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {emailError && (
              <p id="email-error" role="alert" className="text-red-500 text-xs mt-1">
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canStart}
            aria-disabled={!canStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            Iniciar Quiz
          </button>
        </form>
      </div>
    </div>
  )
}
