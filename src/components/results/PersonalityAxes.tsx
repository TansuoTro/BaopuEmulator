import React from 'react';

interface Props {
  axes: { 接受vs怀疑: number; 保守vs激进: number; 经验vs知识: number; 权威vs独立: number };
}

const AXES = [
  { key: '接受vs怀疑' as const, left: '接受', right: '怀疑', leftIcon: 'fa-handshake', rightIcon: 'fa-question' },
  { key: '保守vs激进' as const, left: '保守', right: '激进', leftIcon: 'fa-shield', rightIcon: 'fa-rocket' },
  { key: '经验vs知识' as const, left: '经验', right: '知识', leftIcon: 'fa-hands', rightIcon: 'fa-book-open' },
  { key: '权威vs独立' as const, left: '权威', right: '独立', leftIcon: 'fa-building-columns', rightIcon: 'fa-person-walking' },
];

const PersonalityAxes: React.FC<Props> = ({ axes }) => {
  return (
    <div className="space-y-3">
      {AXES.map(({ key, left, right, leftIcon, rightIcon }) => {
        const val = axes[key] ?? 50;
        const leftPct = 100 - val;
        const rightPct = val;
        const isRight = val >= 50;
        const intensity = Math.abs(val - 50) / 50; // 0~1
        const color = intensity > 0.6
          ? (isRight ? 'from-rose-500 to-rose-400' : 'from-blue-500 to-blue-400')
          : intensity > 0.2
            ? (isRight ? 'from-amber-500 to-amber-400' : 'from-teal-500 to-teal-400')
            : 'from-white/20 to-white/10';

        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className={`flex items-center gap-1 ${val <= 40 ? 'text-blue-300 font-semibold' : 'text-white/30'}`}>
                <i className={`fas ${leftIcon}`} /> {left}
              </span>
              <span className={`flex items-center gap-1 ${val >= 60 ? 'text-rose-300 font-semibold' : 'text-white/30'}`}>
                {right} <i className={`fas ${rightIcon}`} />
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden flex">
              <div className="h-full rounded-l-full bg-gradient-to-r from-blue-500/60 to-blue-400/40 transition-all duration-700" style={{ width: `${leftPct}%` }} />
              <div className={`h-full ${val >= 50 ? 'rounded-r-full' : 'rounded-r-full'} bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${rightPct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-white/20">
              <span>{leftPct}%</span>
              <span>{rightPct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonalityAxes;
