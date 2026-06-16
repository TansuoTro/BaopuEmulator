import React from 'react';
import { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
}

const BARS: { key: keyof UserProfile; label: string; icon: string }[] = [
  { key: 'math', label: '数学', icon: 'fa-calculator' },
  { key: 'spatial', label: '空间', icon: 'fa-cube' },
  { key: 'language', label: '语言', icon: 'fa-pen-to-square' },
  { key: 'logic', label: '逻辑', icon: 'fa-brain' },
  { key: 'programming', label: '编程', icon: 'fa-code' },
  { key: 'practice', label: '动手', icon: 'fa-wrench' },
  { key: 'social', label: '社交', icon: 'fa-users' },
  { key: 'emotion_stability', label: '情绪', icon: 'fa-heart-pulse' },
  { key: 'pressure_tolerance', label: '抗压', icon: 'fa-shield-halved' },
  { key: 'long_term', label: '长期', icon: 'fa-hourglass-half' },
  { key: 'creativity', label: '创造', icon: 'fa-lightbulb' },
  { key: 'critical_thinking', label: '批判', icon: 'fa-scale-balanced' },
  { key: 'teamwork', label: '协作', icon: 'fa-people-group' },
  { key: 'complexity_interest', label: '复杂', icon: 'fa-circle-nodes' },
  { key: 'rule_compliance', label: '规则', icon: 'fa-gavel' },
  { key: 'decision_confidence', label: '果断', icon: 'fa-bolt' },
];

function barColor(v: number): string {
  if (v >= 75) return '#10b981';
  if (v >= 55) return '#6366f1';
  if (v >= 35) return '#f59e0b';
  return '#ef4444';
}

const AbilityBars: React.FC<Props> = ({ profile }) => {
  const sorted = [...BARS].sort((a, b) => (profile[b.key] ?? 50) - (profile[a.key] ?? 50));

  return (
    <div className="space-y-1.5">
      {sorted.map((b) => {
        const val = profile[b.key] ?? 50;
        return (
          <div key={b.key} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-right text-secondary flex items-center justify-end gap-1.5">
              <i className={`fas ${b.icon} w-3 text-center`}></i>
              {b.label}
            </span>
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${val}%`, backgroundColor: barColor(val) }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-secondary font-mono">{val}</span>
          </div>
        );
      })}
    </div>
  );
};

export default AbilityBars;
