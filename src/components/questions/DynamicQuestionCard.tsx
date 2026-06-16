import React, { useState } from 'react';
import { DynamicQuestion } from '../../types';

interface Props {
  question: DynamicQuestion;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
  loading: boolean;
}

const DynamicQuestionCard: React.FC<Props> = ({ question, questionNumber, totalQuestions, onSubmit, loading }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [fillText, setFillText] = useState('');
  const isChoice = question.question_type === 'choice';

  const handleSubmit = () => {
    const answer = isChoice ? selected : fillText.trim();
    if (!answer) return;
    onSubmit(answer);
    setSelected(null);
    setFillText('');
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-2">
          <i className="fas fa-bullseye"></i> 动态消歧题
        </span>
        <span>{questionNumber} / {totalQuestions}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
          {question.sub_dimension}
        </span>
      </div>

      <p className="text-white/90 text-base leading-relaxed">{question.stem}</p>

      {isChoice ? (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                selected === opt.key
                  ? 'border-purple-400 bg-purple-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
              }`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs mr-3">
                {opt.key}
              </span>
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={fillText}
            onChange={(e) => setFillText(e.target.value)}
            placeholder={question.input_hint || '请输入...'}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-colors"
            disabled={loading}
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (isChoice ? !selected : !fillText.trim())}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all
          bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><i className="fas fa-spinner fa-spin mr-2"></i>分析中...</>
        ) : (
          <>提交 <i className="fas fa-arrow-right ml-2"></i></>
        )}
      </button>
    </div>
  );
};

export default DynamicQuestionCard;
