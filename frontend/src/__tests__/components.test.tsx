import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuizStart } from '../components/QuizStart'
import { Question } from '../components/Question'
import { ProgressBar } from '../components/ProgressBar'
import { Result } from '../components/Result'
import { questions } from '../data/questions'

describe('QuizStart', () => {
  it('renders form with name and email fields', () => {
    render(<QuizStart onStart={vi.fn()} />)
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('disables start button when fields are empty', () => {
    render(<QuizStart onStart={vi.fn()} />)
    const button = screen.getByRole('button', { name: /iniciar quiz/i })
    expect(button).toBeDisabled()
  })

  it('disables start button with invalid email', () => {
    render(<QuizStart onStart={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'João Silva' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } })
    const button = screen.getByRole('button', { name: /iniciar quiz/i })
    expect(button).toBeDisabled()
  })

  it('enables start button with valid name and email', () => {
    render(<QuizStart onStart={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'João Silva' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'joao@email.com' } })
    const button = screen.getByRole('button', { name: /iniciar quiz/i })
    expect(button).not.toBeDisabled()
  })

  it('calls onStart with student info when form is submitted', () => {
    const onStart = vi.fn()
    render(<QuizStart onStart={onStart} />)
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Maria Rosa' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'maria@email.com' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar quiz/i }))
    expect(onStart).toHaveBeenCalledWith({ name: 'Maria Rosa', email: 'maria@email.com' })
  })
})

describe('Question', () => {
  const mockQuestion = questions[0]

  it('renders question text', () => {
    render(
      <Question
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={10}
        onAnswer={vi.fn()}
      />
    )
    expect(screen.getByText(mockQuestion.text)).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(
      <Question
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={10}
        onAnswer={vi.fn()}
      />
    )
    mockQuestion.options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument()
    })
  })

  it('calls onAnswer with correct index when option is clicked', () => {
    const onAnswer = vi.fn()
    render(
      <Question
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={10}
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText(mockQuestion.options[2]))
    expect(onAnswer).toHaveBeenCalledWith(2)
  })

  it('marks selected answer as aria-checked', () => {
    render(
      <Question
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={10}
        selectedAnswer={1}
        onAnswer={vi.fn()}
      />
    )
    const radioGroup = screen.getByRole('radiogroup')
    const radios = radioGroup.querySelectorAll('[role="radio"]')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
  })
})

describe('ProgressBar', () => {
  it('renders with correct aria attributes', () => {
    render(<ProgressBar current={3} total={10} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
  })

  it('shows question count text', () => {
    render(<ProgressBar current={5} total={10} />)
    expect(screen.getByText(/5 de 10/i)).toBeInTheDocument()
  })
})

describe('Result', () => {
  const defaultProps = {
    studentName: 'Maria',
    score: 8,
    total: 10,
    isSubmitting: false,
    submitError: null,
    onSubmit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays score correctly', () => {
    render(<Result {...defaultProps} />)
    expect(screen.getByText('8/10')).toBeInTheDocument()
  })

  it('calls onSubmit when button is clicked', () => {
    const onSubmit = vi.fn()
    render(<Result {...defaultProps} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /enviar resultado/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('disables button while submitting', () => {
    render(<Result {...defaultProps} isSubmitting={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows error message when submitError is set', () => {
    render(<Result {...defaultProps} submitError="Erro de conexão" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Erro de conexão')
  })
})
