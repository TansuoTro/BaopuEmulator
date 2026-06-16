import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAssessmentStore } from './store/useAssessmentStore';
import { FIXED_QUESTIONS, OPEN_QUESTIONS } from './data/questions';
import { MAJORS } from './data/majors';
import { matchMajors, computeConfidence, applyDynamicScore, computeAllFixedScores } from './engine/scorer';
import {
  getDynamicQuestions,
  scoreDynamicAnswer,
  extractOpenTags,
  getRecommendResult,
} from './api/deepseek';
import {
  buildDynamicPrompt,
  buildScorePrompt,
  buildOpenTagsPrompt,
  buildRecommendPrompt,
} from './prompts/systemPrompts';
import { Major, DynamicQuestion, RecommendResult as RR } from './types';

import MajorUniverse from './components/scene/MajorUniverse';
import ProfilePanel from './components/panels/ProfilePanel';
import ProgressPanel from './components/panels/ProgressPanel';
import FixedQuestionCard from './components/questions/FixedQuestionCard';
import DynamicQuestionCard from './components/questions/DynamicQuestionCard';
import OpenQuestionCard from './components/questions/OpenQuestionCard';
import GaokaoForm from './components/questions/GaokaoForm';
import RecommendDashboard from './components/results/RecommendDashboard';
import '@fortawesome/fontawesome-free/css/all.min.css';

const App: React.FC = () => {
  const store = useAssessmentStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const loadingRef = useRef(false);

  const apiKey = store.apiKey;
  const theme = store.theme;
  const isDark = theme === 'dark';

  // ── Fixed answer ──
  const handleFixedAnswer = useCallback((answer: string) => {
    store.answerFixed(answer);
  }, [store]);

  // ── Gaokao submit ──
  const handleGaokaoSubmit = useCallback((info: typeof store.gaokaoInfo) => {
    store.setGaokaoInfo(info);
  }, [store]);

  // ── Dynamic phase: fetch questions ──
  useEffect(() => {
    if (store.phase !== 'dynamic' || store.dynamicQuestions.length > 0 || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const history = FIXED_QUESTIONS.map((q) => q.dimension);
    const prompt = buildDynamicPrompt(store.profile, [], history);

    const fallback: DynamicQuestion[] = FIXED_QUESTIONS.slice(0, 5).map((fq, i) => ({
      id: `D${i + 1}`,
      dimension: 'ability',
      sub_dimension: fq.sub_dimensions[0]?.key || 'logic',
      question_type: 'choice' as const,
      stem: `再确认一次：${fq.stem}`,
      options: fq.options.map((o) => ({ key: o.key, text: o.text })),
      input_hint: '',
      expected_signal: `确认${fq.dimension}倾向`,
    }));

    getDynamicQuestions(apiKey, prompt)
      .then((raw) => {
        const data = raw as Record<string, unknown>;
        let questions: DynamicQuestion[] = [];
        if (Array.isArray(data)) {
          questions = data.filter((d) => d && typeof d === 'object' && 'stem' in d) as unknown as DynamicQuestion[];
        } else if (data.questions && Array.isArray(data.questions)) {
          questions = (data.questions as Record<string, unknown>[]).filter((d) => d && 'stem' in d) as unknown as DynamicQuestion[];
        } else if (data.type === 'question' && data.stem) {
          questions = [data as unknown as DynamicQuestion];
        }
        if (questions.length === 0) {
          console.warn('LLM返回格式异常，使用备用题目');
          questions = fallback;
        }
        store.setDynamicQuestions(questions.slice(0, 5));
      })
      .catch((err) => {
        console.warn('动态题请求失败，使用备用题目:', err);
        store.setDynamicQuestions(fallback);
      })
      .finally(() => {
        setLoading(false);
        loadingRef.current = false;
      });
  }, [store.phase, store.dynamicQuestions.length, apiKey, store]);

  // ── Dynamic answer ──
  const handleDynamicAnswer = useCallback(async (answer: string) => {
    const q = store.dynamicQuestions[store.dynamicIndex];
    if (!q) return;
    setLoading(true);
    try {
      const sp = buildScorePrompt(store.profile, q.stem, answer, q.sub_dimension);
      const raw = await scoreDynamicAnswer(apiKey, sp);
      const data = raw as { type: string; updated_profile?: Record<string, number> };
      if (data.type === 'score' && data.updated_profile) {
        const profile = { ...store.profile, ...data.updated_profile } as typeof store.profile;
        useAssessmentStore.setState({ profile });
      } else {
        const delta = answer === q.options[q.options.length - 1]?.key ? 10 : -5;
        const profile = applyDynamicScore(store.profile, q.sub_dimension, delta);
        useAssessmentStore.setState({ profile });
      }
      store.answerDynamic(answer);
    } catch (err) {
      store.addError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [store, apiKey]);

  // ── Open answer ──
  const handleOpenAnswer = useCallback(async (answer: string) => {
    const q = OPEN_QUESTIONS[store.openIndex];
    if (!q) return;
    setLoading(true);
    try {
      const tp = buildOpenTagsPrompt(q.stem, answer, q.dimension);
      const raw = await extractOpenTags(apiKey, tp);
      const data = raw as { tags?: string[] };
      store.setOpenTags({
        learning_preference: data.tags?.join(',') || '',
        pressure_response: '',
        environment: '',
        self_awareness: '',
      });
      store.answerOpen(answer);
    } catch {
      store.answerOpen(answer);
    } finally {
      setLoading(false);
    }
  }, [store, apiKey]);

  // ── Recommend phase ──
  useEffect(() => {
    if (store.phase !== 'recommend' || store.recommendResult || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const profile = computeAllFixedScores(store.fixedAnswers);
    const matched = matchMajors(profile, MAJORS);
    const conf = computeConfidence(FIXED_QUESTIONS.length + store.dynamicQuestions.length, 15);

    const rp = buildRecommendPrompt(
      profile,
      matched.slice(0, 10).map((m) => ({ major_name: m.major.major_name, score: m.score })),
      [],
      conf,
      store.openAnswers,
      store.gaokaoInfo,
    );

    getRecommendResult(apiKey, rp)
      .then((raw) => {
        const data = raw as RR;
        if (data.type === 'recommend') store.setRecommendResult(data);
        else store.addError('推荐生成失败');
      })
      .catch((err) => store.addError(err.message))
      .finally(() => {
        setLoading(false);
        loadingRef.current = false;
      });
  }, [store.phase, store.recommendResult, apiKey, store]);

  const handleStart = useCallback(() => {
    if (!apiKeyInput.trim()) return;
    store.setApiKey(apiKeyInput.trim());
    store.startAssessment();
  }, [apiKeyInput, store]);

  const handleRestart = useCallback(() => {
    store.reset();
    setSelectedMajor(null);
    loadingRef.current = false;
  }, [store]);

  const currentDynamic = store.dynamicQuestions[store.dynamicIndex] || null;
  const inAssessment = store.phase === 'fixed' || store.phase === 'dynamic' || store.phase === 'open';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a1a] text-white' : 'bg-white text-zinc-900'}`}>
      {/* Header */}
      <header className={`border-b px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md transition-colors duration-300 ${
        isDark ? 'bg-black/20 border-white/5' : 'bg-white/80 border-zinc-200'
      }`}>
        <div className="flex items-center gap-3">
          <i className="fas fa-graduation-cap text-indigo-400 text-xl"></i>
          <span className="font-bold tracking-wide">抱朴 · BaopuEmulator</span>
        </div>
        <div className="flex items-center gap-3">
          {inAssessment && (
            <span className="text-xs tabular-nums text-secondary">
              {store.phase === 'fixed' && `固定 ${store.fixedIndex + 1}/${FIXED_QUESTIONS.length}`}
              {store.phase === 'dynamic' && `消歧 ${store.dynamicIndex + 1}/${store.dynamicQuestions.length}`}
              {store.phase === 'open' && `开放 ${store.openIndex + 1}/${OPEN_QUESTIONS.length}`}
            </span>
          )}
          <button
            onClick={store.toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-zinc-100 text-zinc-500'}`}
            title="切换主题"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </header>

      {/* Idle: Start Screen */}
      {store.phase === 'idle' && (
        <div className="max-w-md mx-auto px-4 pt-16 sm:pt-20 pb-10">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🎓</div>
            <h1 className="text-3xl font-extrabold tracking-widest">抱朴</h1>
            <p className="text-secondary mt-2">中国本科专业匹配测评</p>
            <p className="text-secondary/70 text-sm mt-4 leading-relaxed">
              高考数据 → 15题画像 → 5题消歧 → 3题动机 → 智能推荐<br />
              3D专业宇宙 · 强/弱批判区分 · LLM驱动
            </p>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-secondary flex items-center gap-2">
              <i className="fas fa-key text-indigo-400"></i> DeepSeek API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className={`w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors focus:outline-none focus:border-indigo-400 ${
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-300'
              }`}
            />
            <p className="text-xs text-secondary/60">
              <i className="fas fa-shield-halved mr-1"></i>Key仅浏览器本地使用
            </p>
            <button
              onClick={handleStart}
              disabled={!apiKeyInput.trim()}
              className="w-full py-3.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className="fas fa-rocket"></i> 开始填写高考信息
            </button>
          </div>
        </div>
      )}

      {/* Gaokao Form */}
      {store.phase === 'gaokao' && (
        <GaokaoForm onSubmit={handleGaokaoSubmit} />
      )}

      {/* Assessment Layout */}
      {inAssessment && (
        <div className="assessment-shell">
          <div className="hidden lg:flex lg:flex-col lg:gap-3 left-col">
            <ProgressPanel phase={store.phase} currentQuestion={
              store.phase === 'fixed' ? store.fixedIndex :
              store.phase === 'dynamic' ? store.dynamicIndex : store.openIndex
            } totalQuestions={
              store.phase === 'fixed' ? FIXED_QUESTIONS.length :
              store.phase === 'dynamic' ? store.dynamicQuestions.length : OPEN_QUESTIONS.length
            } />
          </div>

          <div className="center-col">
            <div className="lg:hidden space-y-2">
              <ProgressPanel phase={store.phase} currentQuestion={
                store.phase === 'fixed' ? store.fixedIndex :
                store.phase === 'dynamic' ? store.dynamicIndex : store.openIndex
              } totalQuestions={
                store.phase === 'fixed' ? FIXED_QUESTIONS.length :
                store.phase === 'dynamic' ? store.dynamicQuestions.length : OPEN_QUESTIONS.length
              } />
              <ProfilePanel profile={store.profile} />
            </div>
            <div className="scene-box">
              <MajorUniverse majors={store.matchedMajors} onMajorClick={(m) => setSelectedMajor(m)} />
            </div>
            <div className="question-area">
              {store.phase === 'fixed' && FIXED_QUESTIONS[store.fixedIndex] && (
                <FixedQuestionCard question={FIXED_QUESTIONS[store.fixedIndex]} questionNumber={store.fixedIndex + 1} totalQuestions={FIXED_QUESTIONS.length} onSubmit={handleFixedAnswer} />
              )}
              {store.phase === 'dynamic' && currentDynamic && (
                <DynamicQuestionCard question={currentDynamic} questionNumber={store.dynamicIndex + 1} totalQuestions={store.dynamicQuestions.length} onSubmit={handleDynamicAnswer} loading={loading} />
              )}
              {store.phase === 'open' && OPEN_QUESTIONS[store.openIndex] && (
                <OpenQuestionCard question={OPEN_QUESTIONS[store.openIndex]} questionNumber={store.openIndex + 1} totalQuestions={OPEN_QUESTIONS.length} onSubmit={handleOpenAnswer} loading={loading} />
              )}
            </div>
          </div>

          <div className="hidden lg:block right-col">
            <ProfilePanel profile={store.profile} />
            {selectedMajor && (
              <div className={`p-3 rounded-lg text-xs space-y-1 ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-zinc-50 border border-zinc-200'
              }`}>
                <div className={`font-semibold ${isDark ? 'text-white/80' : 'text-zinc-800'}`}>{selectedMajor.major_name}</div>
                <div className="text-secondary">{selectedMajor.major_category} · {selectedMajor.critical_thinking_type}</div>
                <div className="text-secondary/70">{selectedMajor.job_direction}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMajor.skill_tags.map((t, i) => (
                    <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isDark ? 'bg-white/10 text-white/50' : 'bg-zinc-200 text-zinc-600'
                    }`}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommend — full scrollable dashboard */}
      {store.phase === 'recommend' && store.recommendResult && (
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
          <RecommendDashboard
            result={store.recommendResult}
            profile={store.profile}
            matchedMajors={store.matchedMajors}
            onRestart={handleRestart}
            selectedMajor={selectedMajor}
            onSelectMajor={setSelectedMajor}
          />
        </div>
      )}

      {/* Error */}
      {store.phase === 'error' && store.errors.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 rounded-xl p-4 max-w-md">
          {store.errors.map((err, i) => <p key={i} className="text-red-200 text-sm">{err}</p>)}
          <button onClick={store.clearErrors} className="mt-2 text-xs text-red-400 hover:text-red-300">关闭</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="flex items-center gap-3 text-white/70">
            <i className="fas fa-spinner fa-spin text-2xl text-indigo-400"></i>
            <span>AI 分析中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
