import React, { useState } from 'react';
import { GaokaoInfo, GaokaoType, PROVINCES, GAOKAO_YEARS, NEW_GAOKAO_SUBJECTS, DEFAULT_GAOKAO } from '../../types';

interface Props {
  onSubmit: (info: GaokaoInfo) => void;
}

const GaokaoForm: React.FC<Props> = ({ onSubmit }) => {
  const [info, setInfo] = useState<GaokaoInfo>({ ...DEFAULT_GAOKAO });

  const update = (k: keyof GaokaoInfo, v: unknown) => setInfo((p) => ({ ...p, [k]: v }));

  const toggleSubject = (name: string) => {
    const exists = info.elective_subjects.find((s) => s.name === name);
    if (exists) {
      update('elective_subjects', info.elective_subjects.filter((s) => s.name !== name));
    } else if (info.elective_subjects.length < 3) {
      update('elective_subjects', [...info.elective_subjects, { name, score: 0 }]);
    }
  };

  const updateElectiveScore = (name: string, score: number) => {
    update('elective_subjects', info.elective_subjects.map((s) =>
      s.name === name ? { ...s, score } : s
    ));
  };

  const toggleProvince = (prov: string) => {
    const idx = info.target_provinces.indexOf(prov);
    if (idx >= 0) {
      update('target_provinces', info.target_provinces.filter((p) => p !== prov));
    } else {
      update('target_provinces', [...info.target_provinces, prov]);
    }
  };

  const canSubmit = info.province && info.total_score > 0 && info.chinese > 0 && info.math > 0 && info.english > 0;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold">高考信息</h2>
        <p className="text-sm text-secondary mt-1">填写你的高考数据，帮助AI更精准地匹配专业</p>
      </div>

      {/* Row 1: Year + Province + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">高考年份</label>
          <select
            value={info.year}
            onChange={(e) => update('year', Number(e.target.value))}
            className="input-native"
          >
            {GAOKAO_YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">生源省份</label>
          <select
            value={info.province}
            onChange={(e) => update('province', e.target.value)}
            className="input-native"
          >
            <option value="">请选择</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">高考类型</label>
          <select
            value={info.gaokao_type}
            onChange={(e) => update('gaokao_type', e.target.value as GaokaoType)}
            className="input-native"
          >
            <option value="新高考">新高考 (3+1+2)</option>
            <option value="旧高考-理综">旧高考-理科综合</option>
            <option value="旧高考-文综">旧高考-文科综合</option>
          </select>
        </div>
      </div>

      {/* Row 2: Total + Rank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">总分</label>
          <input
            type="number"
            min={0}
            max={750}
            value={info.total_score || ''}
            onChange={(e) => update('total_score', Number(e.target.value))}
            placeholder="0~750"
            className="input-native"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">省内排名（大致）</label>
          <input
            type="number"
            min={0}
            value={info.provincial_rank || ''}
            onChange={(e) => update('provincial_rank', Number(e.target.value))}
            placeholder="选填"
            className="input-native"
          />
        </div>
      </div>

      {/* Row 3: Core subjects */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">语文</label>
          <input type="number" min={0} max={150} value={info.chinese || ''} onChange={(e) => update('chinese', Number(e.target.value))} placeholder="0~150" className="input-native" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">数学</label>
          <input type="number" min={0} max={150} value={info.math || ''} onChange={(e) => update('math', Number(e.target.value))} placeholder="0~150" className="input-native" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">英语</label>
          <input type="number" min={0} max={150} value={info.english || ''} onChange={(e) => update('english', Number(e.target.value))} placeholder="0~150" className="input-native" />
        </div>
      </div>

      {/* Composite / Elective */}
      {info.gaokao_type === '新高考' ? (
        <div>
          <label className="text-xs font-semibold text-secondary mb-2 block">选考科目（最多3门，点击选择）</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {NEW_GAOKAO_SUBJECTS.map((sub) => {
              const selected = info.elective_subjects.find((s) => s.name === sub);
              return (
                <button
                  key={sub}
                  onClick={() => toggleSubject(sub)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                      : 'border border-white/10 text-secondary hover:border-white/30'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
          {info.elective_subjects.map((sub) => (
            <div key={sub.name} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-secondary w-10">{sub.name}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={sub.score || ''}
                onChange={(e) => updateElectiveScore(sub.name, Number(e.target.value))}
                placeholder="分数"
                className="input-native flex-1 text-sm py-2"
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-secondary mb-1 block">
            {info.gaokao_type === '旧高考-理综' ? '理科综合' : '文科综合'}
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={info.composite_score || ''}
            onChange={(e) => update('composite_score', Number(e.target.value))}
            placeholder="0~300"
            className="input-native"
          />
        </div>
      )}

      {/* Target provinces */}
      <div>
        <label className="text-xs font-semibold text-secondary mb-2 block">意向省份（可多选）</label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {PROVINCES.filter((p) => p.length <= 3).map((prov) => {
            const active = info.target_provinces.includes(prov);
            return (
              <button
                key={prov}
                onClick={() => toggleProvince(prov)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  active
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                    : 'border border-white/10 text-secondary hover:border-white/30'
                }`}
              >
                {prov}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onSubmit(info)}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <i className="fas fa-arrow-right"></i> 开始测评
      </button>
    </div>
  );
};

export default GaokaoForm;
