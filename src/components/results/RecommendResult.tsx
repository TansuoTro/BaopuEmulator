import React from 'react';
import { RecommendResult as RR, Major } from '../../types';

interface Props {
  result: RR;
  onRestart: () => void;
  selectedMajor: Major | null;
  onSelectMajor: (m: Major) => void;
}

const RecommendResult: React.FC<Props> = ({ result, onRestart, selectedMajor, onSelectMajor }) => {
  const sorted = [...result.top_majors].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-md border border-white/10 rounded-xl p-5 text-center">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <i className="fas fa-clipboard-check text-emerald-400"></i> 测评完成
        </h2>
        <div className="mt-3 inline-flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-2 ${
            result.summary.confidence >= 70 ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300' : 'border-amber-400/60 bg-amber-500/20 text-amber-300'
          }`}>
            {result.summary.confidence}%
          </div>
          <span className="text-white/60 text-sm">综合置信度</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {result.summary.profile_keywords.map((kw, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">{kw}</span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
          <i className="fas fa-trophy text-amber-400"></i> Top {sorted.length} 推荐专业
          <span className="text-xs text-white/40 font-normal">（按匹配度从高到低排序）</span>
        </h3>
        <div className="space-y-3">
          {sorted.map((m, i) => (
            <div
              key={m.major_name}
              className={`bg-white/5 backdrop-blur-md border rounded-xl p-4 cursor-pointer transition-all ${
                selectedMajor?.major_name === m.major_name
                  ? 'border-indigo-400 ring-1 ring-indigo-400'
                  : 'border-white/10 hover:border-white/30'
              }`}
              onClick={() => onSelectMajor({ major_name: m.major_name } as Major)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-white/30'}`}>
                    <i className={`fas ${i === 0 ? 'fa-crown' : 'fa-medal'}`}></i>
                  </span>
                  <span className="text-white font-semibold">{m.major_name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  m.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                  m.score >= 60 ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {m.score} 分
                </span>
              </div>

              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${
                    m.score >= 80 ? 'bg-emerald-400' : m.score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${m.score}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-emerald-400/80 font-semibold flex items-center gap-1">
                    <i className="fas fa-check-circle"></i> 匹配理由
                  </span>
                  <ul className="mt-1 space-y-0.5 text-white/50">
                    {m.match_reason.slice(0, 3).map((r, j) => <li key={j}>· {r}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-amber-400/80 font-semibold flex items-center gap-1">
                    <i className="fas fa-exclamation-triangle"></i> 风险
                  </span>
                  <ul className="mt-1 space-y-0.5 text-white/40">
                    {m.risk.slice(0, 3).map((r, j) => <li key={j}>· {r}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.conflicts.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-300/80 mb-2 flex items-center gap-2">
            <i className="fas fa-scale-balanced"></i> 画像冲突点
          </h3>
          {result.conflicts.map((c, i) => (
            <div key={i} className="text-xs text-white/50 mb-1.5">
              <span className="text-amber-400/80 font-semibold">{c.dimension}:</span> {c.impact}
              <span className="block text-indigo-400/70 mt-0.5"><i className="fas fa-lightbulb mr-1"></i>{c.suggestion}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
        <i className="fas fa-comment-dots text-indigo-400 mt-0.5"></i>
        <p className="text-white/60 text-sm">{result.final_note}</p>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-3 rounded-lg font-semibold text-sm border border-white/20 text-white/70 hover:bg-white/10 transition-all"
      >
        <i className="fas fa-rotate-right mr-2"></i> 重新测评
      </button>
    </div>
  );
};

export default RecommendResult;
