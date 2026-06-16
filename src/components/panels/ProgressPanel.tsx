import React from 'react';
import { Phase } from '../../types';

interface Props {
  phase: Phase;
  currentQuestion: number;
  totalQuestions: number;
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  fixed: '第一阶段：基础画像',
  dynamic: '第二阶段：深度消歧',
  open: '第三阶段：动机补足',
  recommend: '测评完成',
  error: '出错了',
};

const ProgressPanel: React.FC<Props> = ({ phase, currentQuestion, totalQuestions }) => {
  if (phase === 'idle' || phase === 'recommend' || phase === 'error') return null;

  const pct = totalQuestions > 0 ? Math.round((currentQuestion / totalQuestions) * 100) : 0;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
          <i className="fas fa-bars-progress"></i> {PHASE_LABELS[phase]}
        </h3>
        <span className="text-xs text-white/50">{currentQuestion}/{totalQuestions}</span>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i < currentQuestion
                ? 'bg-indigo-400'
                : i === currentQuestion
                  ? 'bg-white scale-125'
                  : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="flex justify-between text-xs text-white/40">
        <span className={phase === 'fixed' ? 'text-indigo-400 font-semibold' : ''}>· 固定题</span>
        <span className={phase === 'dynamic' ? 'text-indigo-400 font-semibold' : ''}>· 动态题</span>
        <span className={phase === 'open' ? 'text-indigo-400 font-semibold' : ''}>· 开放题</span>
      </div>
    </div>
  );
};

export default ProgressPanel;
