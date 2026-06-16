import React from 'react';
import { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
}

const BARS: { key: keyof UserProfile; label: string; icon: string }[] = [
  { key: 'math', label: '数学能力', icon: 'fa-calculator' },
  { key: 'spatial', label: '空间想象', icon: 'fa-cube' },
  { key: 'language', label: '语言表达', icon: 'fa-pen-to-square' },
  { key: 'logic', label: '逻辑分析', icon: 'fa-brain' },
  { key: 'social', label: '社交偏好', icon: 'fa-users' },
  { key: 'emotion_stability', label: '情绪稳定', icon: 'fa-heart-pulse' },
  { key: 'pressure_tolerance', label: '抗压能力', icon: 'fa-shield-halved' },
  { key: 'long_term', label: '长期投入', icon: 'fa-hourglass-half' },
];

const ProfilePanel: React.FC<Props> = ({ profile }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
        <i className="fas fa-chart-simple"></i> 即时画像
      </h3>
      {BARS.map((bar) => {
        const val = profile[bar.key] ?? 50;
        const color = val >= 70 ? 'bg-emerald-400' : val >= 50 ? 'bg-blue-400' : val >= 30 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div key={bar.key} className="space-y-1">
            <div className="flex justify-between text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <i className={`fas ${bar.icon}`}></i> {bar.label}
              </span>
              <span className="tabular-nums">{val}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfilePanel;
