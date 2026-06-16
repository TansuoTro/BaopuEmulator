import React, { useState } from 'react';
import { OpenQuestion } from '../../types';

interface Props {
  question: OpenQuestion;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
  loading: boolean;
}

const OpenQuestionCard: React.FC<Props> = ({ question, questionNumber, totalQuestions, onSubmit, loading }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-2">
          <i className="fas fa-feather"></i> 开放题
        </span>
        <span>{questionNumber} / {totalQuestions}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
          {question.dimension}
        </span>
      </div>

      <p className="text-white/90 text-base leading-relaxed">{question.stem}</p>

      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={question.input_hint || '请自由表达你的想法...'}
          rows={4}
          className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors resize-none"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all
          bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
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

export default OpenQuestionCard;
