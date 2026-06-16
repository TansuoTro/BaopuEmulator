import React, { useState } from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string, confidence: number) => void;
  loading: boolean;
}

const confidenceLabels = ['很不确定', '不太确定', '一般', '比较确定', '非常确定'];

const QuestionCard: React.FC<Props> = ({ question, questionNumber, totalQuestions, onSubmit, loading }) => {
  const [selected, setSelected] = useState<string>('');
  const [fillValue, setFillValue] = useState('');
  const [confidence, setConfidence] = useState(3);

  const handleSubmit = () => {
    const answer = question.question_type === 'choice' ? selected : fillValue.trim();
    if (!answer) return;
    onSubmit(answer, confidence * 20);
  };

  const isChoice = question.question_type === 'choice';
  const canSubmit = isChoice ? selected !== '' : fillValue.trim() !== '';

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-num">
          <i className="fas fa-question-circle"></i> 第 {questionNumber} 题 / 共 {totalQuestions} 题
        </span>
        <span className="question-type-badge">
          {isChoice ? (
            <><i className="fas fa-list-ul"></i> 选择题</>
          ) : (
            <><i className="fas fa-pen"></i> 填空题</>
          )}
        </span>
      </div>

      <div className="question-stem">
        <p>{question.stem}</p>
      </div>

      {isChoice ? (
        <div className="options-list">
          {question.options.map((opt) => (
            <label
              key={opt.key}
              className={`option-item ${selected === opt.key ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`q-${question.question_id}`}
                value={opt.key}
                checked={selected === opt.key}
                onChange={() => setSelected(opt.key)}
                disabled={loading}
              />
              <span className="option-key">{opt.key}</span>
              <span className="option-text">{opt.text}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="fill-input-area">
          <input
            type="text"
            className="fill-input"
            placeholder={question.input_hint || '请输入你的回答...'}
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      <div className="confidence-section">
        <span className="confidence-label">
          <i className="fas fa-bullseye"></i> 你对这个回答的确定程度：
        </span>
        <div className="confidence-slider">
          {confidenceLabels.map((label, i) => (
            <button
              key={i}
              className={`conf-btn ${confidence === i + 1 ? 'active' : ''}`}
              onClick={() => setConfidence(i + 1)}
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-submit"
        disabled={!canSubmit || loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <><i className="fas fa-spinner fa-spin"></i> 分析中...</>
        ) : (
          <><i className="fas fa-arrow-right"></i> 提交回答</>
        )}
      </button>
    </div>
  );
};

export default QuestionCard;
