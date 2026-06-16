import React from 'react';
import { useAssessment } from './hooks/useAssessment';
import StartScreen from './components/StartScreen';
import QuestionCard from './components/QuestionCard';
import ResultCard from './components/ResultCard';
import ProgressBar from './components/ProgressBar';

const TOTAL_QUESTIONS = 12;

const App: React.FC = () => {
  const { state, startAssessment, submitAnswer, reset, clearErrors } = useAssessment();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <i className="fas fa-graduation-cap"></i>
          <span>抱朴 · BaopuEmulator</span>
        </div>
      </header>

      <main className="app-main">
        {state.stage === 'idle' && (
          <StartScreen onStart={startAssessment} loading={false} />
        )}

        {(state.stage === 'asking' || state.stage === 'error') && state.currentQuestion && (
          <div className="assessment-flow">
            <ProgressBar
              current={state.questionCount}
              total={TOTAL_QUESTIONS}
              stageLabel={`测评中 (${state.askedQuestions.length + 1}/${TOTAL_QUESTIONS})`}
            />
            <QuestionCard
              question={state.currentQuestion}
              questionNumber={state.questionCount}
              totalQuestions={TOTAL_QUESTIONS}
              onSubmit={submitAnswer}
              loading={false}
            />
          </div>
        )}

        {state.stage === 'error' && state.errors.length > 0 && (
          <div className="error-toast">
            <i className="fas fa-circle-exclamation"></i>
            <div>
              {state.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
            <button onClick={clearErrors}>
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        )}

        {state.stage === 'recommend' && state.recommendResult && (
          <ResultCard result={state.recommendResult} onRestart={reset} />
        )}
      </main>

      <footer className="app-footer">
        <p>基于 DeepSeek LLM 的动态测评引擎 — 仅用于中国本科专业匹配参考</p>
      </footer>
    </div>
  );
};

export default App;
