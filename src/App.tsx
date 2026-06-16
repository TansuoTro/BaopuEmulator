import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAssessmentStore } from './store/useAssessmentStore';
import { FIXED_QUESTIONS, OPEN_QUESTIONS } from './data/questions';
import { buildDynamicPrompt, buildScorePrompt, buildOpenTagsPrompt, buildRecommendPrompt, SYSTEM_PROMPT } from './llm/prompts';
import { matchMajors, computeConfidence, detectConflicts } from './engine/scorer';
import { MajorNode, DynamicQuestion, UserProfile, RecommendationResult as RR, GaokaoInfo, PROVINCES, GAOKAO_YEARS } from './types';
import UniverseScene from './components/3d/UniverseScene';
import '@fortawesome/fontawesome-free/css/all.min.css';

const API = 'https://api.deepseek.com/v1/chat/completions';

function cleanJson(raw: string): string {
  let c = raw.trim();
  if (c.startsWith('```json')) c = c.slice(7); else if (c.startsWith('```')) c = c.slice(3);
  if (c.endsWith('```')) c = c.slice(0,-3); c = c.trim();
  for (const ch of ['{','[']) { const a=c.indexOf(ch), b=c.lastIndexOf(ch==='{'?'}':']'); if(a!==-1&&b!==-1&&b>a){c=c.slice(a,b+1);break;} }
  return c;
}
async function ds(apiKey: string, prompt: string): Promise<unknown> {
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`}, body:JSON.stringify({model:'deepseek-chat',messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:prompt}],temperature:0.7,max_tokens:4096,response_format:{type:'json_object'}}) });
  if(!res.ok){const t=await res.text();throw new Error(`API ${res.status}: ${t.slice(0,200)}`);}
  const d=await res.json();const raw=d.choices?.[0]?.message?.content;if(!raw)throw new Error('Empty');
  return JSON.parse(cleanJson(raw));
}

/* ── Extracted GaokaoForm component (no hooks-in-conditionals) ── */
const GaokaoSection: React.FC<{ onSubmit: (info: GaokaoInfo) => void }> = ({ onSubmit }) => {
  const [g, setG] = useState<GaokaoInfo>({ year:2025,province:'',total_score:0,provincial_rank:0,gaokao_type:'新高考',chinese:0,math:0,english:0,composite_score:0,elective_subjects:[],target_provinces:[] });
  const u = (k: string, v: unknown) => setG(p => ({ ...p, [k]: v }));
  const can = g.province && g.total_score > 0 && g.chinese > 0 && g.math > 0 && g.english > 0;
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-5 overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
      <h2 className="text-xl font-bold text-center text-white">高考信息</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-white/50 block mb-1">年份</label><select value={g.year} onChange={e => u('year', +e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white">{GAOKAO_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label className="text-xs text-white/50 block mb-1">省份</label><select value={g.province} onChange={e => u('province', e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white"><option value="">选</option>{PROVINCES.slice(0,31).map(p => <option key={p}>{p}</option>)}</select></div>
          <div><label className="text-xs text-white/50 block mb-1">类型</label><select value={g.gaokao_type} onChange={e => u('gaokao_type', e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white"><option value="新高考">新高考</option><option value="旧高考-理综">旧高考-理综</option><option value="旧高考-文综">旧高考-文综</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-white/50 block mb-1">总分</label><input type="number" value={g.total_score || ''} onChange={e => u('total_score', +e.target.value)} placeholder="0~750" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
          <div><label className="text-xs text-white/50 block mb-1">排名(可选)</label><input type="number" value={g.provincial_rank || ''} onChange={e => u('provincial_rank', +e.target.value)} placeholder="选填" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-white/50 block mb-1">语文</label><input type="number" value={g.chinese || ''} onChange={e => u('chinese', +e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
          <div><label className="text-xs text-white/50 block mb-1">数学</label><input type="number" value={g.math || ''} onChange={e => u('math', +e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
          <div><label className="text-xs text-white/50 block mb-1">英语</label><input type="number" value={g.english || ''} onChange={e => u('english', +e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
        </div>
        <button onClick={() => onSubmit(g)} disabled={!can} className="w-full py-3.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-30 transition-all">开始测评</button>
      </div>
    </div>
  );
};

/* ── Bar chart helpers ── */
const Bar: React.FC<{ label: string; val: number; icon: string }> = ({ label, val, icon }) => {
  const c = val >= 75 ? 'bg-emerald-400' : val >= 55 ? 'bg-blue-400' : val >= 35 ? 'bg-amber-400' : 'bg-red-400';
  return <div className="flex items-center gap-2 text-xs"><span className="w-14 text-right text-white/50 flex items-center justify-end gap-1"><i className={`fas ${icon} w-3`} />{label}</span><div className="flex-1 h-2 bg-white/10 rounded-full"><div className={`h-full rounded-full ${c}`} style={{ width: `${val}%` }} /></div><span className="w-7 text-right tabular-nums text-white/40">{val}</span></div>;
};
const ProfileBars: React.FC<{ p: UserProfile }> = ({ p }) => {
  const pf = p as unknown as Record<string, number>;
  const dims = [{ k: 'math', l: '数学', i: 'fa-calculator' }, { k: 'spatial', l: '空间', i: 'fa-cube' }, { k: 'language', l: '语言', i: 'fa-pen' }, { k: 'logic', l: '逻辑', i: 'fa-brain' }, { k: 'programming', l: '编程', i: 'fa-code' }, { k: 'practice', l: '动手', i: 'fa-wrench' }, { k: 'social', l: '社交', i: 'fa-users' }, { k: 'emotion_stability', l: '情绪', i: 'fa-heart' }, { k: 'pressure_tolerance', l: '抗压', i: 'fa-shield' }, { k: 'long_term_persistence', l: '坚持', i: 'fa-hourglass' }];
  return <div className="space-y-1.5">{dims.map(b => <Bar key={b.k} label={b.l} val={pf[b.k] ?? 50} icon={b.i} />)}</div>;
};

/* ── App ── */
const App: React.FC = () => {
  const store = useAssessmentStore();
  const [apiInput, setApiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<MajorNode | null>(null);
  const loadingRef = useRef(false);
  const { phase, theme, profile } = store;
  const isDark = theme === 'dark';

  const handleGaokaoSubmit = useCallback((info: GaokaoInfo) => { store.setGaokaoInfo(info); }, [store]);
  const handleFixedAnswer = useCallback((a: string) => { store.answerFixed(a); }, [store]);

  /* Dynamic phase */
  useEffect(() => {
    if (phase !== 'dynamic' || store.dynamicQuestions.length > 0 || loadingRef.current) return;
    loadingRef.current = true; setLoading(true);
    const hist = FIXED_QUESTIONS.map(q => q.primary_dim);
    ds(store.apiKey, buildDynamicPrompt(profile, detectConflicts(profile), hist as unknown as string[]))
      .then(raw => {
        const d = raw as Record<string, unknown>; let qs: DynamicQuestion[] = [];
        if (d.questions && Array.isArray(d.questions)) qs = (d.questions as Record<string, unknown>[]).filter(x => x && 'stem' in x) as unknown as DynamicQuestion[];
        else if (Array.isArray(d)) qs = (d as unknown[]).filter(x => x && typeof x === 'object' && 'stem' in x) as unknown as DynamicQuestion[];
        if (qs.length === 0) qs = FIXED_QUESTIONS.slice(0, 5).map((f, i) => ({ id: `D${i + 1}`, question_type: 'choice' as const, target_discrimination: [f.primary_dim], stem: `再确认：${f.stem}`, options: f.options.map(o => ({ key: o.key, text: o.text })), input_hint: '', expected_signal: `确认${f.primary_dim}` }));
        store.setDynamicQuestions(qs.slice(0, 5));
      }).catch(e => { console.warn('Dynamic failed:', e); store.setDynamicQuestions(FIXED_QUESTIONS.slice(0, 5).map((f, i) => ({ id: `D${i + 1}`, question_type: 'choice' as const, target_discrimination: [f.primary_dim], stem: `再确认：${f.stem}`, options: f.options.map(o => ({ key: o.key, text: o.text })), input_hint: '', expected_signal: `确认${f.primary_dim}` }))); })
      .finally(() => { setLoading(false); loadingRef.current = false; });
  }, [phase, store.dynamicQuestions.length, store.apiKey, profile, store]);

  const handleDynamicAnswer = useCallback(async (a: string) => {
    const q = store.dynamicQuestions[store.dynamicIndex]; if (!q) return; setLoading(true);
    try {
      const r = await ds(store.apiKey, buildScorePrompt(profile, q.stem, a, q.target_discrimination));
      const d = r as { updated_profile?: Record<string, number> };
      if (d.updated_profile) { const p = { ...profile }; for (const k of Object.keys(d.updated_profile)) { const key = k as keyof UserProfile; if (key in p) (p as Record<string, number>)[k] = Math.min(100, Math.max(0, d.updated_profile[k] ?? 50)); } useAssessmentStore.setState({ profile: p }); }
      else { const delta = a === q.options[q.options.length - 1]?.key ? 8 : -4; store.updateProfileDynamic(q.target_discrimination[0] as keyof UserProfile, delta); }
      store.answerDynamic(a);
    } catch (e) { store.addError((e as Error).message); } finally { setLoading(false); }
  }, [store, profile, store.apiKey]);

  const handleOpenAnswer = useCallback(async (a: string) => {
    const q = OPEN_QUESTIONS[store.openIndex]; if (!q) return; setLoading(true);
    try { const r = await ds(store.apiKey, buildOpenTagsPrompt(q.stem, a)); store.applyOpenResult(r as { tags?: string[] }); store.answerOpen(a); }
    catch { store.answerOpen(a); } finally { setLoading(false); }
  }, [store, store.apiKey]);

  /* Recommend phase */
  useEffect(() => {
    if (phase !== 'recommend' || store.recommendation || loadingRef.current) return;
    loadingRef.current = true; setLoading(true);
    const matched = matchMajors(profile);
    const confl = detectConflicts(profile);
    const conf = computeConfidence(store.fixedIndex, store.dynamicIndex, profile, confl, null);
    const prompt = buildRecommendPrompt(profile, matched.slice(0, 10).map(m => ({ name: m.major.name, code: m.major.code, category: m.major.category, cosine_score: m.cosine_score, tags: m.major.tags })), confl, conf, store.openAnswers, store.gaokaoInfo);
    ds(store.apiKey, prompt).then(raw => { const d = raw as RR; store.finalizeRecommendation(d); }).catch(e => { console.warn('Recommend failed:', e); store.finalizeRecommendation({ final_note: '基于代码侧匹配结果（LLM推荐生成失败）' }); }).finally(() => { setLoading(false); loadingRef.current = false; });
  }, [phase, store.recommendation, store.apiKey, profile, store]);

  const handleStart = () => { if (!apiInput.trim()) return; store.setApiKey(apiInput.trim()); store.startAssessment(); };
  const handleRestart = () => { store.reset(); setSelectedMajor(null); loadingRef.current = false; };
  const curDynamic = store.dynamicQuestions[store.dynamicIndex] || null;
  const inAssess = phase === 'fixed' || phase === 'dynamic' || phase === 'open';
  const totalQ = phase === 'fixed' ? 18 : phase === 'dynamic' ? store.dynamicQuestions.length || 5 : phase === 'open' ? 3 : 0;
  const curQ = phase === 'fixed' ? store.fixedIndex : phase === 'dynamic' ? store.dynamicIndex : phase === 'open' ? store.openIndex : 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#080816] text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Header */}
      <header className={`border-b px-4 py-3 flex items-center justify-between backdrop-blur-md ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center gap-3"><i className="fas fa-graduation-cap text-indigo-400 text-xl" /> <span className="font-bold">抱朴 · BaopuEmulator V3</span></div>
        <div className="flex items-center gap-3">
          {inAssess && <span className="text-xs text-white/40">{phase === 'fixed' ? '固定' : phase === 'dynamic' ? '消歧' : '开放'} {curQ + 1}/{totalQ}</span>}
          <button onClick={store.toggleTheme} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-zinc-100 text-zinc-500'}`}><i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} /></button>
        </div>
      </header>

      {/* Idle */}
      {phase === 'idle' && (
        <div className="max-w-md mx-auto px-4 pt-16 sm:pt-20 pb-10 text-center">
          <div className="text-5xl mb-4">🌌</div><h1 className="text-3xl font-extrabold tracking-widest">抱朴V3</h1>
          <p className="text-white/40 mt-2">AI本科专业宇宙</p>
          <p className="text-white/30 text-sm mt-4 leading-relaxed">高考数据→18题画像→5题消歧→3题动机→专业宇宙</p>
          <div className="mt-8 space-y-4 text-left">
            <label className="block text-sm text-white/60 flex items-center gap-2"><i className="fas fa-key text-indigo-400" /> DeepSeek API Key</label>
            <input type="password" value={apiInput} onChange={e => setApiInput(e.target.value)} placeholder="sk-..." className={`w-full px-4 py-3 rounded-lg font-mono text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-white/20' : 'bg-zinc-100 border border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
            <button onClick={handleStart} disabled={!apiInput.trim()} className="w-full py-3.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-30 transition-all">🌌 进入专业宇宙</button>
          </div>
        </div>
      )}

      {/* Gaokao */}
      {phase === 'gaokao' && <GaokaoSection onSubmit={handleGaokaoSubmit} />}

      {/* Assessment */}
      {inAssess && (
        <div className={`assessment-shell ${isDark ? '' : 'assessment-shell-light'}`}>
          <div className="hidden lg:block left-col">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-100/80 border-zinc-200'}`}>
              <h3 className="text-xs font-bold mb-3">{phase === 'fixed' ? '阶段一：基础画像' : phase === 'dynamic' ? '阶段二：深度消歧' : '阶段三：动机补足'}</h3>
              <div className="h-1.5 bg-white/10 rounded-full mb-3"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalQ ? Math.round(curQ / totalQ * 100) : 0}%` }} /></div>
              <div className="text-xs text-white/30">{curQ}/{totalQ} 题</div>
            </div>
          </div>
          <div className="center-col">
            <div className="lg:hidden p-3 rounded-xl border text-xs text-white/40 bg-white/5 border-white/10">{phase === 'fixed' ? '基础画像' : phase === 'dynamic' ? '深度消歧' : '动机补足'} {curQ + 1}/{totalQ}</div>
            <div className="scene-box"><UniverseScene majors={store.matchedMajors} onMajorClick={setSelectedMajor} /></div>
            <div className="question-area">
              {phase === 'fixed' && FIXED_QUESTIONS[store.fixedIndex] && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
                  <div className="text-xs text-white/40">{store.fixedIndex + 1}/18</div>
                  <p className="text-white/90">{FIXED_QUESTIONS[store.fixedIndex].stem}</p>
                  <div className="space-y-2">{FIXED_QUESTIONS[store.fixedIndex].options.map(o => <button key={o.key} onClick={() => handleFixedAnswer(o.key)} className="w-full text-left px-4 py-3 rounded-lg border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/10 text-white/70 text-sm transition-all"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs mr-3">{o.key}</span>{o.text}</button>)}</div>
                </div>
              )}
              {phase === 'dynamic' && curDynamic && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-purple-500/20' : 'bg-white border-purple-200 shadow-sm'}`}>
                  <div className="flex items-center gap-2 text-xs"><span className="text-purple-400">消歧 {store.dynamicIndex + 1}/{store.dynamicQuestions.length}</span></div>
                  <p className="text-white/90">{curDynamic.stem}</p>
                  {curDynamic.question_type === 'choice' ? <div className="space-y-2">{curDynamic.options.map(o => <button key={o.key} onClick={() => handleDynamicAnswer(o.key)} disabled={loading} className="w-full text-left px-4 py-3 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-purple-500/10 text-white/70 text-sm transition-all disabled:opacity-50"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs mr-3">{o.key}</span>{o.text}</button>)}</div> : <div><input type="text" onKeyDown={e => { if (e.key === 'Enter') handleDynamicAnswer((e.target as HTMLInputElement).value); }} placeholder={curDynamic.input_hint || '输入回答...'} className="w-full p-3 rounded bg-white/5 border border-white/10 text-white text-sm" /></div>}
                </div>
              )}
              {phase === 'open' && OPEN_QUESTIONS[store.openIndex] && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-emerald-500/20' : 'bg-white border-emerald-200 shadow-sm'}`}>
                  <div className="text-xs text-emerald-400">{OPEN_QUESTIONS[store.openIndex].category} · {store.openIndex + 1}/3</div>
                  <p className="text-white/90">{OPEN_QUESTIONS[store.openIndex].stem}</p>
                  <textarea id="open-input" rows={3} placeholder={OPEN_QUESTIONS[store.openIndex].input_hint || '自由回答...'} className="w-full p-3 rounded bg-white/5 border border-white/10 text-white text-sm resize-none" />
                  <button onClick={() => { const el = document.getElementById('open-input') as HTMLTextAreaElement; if (el?.value.trim()) handleOpenAnswer(el.value.trim()); }} disabled={loading} className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-30 transition-all">提交</button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden lg:block right-col">
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-100/80 border-zinc-200'}`}>
              <h3 className="text-xs font-bold text-white/60 flex items-center gap-2"><i className="fas fa-chart-simple" /> 即时画像</h3>
              <ProfileBars p={profile} />
            </div>
            {selectedMajor && <div className={`mt-3 p-3 rounded-lg border text-xs space-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}><div className="font-semibold text-white/80">{selectedMajor.name}</div><div className="text-white/40">{selectedMajor.category} · {selectedMajor.critical_type}</div><div className="flex flex-wrap gap-1">{selectedMajor.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[10px]">{t}</span>)}</div></div>}
          </div>
        </div>
      )}

      {/* Recommend */}
      {phase === 'recommend' && store.recommendation && (
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="max-w-5xl mx-auto p-3 sm:p-4 pb-20 space-y-4">
            <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 rounded-xl p-5 text-center"><h2 className="text-xl font-bold text-white">测评完成</h2><div className="mt-2"><span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${store.recommendation.confidence_breakdown.total >= 70 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>置信度 {store.recommendation.confidence_breakdown.total}%</span></div></div>

            {/* 3D Universe */}
            <div className="scene-box" style={{ height: '320px' }}>
              <UniverseScene majors={store.matchedMajors} onMajorClick={setSelectedMajor} />
            </div>
            <p className="text-xs text-white/30 text-center -mt-2">拖拽旋转 · 滚轮缩放 · 点击球体查看专业详情 · 距离越近匹配度越高</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}><h3 className="text-sm font-bold mb-3"><i className="fas fa-chart-bar text-indigo-400 mr-2" />能力画像</h3><ProfileBars p={profile} /></div>
              <div className={`p-4 rounded-xl border overflow-y-auto max-h-96 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <h3 className="text-sm font-bold mb-3"><i className="fas fa-trophy text-amber-400 mr-2" />Top 5 推荐专业</h3>
                <div className="space-y-3">{store.recommendation.top_majors.map((m, i) => <div key={m.major.id} onClick={() => setSelectedMajor(m.major)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedMajor?.id === m.major.id ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-white/10 hover:border-white/30'}`}><div className="flex justify-between items-center"><span className="text-white font-semibold text-sm">{i + 1}. {m.major.name}</span><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{m.final_score}分</span></div><div className="h-1 bg-white/10 rounded-full mt-2"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${m.final_score}%` }} /></div><div className="mt-2 text-xs text-white/40">{m.major.tags.join(' · ')}</div></div>)}</div>
              </div>
            </div>
            {store.recommendation.conflicts.length > 0 && <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4"><h3 className="text-sm font-bold text-amber-300 mb-2">冲突点</h3>{store.recommendation.conflicts.map((c, i) => <div key={i} className="text-xs text-white/50 mb-1"><span className="text-amber-400">{c.type}</span>：{c.explanation}</div>)}</div>}
            <div className={`p-4 rounded-xl border flex gap-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}><i className="fas fa-comment-dots text-indigo-400" /> <p className="text-white/60 text-sm">{store.recommendation.final_note || '综合能力画像和专业匹配度，以上推荐供参考。'}</p></div>
            <button onClick={handleRestart} className="w-full py-3 rounded-lg border border-white/20 text-white/60 hover:bg-white/10 transition-all text-sm">重新测评</button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {phase === 'error' && store.errors.length > 0 && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 rounded-xl p-4 max-w-md">{store.errors.map((e, i) => <p key={i} className="text-red-200 text-sm">{e}</p>)}<button onClick={store.clearErrors} className="mt-2 text-xs text-red-400">关闭</button></div>}

      {/* Loading overlay */}
      {loading && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center"><div className="flex items-center gap-3 text-white/70"><i className="fas fa-spinner fa-spin text-2xl text-indigo-400" />AI分析中...</div></div>}
    </div>
  );
};

export default App;
