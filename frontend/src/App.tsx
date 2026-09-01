import { useQuiz } from './hooks/useQuiz'
import { QuizStart } from './components/QuizStart'
import { Question } from './components/Question'
import { ProgressBar } from './components/ProgressBar'
import { Result } from './components/Result'
import { ScoreDisplay, Submitted } from './components/ScoreDisplay'
import { questions } from './data/questions'

export default function App() {
  const { state, startQuiz, answerQuestion, submitResult } = useQuiz()

  if (state.stage === 'start') {
    return <QuizStart onStart={startQuiz} />
  }

  if (state.stage === 'submitted') {
    return <Submitted studentEmail={state.student.email} />
  }

  if (state.stage === 'quiz') {
    const currentQ = questions[state.currentQuestion]
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 bg-white shadow-sm p-4 z-10">
          <div className="max-w-xl mx-auto">
            <ProgressBar current={state.currentQuestion} total={questions.length} />
          </div>
        </div>
        <div className="pt-20">
          <Question
            question={currentQ}
            questionNumber={state.currentQuestion + 1}
            totalQuestions={questions.length}
            selectedAnswer={state.answers[state.currentQuestion]}
            onAnswer={(answerIndex) => {
              answerQuestion(state.currentQuestion, answerIndex)
            }}
          />
        </div>
      </div>
    )
  }

  if (state.stage === 'result' || state.stage === 'error') {
    return (
      <div>
        <Result
          studentName={state.student.name}
          score={state.score}
          total={questions.length}
          isSubmitting={state.isSubmitting}
          submitError={state.submitError}
          onSubmit={submitResult}
        />
        <div className="max-w-xl mx-auto px-4 pb-8">
          <ScoreDisplay
            questions={questions}
            answers={state.answers}
            score={state.score}
          />
        </div>
      </div>
    )
  }

  return null
}
