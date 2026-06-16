import React, { useState } from 'react';
import { FixedQuestion } from '../../types';

interface Props {
  question: FixedQuestion;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
}

const FixedQuestionCard: React.FC<Props> = ({ question, questionNumber, totalQuestions, onSubmit }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected);
    setSelected(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-2">
          <i className="fas fa-clipboard-list"></i> 固定题
        </span>
        <span>{questionNumber} / {totalQuestions}</span>
      </div>

      <p className="text-white/90 text-base leading-relaxed">{question.stem}</p>

      <div className="space-y-2">
        {question.options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
              selected === opt.key
                ? 'border-indigo-400 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs mr-3">
              {opt.key}
            </span>
            {opt.text}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all
          bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        下一题 <i className="fas fa-arrow-right ml-2"></i>
      </button>
    </div>
  );
};

export default FixedQuestionCard;
