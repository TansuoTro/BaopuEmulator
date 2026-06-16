import React, { useState, useEffect, useRef } from 'react';
import { useAssessmentStore } from './store/useAssessmentStore';
import { FIXED_QUESTIONS, OPEN_QUESTIONS } from './data/questions';
import { buildDynamicPrompt, buildScorePrompt, buildScenarioPrompt, buildScenarioScorePrompt, buildOpenTagsPrompt, buildRecommendPrompt, SYSTEM_PROMPT } from './llm/prompts';
import { matchMajors, computeConfidence, detectConflicts } from './engine/scorer';
import { MajorNode, DynamicQuestion, UserProfile, RecommendationResult as RR, GaokaoInfo, PROVINCES, PROVINCE_MAX_SCORE, GAOKAO_YEARS } from './types';
import { logLLM, logFallback, logPhase, log } from './utils/logger';
import { useClickParticles } from './utils/particles';
import UniverseScene from './components/3d/UniverseScene';
import PersonalityAxes from './components/results/PersonalityAxes';
import html2canvas from 'html2canvas';
import '@fortawesome/fontawesome-free/css/all.min.css';

log('info','App','BaopuEmulator V4 启动',{majors:44,questions:18,backend:'Netlify proxy + local fallback'});

/* ── API: proxy in production, direct DeepSeek in local dev ── */
const PROXY = '/.netlify/functions/api-proxy';
const DEEPSEEK = 'https://api.deepseek.com/v1/chat/completions';
const DEV_KEY = 'sk-591f2f855fad483ba302d48d8ad3aea2';
let fallbackLogged = false;

function cleanJson(raw: string): string {
  let c = raw.trim();
  if (c.startsWith('```json')) c = c.slice(7); else if (c.startsWith('```')) c = c.slice(3);
  if (c.endsWith('```')) c = c.slice(0,-3); c = c.trim();
  for (const ch of ['{','[']) { const a=c.indexOf(ch), b=c.lastIndexOf(ch==='{'?'}':']'); if(a!==-1&&b!==-1&&b>a){c=c.slice(a,b+1);break;} }
  return c;
}

async function ds(_apiKey: string, prompt: string): Promise<unknown> {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (!isLocal) {
    try {
      const res = await fetch(PROXY, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt, system_prompt: SYSTEM_PROMPT }) });
      if(res.ok){const d=await res.json();if(d.content)return JSON.parse(cleanJson(d.content));}
    } catch { /* fall through to direct */ }
  }

  if(isLocal && !fallbackLogged){fallbackLogged=true;log('info','API','本地开发模式，直连DeepSeek');}

  const res = await fetch(DEEPSEEK, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${DEV_KEY}`}, body:JSON.stringify({model:'deepseek-chat',messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:prompt}],temperature:0.7,max_tokens:4096,response_format:{type:'json_object'}}) });
  if(!res.ok){const t=await res.text();throw new Error(`API ${res.status}: ${t.slice(0,200)}`);}
  const d=await res.json();const raw=d.choices?.[0]?.message?.content;if(!raw)throw new Error('Empty');
  return JSON.parse(cleanJson(raw));
}
/* ── Extracted GaokaoForm component (no hooks-in-conditionals) ── */
const GaokaoSection: React.FC<{ onSubmit: (info: GaokaoInfo) => void }> = ({ onSubmit }) => {
  const [g, setG] = useState<GaokaoInfo>({ year:2025,province:'',total_score:0,provincial_rank:0,gaokao_type:'新高考',chinese:0,math:0,english:0,composite_score:0,elective_subjects:[],target_provinces:[],career_intention:'不清楚' });
  const u = (k: string, v: unknown) => setG(p => ({ ...p, [k]: v }));
  const isOldGaokao = g.gaokao_type.startsWith('旧高考');
  const isSci = g.gaokao_type === '旧高考-理综';
  const autoTotal = g.chinese + g.math + g.english + (isOldGaokao ? g.composite_score : g.elective_subjects.reduce((s,sub)=>s+(sub.score||0), 0));
  const can = g.province && autoTotal > 0 && g.chinese > 0 && g.math > 0 && g.english > 0;
  // Sync autoTotal back to state
  if (autoTotal !== g.total_score && autoTotal > 0) u('total_score', autoTotal);
  const maxScore = PROVINCE_MAX_SCORE[g.province] || 750;
  const electSubs = ['物理','化学','生物','历史','政治','地理','技术'];
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-5 overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
      <h2 className="text-xl font-bold text-center text-white">高考信息</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-white/50 block mb-1">年份</label><select value={g.year} onChange={e => u('year', +e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white">{GAOKAO_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label className="text-xs text-white/50 block mb-1">省份</label><select value={g.province} onChange={e => u('province', e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white"><option value="">请选择</option>{PROVINCES.slice(0,31).map(p => <option key={p}>{p}</option>)}</select>
            {g.province && maxScore !== 750 && <p className="text-[10px] text-amber-400/60 mt-1">* 该省满分{maxScore}分（上海660/海南900）</p>}
          </div>
          <div><label className="text-xs text-white/50 block mb-1">类型</label><select value={g.gaokao_type} onChange={e => u('gaokao_type', e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white"><option value="新高考">新高考 (3+1+2)</option><option value="旧高考-理综">旧高考-理综</option><option value="旧高考-文综">旧高考-文综</option></select>
            <p className="text-[10px] text-white/30 mt-1">{g.gaokao_type === '新高考' ? '语数英各150 + 3门选考各100(赋分制)' : '语数英各150 + ' + (isSci ? '理综' : '文综') + '300'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-white/50 block mb-1">总分 (满分{maxScore}，自动计算)</label><input type="text" value={autoTotal || ''} readOnly className={`w-full p-2 rounded text-sm font-bold ${autoTotal>0?'text-emerald-300':'text-white/30'} bg-white/5 border border-white/10`} /></div>
          <div><label className="text-xs text-white/50 block mb-1">排名(可选)</label><input type="number" value={g.provincial_rank || ''} onChange={e => u('provincial_rank', +e.target.value)} placeholder="选填" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-white/50 block mb-1">语文 (150)</label><input type="number" value={g.chinese || ''} onChange={e => u('chinese', +e.target.value)} placeholder="0~150" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
          <div><label className="text-xs text-white/50 block mb-1">数学 (150)</label><input type="number" value={g.math || ''} onChange={e => u('math', +e.target.value)} placeholder="0~150" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
          <div><label className="text-xs text-white/50 block mb-1">英语 (150)</label><input type="number" value={g.english || ''} onChange={e => u('english', +e.target.value)} placeholder="0~150" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" /></div>
        </div>

        {/* 旧高考: 理综/文综 300分 */}
        {isOldGaokao ? (
          <div>
            <label className="text-xs text-white/50 block mb-1">{isSci ? '理科综合' : '文科综合'} (300)</label>
            <input type="number" value={g.composite_score || ''} onChange={e => u('composite_score', +e.target.value)} placeholder="0~300" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" />
          </div>
        ) : (
          /* 新高考: 选考科目，赋分制100分/门 */
          <div>
            <label className="text-xs text-white/50 block mb-2">选考科目（点击选择，赋分制100分/门）</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {electSubs.map(sub => {
                const sel = g.elective_subjects.find(s => s.name === sub);
                return (
                  <button key={sub} type="button" onClick={() => {
                    if (sel) { u('elective_subjects', g.elective_subjects.filter(s => s.name !== sub)); }
                    else if (g.elective_subjects.length < 3) { u('elective_subjects', [...g.elective_subjects, { name: sub, score: 0 }]); }
                  }} className={`px-3 py-1.5 rounded-full text-xs transition-colors ${sel ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50' : 'border border-white/10 text-white/50 hover:border-white/30'}`}>
                    {sub}
                  </button>
                );
              })}
            </div>
            {g.elective_subjects.map(sub => (
              <div key={sub.name} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/50 w-8">{sub.name}</span>
                <input type="number" value={sub.score || ''} onChange={e => {
                  const v = +e.target.value;
                  u('elective_subjects', g.elective_subjects.map(s => s.name === sub.name ? { ...s, score: v } : s));
                }} placeholder="0~100" className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white" />
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="text-xs text-white/50 block mb-1">毕业意🧭</label>
          <select value={g.career_intention} onChange={e => u('career_intention', e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-white">
            <option value="求职">求职 — 毕业直接找工作</option>
            <option value="升学">升学 — 考研/保研/出国深造</option>
            <option value="考公">考公 — 考公务员/事业编</option>
            <option value="灵活就业">灵活就业 — 自己单干/创业/自由职业</option>
            <option value="不清楚">还不清楚 — 让系统根据测评结果帮我分析</option>
          </select>
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
  const dims = [
    { k:'math',l:'数学',i:'fa-calculator' },{ k:'spatial',l:'空间',i:'fa-cube' },{ k:'language',l:'语言',i:'fa-pen' },{ k:'logic',l:'逻辑',i:'fa-brain' },
    { k:'programming',l:'编程',i:'fa-code' },{ k:'practice',l:'动手',i:'fa-wrench' },{ k:'social',l:'社交',i:'fa-users' },{ k:'teamwork',l:'协作',i:'fa-people-group' },
    { k:'emotion_stability',l:'情绪',i:'fa-heart' },{ k:'decision_confidence',l:'果断',i:'fa-bolt' },{ k:'pressure_tolerance',l:'抗压',i:'fa-shield' },{ k:'long_term_persistence',l:'坚持',i:'fa-hourglass' },
    { k:'critical_thinking',l:'批判',i:'fa-scale-balanced' },{ k:'creativity',l:'创造',i:'fa-lightbulb' },{ k:'rule_compliance',l:'规则',i:'fa-gavel' },
    { k:'complexity_interest',l:'复杂',i:'fa-circle-nodes' },{ k:'theory_vs_practice',l:'理论',i:'fa-book' },{ k:'independent_vs_team',l:'独立',i:'fa-person' },{ k:'stable_vs_change',l:'稳定',i:'fa-anchor' },
  ];
  return <div className="space-y-1.5">{dims.map(b => <Bar key={b.k} label={b.l} val={pf[b.k] ?? 50} icon={b.i} />)}</div>;
};

/* ── App ── */
/* ── Fallback scenarios ── */
function defaultScenarios(): DynamicQuestion[] {
  const pool: DynamicQuestion[] = [
    { id:'S01',question_type:'fill',target_discrimination:['pressure_tolerance','decision_confidence'],stem:'你同时接到三个任务：A导师让你明天交一份你完全不会的数据分析报告，B室友让你帮他改简历今晚就要，C你自己下周一有个重要考试还没复习。你会怎么处理这个局面？为什么这样安排？',options:[],input_hint:'请详细描述你的处理方式和理由...',expected_signal:'抗压与决策风格'},
    { id:'S02',question_type:'fill',target_discrimination:['emotion_stability','social'],stem:'你们小组项目拿了奖，但你从别人嘴里听到：组长把你的核心贡献归到了他自己名下，他不在场时跟老师汇报的。大家都在恭喜组长，没人注意到你。你会怎么做？为什么？',options:[],input_hint:'请描述你的做法和内心的想法...',expected_signal:'冲突处理与情绪控制'},
    { id:'S03',question_type:'fill',target_discrimination:['critical_thinking','rule_compliance'],stem:'实习时你发现带你的导师在系统里留了一个后门。他说"以前的人都有，方便调试"，让你别管。他教了你很多东西，你正需要他的推荐信。你怎么处理？说明你的考虑。',options:[],input_hint:'请描述你的处理方式和权衡过程...',expected_signal:'职业道德与规则意识'},
    { id:'S04',question_type:'fill',target_discrimination:['social','independent_vs_team'],stem:'朋友圈里有人转了一篇文章，观点你强烈反对，底下几十条评论全是赞同，没有人提出异议。你和ta有共同好友，关系一般。你会公开表达反对吗？为什么？',options:[],input_hint:'请描述你的选择及背后的考虑...',expected_signal:'社交风格与立场表达'},
    { id:'S05',question_type:'fill',target_discrimination:['decision_confidence','pressure_tolerance'],stem:'你拿到了两个offer：A是大厂稳定岗位但内容枯燥，B是创业公司有趣但随时可能倒闭。家人强烈建议选A，但你对B更心动。你会怎么选？说明你的决策过程。',options:[],input_hint:'请描述你的考虑和最终选择...',expected_signal:'风险偏好与决策风格'},
    { id:'S06',question_type:'fill',target_discrimination:['emotion_stability','critical_thinking'],stem:'你在网上发表了一篇技术文章，被人断章取义挂了出来，评论区一片骂声。有朋友私信让你删帖道歉息事宁人，但你觉得原文没问题。你怎么办？',options:[],input_hint:'请描述你的想法和行动...',expected_signal:'舆论压力与立场坚持'},
    { id:'S07',question_type:'fill',target_discrimination:['rule_compliance','social'],stem:'考试时你旁边的人在偷看你的卷子，老师没发现。这个人平时对你挺好的。你会怎么做？考试结束后你会跟ta说什么吗？',options:[],input_hint:'请描述你的反应和考虑...',expected_signal:'规则意识与人际平衡'},
    { id:'S08',question_type:'fill',target_discrimination:['long_term_persistence','decision_confidence'],stem:'你坚持了一年的项目最近没有任何进展，身边的人都劝你放弃。你自己也开始怀疑是不是走错了方向。你会继续坚持还是果断放弃？怎么判断？',options:[],input_hint:'请描述你的思考过程...',expected_signal:'长期坚持与理性放弃'},
    { id:'S09',question_type:'fill',target_discrimination:['creativity','rule_compliance'],stem:'老师布置了一个课程设计，要求严格按模板来。但你有一个更好的创意方案，不过如果用了可能会被扣分。你会按模板走还是冒险用创意方案？',options:[],input_hint:'请描述你的选择和理由...',expected_signal:'创造力与规则服从'},
    { id:'S10',question_type:'fill',target_discrimination:['independent_vs_team','social'],stem:'你在做一个项目，一个人做效率很高但比较孤独，团队做进度慢但有人讨论。你有一个选择：可以独立完成拿全部credit，也可以拉人合作但得分着。你倾向哪种？',options:[],input_hint:'请描述你的倾向和原因...',expected_signal:'独立vs协作偏好'},
    { id:'S11',question_type:'fill',target_discrimination:['critical_thinking','emotion_stability'],stem:'你最尊敬的一位老师/前辈在课堂上讲了一个观点你认为是错的。你有证据，但当着全班/全组的面指出可能会让对方难堪。你会怎么做？',options:[],input_hint:'请描述你如何处理这个两难...',expected_signal:'批判表达与尊重权威'},
    { id:'S12',question_type:'fill',target_discrimination:['pressure_tolerance','long_term_persistence'],stem:'未来一年你将同时面对：考研/求职准备、毕业论文、家庭期望、经济压力。想到这些你觉得最担心的是什么？你打算怎么扛过去？',options:[],input_hint:'请描述你的心态和计划...',expected_signal:'长期压力承受能力'},
    { id:'S13',question_type:'fill',target_discrimination:['social','independent_vs_team'],stem:'你们班要组队参加比赛，你发现能力强的人都已经组好了队，剩下的人实力较弱。你是主动去找强队哪怕当配角，还是拉剩下的人自己当队长带一个弱队？',options:[],input_hint:'请描述你的选择和考虑...',expected_signal:'领导力与协作策略'},
    { id:'S14',question_type:'fill',target_discrimination:['rule_compliance','critical_thinking'],stem:'你发现学校的一项规定明显不合理，很多同学都在抱怨但没人反映。你有渠道可以向上反映，但可能会被老师记住。你会站出来吗？',options:[],input_hint:'请描述你的决定和理由...',expected_signal:'规则挑战与风险承担'},
    { id:'S15',question_type:'fill',target_discrimination:['emotion_stability','decision_confidence'],stem:'你花了很多心血准备的一次演讲/答辩，上台后突然大脑一片空白，下面的观众开始窃窃私语。距离结束还有5分钟。你会怎么应对？',options:[],input_hint:'请描述你临场的反应...',expected_signal:'临场应变与情绪控制'},
    { id:'S16',question_type:'fill',target_discrimination:['creativity','complexity_interest'],stem:'如果给你三个月完全自由的时间，没有课业压力没有经济负担，但你必须完成一件你自己觉得"值得"的事。你会做什么？为什么选这个？',options:[],input_hint:'请描述你的计划和动机...',expected_signal:'内在动机与兴趣倾向'},
  ];
  // 随机选择4道不重复的题
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((q,i) => ({...q, id: `S${String(i+1).padStart(2,'0')}`}));
}

const App: React.FC = () => {
  const store = useAssessmentStore();
  const [loading, setLoading] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<MajorNode | null>(null);
  const [followupHint, setFollowupHint] = useState('');
  const [tookGaokao, setTookGaokao] = useState<boolean | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const loadingRef = useRef(false);
  const submittingRef = useRef(false);
  const openRef = useRef<HTMLTextAreaElement>(null);
  const { phase, theme, profile } = store;
  const isDark = theme === 'dark';
  const { spawn, Particles } = useClickParticles();

  const handleGaokaoSubmit = (info: GaokaoInfo) => { store.setGaokaoInfo(info); };
  const handleFixedAnswer = (a: string) => { store.answerFixed(a); };

  /* Dynamic phase */
  useEffect(() => {
    if (phase !== 'dynamic' || store.dynamicQuestions.length > 0 || loadingRef.current) return;
    loadingRef.current = true; setLoading(true);
    const hist = FIXED_QUESTIONS.map(q => q.primary_dim);
    const fallback = FIXED_QUESTIONS.slice(0, 5).map((f, i) => ({ id:`D${i+1}`,question_type:'choice' as const,target_discrimination:[f.primary_dim],stem:`再确认：${f.stem}`,options:f.options.map(o=>({key:o.key,text:o.text})),input_hint:'',expected_signal:`确认${f.primary_dim}` }));
    logLLM('dynamic','start');
    ds(store.apiKey, buildDynamicPrompt(profile, detectConflicts(profile), hist as string[]))
      .then(raw => {
        logLLM('dynamic','ok',`${Array.isArray(raw)?'array':typeof raw}`);
        const d = raw as Record<string, unknown>; let qs: DynamicQuestion[] = [];
        if (d.questions && Array.isArray(d.questions)) qs = (d.questions as Record<string, unknown>[]).filter(x => x && 'stem' in x) as unknown as DynamicQuestion[];
        else if (Array.isArray(d)) qs = (d as unknown[]).filter(x => x && typeof x === 'object' && 'stem' in x) as unknown as DynamicQuestion[];
        store.setDynamicQuestions(qs.length ? qs.slice(0, 5) : fallback);
        if(!qs.length) logFallback('dynamic: LLM返回空，使用固定题变体');
      }).catch(e => { logLLM('dynamic','fail',(e as Error).message); logFallback('dynamic: API调用失败'); store.setDynamicQuestions(fallback); })
      .finally(() => { setLoading(false); loadingRef.current = false; });
  }, [phase, store.dynamicQuestions.length, store.apiKey, profile]);

  /* ── Code fallback helpers ── */
  function applyOptionScores(p: UserProfile, q: DynamicQuestion, answerKey: string) {
    const scores = q.option_scores?.[answerKey];
    if (!scores) { const delta = answerKey === q.options[q.options.length-1]?.key ? 8 : -4; store.updateProfileDynamic(q.target_discrimination[0] as keyof UserProfile, delta); return; }
    const fresh = { ...p };
    for (const [dim, val] of Object.entries(scores)) {
      const key = dim as keyof UserProfile;
      if (key in fresh) {
        const delta = Math.round((val - (fresh[key]??50)) * 0.3);
        (fresh as Record<string,number>)[key] = Math.min(100, Math.max(0, (fresh[key]??50) + delta));
      }
    }
    useAssessmentStore.setState({ profile: fresh });
  }

  function fallbackScenarioScore(p: UserProfile, answer: string) {
    const len = answer.length;
    if (len < 15) return;
    const delta = Math.min(8, Math.round(len / 20));
    const dims: (keyof UserProfile)[] = ['decision_confidence','emotion_stability','social'];
    const fresh = { ...p };
    for (const d of dims) (fresh as Record<string,number>)[d] = Math.min(100, (fresh[d]??50) + delta);
    if (/沟通|商量|说|谈/.test(answer)) fresh.social = Math.min(100, (fresh.social??50) + 4);
    if (/规则|规定|应该|必须/.test(answer)) fresh.rule_compliance = Math.min(100, (fresh.rule_compliance??50) + 3);
    if (/分析|逻辑|原因|因为/.test(answer)) fresh.critical_thinking = Math.min(100, (fresh.critical_thinking??50) + 3);
    useAssessmentStore.setState({ profile: fresh });
  }

  function fallbackOpenTags(answer: string): string[] {
    const tags: string[] = [];
    if (answer.length < 15) return tags;
    if (/一方面.*另一方面|既.*又|权衡|利弊/.test(answer)) tags.push('tradeoff_analysis');
    if (/如果.*那么|假如|假设|条件/.test(answer)) tags.push('conditional_reasoning');
    if (/多个.*原因|因素|角度|层面/.test(answer)) tags.push('multi_factor');
    if (/不一定是|不一定对|反例|例外/.test(answer)) tags.push('counterexample_awareness');
    if (/恶心|为什么.*吃/.test(answer) && /进化|文化|心理|生物/.test(answer)) tags.push('abstraction_tolerance');
    if (/拆解|分解|步骤|首先.*然后/.test(answer)) tags.push('problem_decomposition');
    if (/归纳|总结|规律|例子/.test(answer)) tags.push('inductive_preference');
    if (/推导|推理|演绎|公式/.test(answer)) tags.push('deductive_preference');
    if (tags.length === 0) tags.push('multi_factor');
    return tags.slice(0, 5);
  }

  const handleDynamicAnswer = async (a: string) => {
    const q = store.dynamicQuestions[store.dynamicIndex]; if (!q || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const r = await ds(store.apiKey, buildScorePrompt(profile, q.stem, a, q.target_discrimination));
      logLLM('score-dynamic','ok');
      const d = r as { updated_profile?: Record<string, number> };
      const fresh = useAssessmentStore.getState().profile;
      if (d.updated_profile) { const p = { ...fresh }; for (const k of Object.keys(d.updated_profile)) { const key = k as keyof UserProfile; if (key in p) (p as Record<string, number>)[k] = Math.min(100, Math.max(0, d.updated_profile[k] ?? 50)); } useAssessmentStore.setState({ profile: p }); }
      else { applyOptionScores(fresh, q, a); }
      store.answerDynamic(a);
    } catch (e) { logLLM('score-dynamic','fail',(e as Error).message); applyOptionScores(useAssessmentStore.getState().profile, q, a); store.answerDynamic(a); }
    finally { submittingRef.current = false; }
  };

  const handleOpenAnswer = async (a: string) => {
    const q = OPEN_QUESTIONS[store.openIndex]; if (!q) return;
    let isFollowup = false;
    try {
      const r = await ds(store.apiKey, buildOpenTagsPrompt(q.stem, a));
      const d = r as { needs_followup?: boolean; followup_prompt?: string; tags?: string[] };
      if (d.needs_followup) {
        isFollowup = true;
        setFollowupHint(d.followup_prompt || '请再详细展开一下你的想法，可以从不同角度来回答。');
        if(openRef.current) openRef.current.value = '';
        return;
      }
      setFollowupHint('');
      store.applyOpenResult(r as { tags?: string[] }); store.answerOpen(a);
    } catch { const tags = fallbackOpenTags(a); store.applyOpenResult({ tags }); if (!isFollowup) store.answerOpen(a); }
    finally { if (!isFollowup && openRef.current) openRef.current.value = ''; }
  };

  /* Scenario phase: fetch 4 scenario questions */
  useEffect(() => {
    if (phase !== 'scenario' || store.scenarioQuestions.length > 0 || loadingRef.current) return;
    loadingRef.current = true; setLoading(true);
    logLLM('scenario','start');
    const gk = store.gaokaoInfo;
    const gkSummary = { province: gk.province, total_score: gk.total_score, gaokao_type: gk.gaokao_type, math: gk.math, chinese: gk.chinese, elective: gk.elective_subjects.map(s=>s.name).join(',') };
    ds(store.apiKey, buildScenarioPrompt(profile, FIXED_QUESTIONS.map(q => q.primary_dim) as string[], gkSummary))
      .then(raw => {
        logLLM('scenario','ok');
        const d = raw as Record<string, unknown>; let qs: DynamicQuestion[] = [];
        if (d.questions && Array.isArray(d.questions)) qs = (d.questions as Record<string, unknown>[]).filter(x => x && 'stem' in x) as unknown as DynamicQuestion[];
        else if (Array.isArray(d)) qs = (d as unknown[]).filter(x => x && typeof x === 'object' && 'stem' in x) as unknown as DynamicQuestion[];
        store.setScenarioQuestions(qs.length ? qs.slice(0, 4) : defaultScenarios());
        if(!qs.length) logFallback('scenario: LLM返回空，使用默认情景题');
      }).catch(e => { logLLM('scenario','fail',(e as Error).message); logFallback('scenario: API调用失败'); store.setScenarioQuestions(defaultScenarios()); })
      .finally(() => { setLoading(false); loadingRef.current = false; });
  }, [phase, store.scenarioQuestions.length, store.apiKey, profile]);

  const handleScenarioAnswer = async (a: string) => {
    const q = store.scenarioQuestions[store.scenarioIndex]; if (!q || submittingRef.current) return;
    let isFollowup = false;
    submittingRef.current = true;
    try {
      const r = await ds(store.apiKey, buildScenarioScorePrompt(profile, q.stem, a));
      logLLM('score-scenario', 'ok');
      const d = r as { needs_followup?: boolean; followup_prompt?: string; updated_profile?: Record<string, number> };
      if (d.needs_followup) {
        isFollowup = true;
        setFollowupHint(d.followup_prompt || '请再详细描述一下你的想法，说说为什么你会这样选择？');
        if(openRef.current) openRef.current.value = '';
        return;
      }
      setFollowupHint('');
      if (d.updated_profile) { const fresh = useAssessmentStore.getState().profile; const p = { ...fresh }; for (const k of Object.keys(d.updated_profile)) { const key = k as keyof UserProfile; if (key in p) (p as Record<string, number>)[k] = Math.min(100, Math.max(0, d.updated_profile[k] ?? 50)); } useAssessmentStore.setState({ profile: p }); }
      store.answerScenario(a);
    } catch (e) { fallbackScenarioScore(useAssessmentStore.getState().profile, a); if (!isFollowup) store.answerScenario(a); }
    finally { if (!isFollowup && openRef.current) openRef.current.value = ''; }
  };

  /* Recommend phase */
  useEffect(() => {
    if (phase !== 'recommend' || store.recommendation || loadingRef.current) return;
    loadingRef.current = true; setLoading(true);
    const s = useAssessmentStore.getState();
    const matched = matchMajors(s.profile);
    const confl = detectConflicts(s.profile);
    const conf = computeConfidence(s.fixedIndex, s.dynamicIndex, s.profile, confl, s.openTags || null);
    const prompt = buildRecommendPrompt(s.profile, matched.slice(0, 10).map(m => ({ name: m.major.name, code: m.major.code, category: m.major.category, cosine_score: m.cosine_score, tags: m.major.tags })), confl, conf, s.openAnswers, s.scenarioAnswers, s.gaokaoInfo);
    logLLM('recommend','start');
    ds(s.apiKey, prompt).then(raw => {
      logLLM('recommend','ok');
      const d = raw as RR; store.finalizeRecommendation(d);
    }).catch(e => { logLLM('recommend','fail',(e as Error).message); store.finalizeRecommendation({ final_note: '基于代码侧匹配结果（LLM推荐生成失败）' }); }).finally(() => { setLoading(false); loadingRef.current = false; });
  }, [phase, store.recommendation, store.apiKey, store.fixedIndex, store.dynamicIndex, store.gaokaoInfo, store.openAnswers, store.scenarioAnswers]);

  const handleStart = () => { store.setApiKey('netlify-proxy'); logPhase('idle','gaokao'); store.startAssessment(); };

  const handleExport = async () => {
    const el = document.getElementById('recommend-root');
    if (!el) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#080816',
        scale: 2,
        allowTaint: true,
        useCORS: true,
        onclone: (clonedDoc) => {
          // Remove ALL style tags that may contain oklab()
          clonedDoc.querySelectorAll('style').forEach(s => s.remove());
          clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());
          // Inject safe explicit styles
          const safe = clonedDoc.createElement('style');
          safe.textContent = `
            * { color-scheme: dark !important; }
            body, div { background: #080816 !important; color: #e2e8f0 !important; }
            .bg-white\\/5, .bg-white\\/10, [class*="bg-white"] { background: rgba(255,255,255,0.05) !important; }
            [class*="bg-black"] { background: rgba(0,0,0,0.2) !important; }
            [class*="border-white"] { border-color: rgba(255,255,255,0.1) !important; }
            [class*="text-white"] { color: #e2e8f0 !important; }
            .text-emerald-300, [class*="text-emerald"] { color: #6ee7b7 !important; }
            .text-amber-300, [class*="text-amber"] { color: #fcd34d !important; }
            .text-indigo-300, [class*="text-indigo"] { color: #a5b4fc !important; }
            .text-rose-300, [class*="text-rose"] { color: #fda4af !important; }
            .text-purple-300, [class*="text-purple"] { color: #c4b5fd !important; }
            [class*="bg-indigo"] { background: #4f46e5 !important; }
            [class*="bg-emerald"] { background: #059669 !important; }
            [class*="bg-amber"] { background: #d97706 !important; }
            button { color: white !important; }
            img, svg, canvas { display: block; }
          `;
          clonedDoc.head.appendChild(safe);
        },
      });
      const link = document.createElement('a');
      link.download = `BaopuEmulator_${store.nickname || 'report'}_${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Export failed:', e); } finally { setLoading(false); }
  };
  const handleGoBack = () => { setFollowupHint(''); store.goBack(); };
  const handleRestart = () => { store.reset(); setSelectedMajor(null); loadingRef.current = false; setFollowupHint(''); };
  const curDynamic = store.dynamicQuestions[store.dynamicIndex] || null;
  const curScenario = store.scenarioQuestions[store.scenarioIndex] || null;
  const inAssess = phase === 'fixed' || phase === 'dynamic' || phase === 'scenario' || phase === 'open';
  const totalQ = phase === 'fixed' ? FIXED_QUESTIONS.length : phase === 'dynamic' ? store.dynamicQuestions.length || 5 : phase === 'scenario' ? store.scenarioQuestions.length || 4 : OPEN_QUESTIONS.length;
  const curQ = phase === 'fixed' ? store.fixedIndex : phase === 'dynamic' ? store.dynamicIndex : phase === 'scenario' ? store.scenarioIndex : phase === 'open' ? store.openIndex : 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#080816] text-white' : 'bg-zinc-50 text-zinc-900'}`} data-theme={isDark ? 'dark' : 'light'} onClick={spawn}>
      {/* Header */}
      <header className={`border-b px-4 py-3 flex items-center justify-between backdrop-blur-md ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => { if (phase !== 'idle' && tookGaokao) setShowRestartConfirm(true); else handleRestart(); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" title="点击返回首页">
            <i className="fas fa-graduation-cap text-indigo-400 text-xl" /> <span className="font-bold">抱朴 · BaopuEmulator</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {inAssess && <span className="text-xs text-white/40">{phase === 'fixed' ? '固定' : phase === 'dynamic' ? '消歧' : phase === 'scenario' ? '情景' : '开放'} {curQ + 1}/{totalQ}</span>}
          <button onClick={store.toggleTheme} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-zinc-100 text-zinc-500'}`}><i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} /></button>
        </div>
      </header>

      {/* Gaokao Gate — first screen */}
      {tookGaokao === null && (
        <div className="max-w-md mx-auto px-4 pt-24 sm:pt-32 pb-10 text-center">
          <div className="text-6xl mb-6">🎓</div>
          <h1 className="text-2xl font-extrabold tracking-widest mb-8">你有没有参加过高考？</h1>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setTookGaokao(true)} className="px-10 py-4 rounded-xl font-bold text-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all">
              参加过 <i className="fas fa-check ml-2"/>
            </button>
            <button onClick={() => setTookGaokao(false)} className="px-10 py-4 rounded-xl font-bold text-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all">
              没参加过 <i className="fas fa-xmark ml-2"/>
            </button>
          </div>
        </div>
      )}

      {/* TookGaokao=false: reject screen */}
      {tookGaokao === false && (
        <div className="max-w-md mx-auto px-4 pt-24 pb-10 text-center">
          <div className="text-8xl mb-6">🔨</div>
          <h1 className="text-3xl font-extrabold tracking-widest mb-4">你没参加高考你玩个锤子</h1>
          <p className="text-white/40 text-sm mb-8">这个系统是给高考生匹配本科专业用的<br/>没参加过高考的话...要不再想想？</p>
          <button onClick={() => setTookGaokao(null)} className="px-8 py-3 rounded-lg border border-white/20 text-white/50 hover:text-white/70 hover:border-white/40 transition-all text-sm">
            <i className="fas fa-arrow-left mr-2"/>重新选择
          </button>
        </div>
      )}

      {/* Idle */}
      {tookGaokao === true && phase === 'idle' && (
        <div className="max-w-md mx-auto px-4 pt-16 sm:pt-20 pb-10 text-center">
          <div className="text-5xl mb-4">🌌</div><h1 className="text-3xl font-extrabold tracking-widest">抱朴V3</h1>
          <p className="text-white/40 mt-2">AI本科专业宇宙</p>
          <p className="text-white/30 text-sm mt-4 leading-relaxed">高考数据→18题画像→5题消歧→3题动机→专业宇宙</p>
          <div className="mt-8 space-y-4 text-left">
            <label className="block text-sm text-white/60 flex items-center gap-2"><i className="fas fa-user text-indigo-400" /> 你的昵称（选填，将出现在导出报告上）</label>
            <input type="text" value={store.nickname} onChange={e => store.setNickname(e.target.value)} placeholder="输入昵称..." className={`w-full px-4 py-3 rounded-lg text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-white/20' : 'bg-zinc-100 border border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
            <button onClick={handleStart} className="w-full py-3.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all">🌌 进入专业宇宙</button>
          </div>
        </div>
      )}

      {/* Gaokao */}
      {tookGaokao === true && phase === 'gaokao' && <GaokaoSection onSubmit={handleGaokaoSubmit} />}

      {/* Assessment */}
      {tookGaokao === true && inAssess && (
        <div className={`assessment-shell ${isDark ? '' : 'assessment-shell-light'}`}>
          <div className="hidden lg:block left-col">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-100/80 border-zinc-200'}`}>
              <h3 className="text-xs font-bold mb-3">{phase === 'fixed' ? '阶段一：基础画像' : phase === 'dynamic' ? '阶段二：深度消歧' : phase === 'scenario' ? '阶段三：情景决断' : '阶段四：动机补足'}</h3>
              <div className="h-1.5 bg-white/10 rounded-full mb-3"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalQ ? Math.round(curQ / totalQ * 100) : 0}%` }} /></div>
              <div className="text-xs text-white/30">{curQ}/{totalQ} 题</div>
            </div>
          </div>
          <div className="center-col">
            <div className="lg:hidden p-3 rounded-xl border text-xs text-white/40 bg-white/5 border-white/10 flex items-center justify-between">
              <span>{phase === 'fixed' ? '基础画像' : phase === 'dynamic' ? '深度消歧' : phase === 'scenario' ? '情景决断' : '动机补足'} {curQ + 1}/{totalQ}</span>
              {curQ > 0 && <button onClick={handleGoBack} className="text-indigo-400 hover:text-indigo-300 text-xs"><i className="fas fa-arrow-left mr-1"/>上一题</button>}
            </div>
            <div className="scene-box"><UniverseScene majors={store.matchedMajors} onMajorClick={setSelectedMajor} /></div>
            <div className="question-area">
              {phase === 'fixed' && FIXED_QUESTIONS[store.fixedIndex] && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
                  <div className="text-xs text-white/40 flex items-center justify-between">{store.fixedIndex + 1}/{FIXED_QUESTIONS.length}{store.fixedIndex > 0 && <button onClick={handleGoBack} className="text-indigo-400 hover:text-indigo-300"><i className="fas fa-arrow-left mr-1"/>返回上题</button>}</div>
                  <p className="text-white/90">{FIXED_QUESTIONS[store.fixedIndex].stem}</p>
                  <div className="space-y-2">{FIXED_QUESTIONS[store.fixedIndex].options.map(o => <button key={o.key} onClick={() => handleFixedAnswer(o.key)} className="w-full text-left px-4 py-3 rounded-lg border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/10 text-white/70 text-sm transition-all"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs mr-3">{o.key}</span>{o.text}</button>)}</div>
                </div>
              )}
              {phase === 'dynamic' && curDynamic && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-purple-500/20' : 'bg-white border-purple-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between text-xs"><span className="text-purple-400">消歧 {store.dynamicIndex + 1}/{store.dynamicQuestions.length}</span>{store.dynamicIndex > 0 && <button onClick={handleGoBack} className="text-indigo-400 hover:text-indigo-300"><i className="fas fa-arrow-left mr-1"/>返回</button>}</div>
                  <p className="text-white/90">{curDynamic.stem}</p>
                  {curDynamic.question_type === 'choice' ? <div className="space-y-2">{curDynamic.options.map(o => <button key={o.key} onClick={() => handleDynamicAnswer(o.key)} disabled={loading} className="w-full text-left px-4 py-3 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-purple-500/10 text-white/70 text-sm transition-all disabled:opacity-50"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs mr-3">{o.key}</span>{o.text}</button>)}</div> : <div><input type="text" onKeyDown={e => { if (e.key === 'Enter') handleDynamicAnswer((e.target as HTMLInputElement).value); }} placeholder={curDynamic.input_hint || '输入回答...'} className="w-full p-3 rounded bg-white/5 border border-white/10 text-white text-sm" /></div>}
                </div>
              )}
              {phase === 'scenario' && curScenario && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-rose-500/20' : 'bg-white border-rose-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between text-xs"><span className="text-rose-400">情景 {store.scenarioIndex + 1}/{store.scenarioQuestions.length}</span>{store.scenarioIndex > 0 && <button onClick={store.goBack} className="text-indigo-400 hover:text-indigo-300"><i className="fas fa-arrow-left mr-1"/>返回</button>}</div>
                  <p className="text-white/90 leading-relaxed">{curScenario.stem}</p>
                  {followupHint && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300"><i className="fas fa-arrow-turn-down mr-1"/> {followupHint}</div>}
                  <textarea ref={openRef} key={`s${store.scenarioIndex}`} rows={4} placeholder={curScenario.input_hint || '请描述你的做法和理由...'} className="w-full p-3 rounded bg-white/5 border border-white/10 text-white text-sm resize-none" />
                  <button onClick={() => { const el = openRef.current; if (el?.value.trim()) handleScenarioAnswer(el.value.trim()); }} disabled={loading} className="w-full py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm disabled:opacity-30 transition-all">提交回答</button>
                </div>
              )}
              {phase === 'open' && OPEN_QUESTIONS[store.openIndex] && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-white/5 border-emerald-500/20' : 'bg-white border-emerald-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between text-xs"><span className="text-emerald-400">{OPEN_QUESTIONS[store.openIndex].category} · {store.openIndex + 1}/{OPEN_QUESTIONS.length}</span>{store.openIndex > 0 && <button onClick={store.goBack} className="text-indigo-400 hover:text-indigo-300"><i className="fas fa-arrow-left mr-1"/>返回</button>}</div>
                  <p className="text-white/90">{OPEN_QUESTIONS[store.openIndex].stem}</p>
                  {followupHint && <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300"><i className="fas fa-arrow-turn-down mr-1"/> {followupHint}</div>}
                  <textarea ref={openRef} key={`o${store.openIndex}`} rows={3} placeholder={OPEN_QUESTIONS[store.openIndex].input_hint || '自由回答...'} className="w-full p-3 rounded bg-white/5 border border-white/10 text-white text-sm resize-none" />
                  <button onClick={() => { const el = openRef.current; if (el?.value.trim()) handleOpenAnswer(el.value.trim()); }} disabled={loading} className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-30 transition-all">提交</button>
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
      {tookGaokao === true && phase === 'recommend' && store.recommendation && (
        <div id="recommend-root" className="overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="max-w-5xl mx-auto p-3 sm:p-4 pb-20 space-y-4">
            <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 rounded-xl p-5 text-center"><h2 className="text-xl font-bold text-white">测评完成</h2><div className="mt-2"><span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${store.recommendation.confidence_breakdown.total >= 70 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>置信度 {store.recommendation.confidence_breakdown.total}%</span></div></div>

            {/* 3D Universe */}
            <div className="scene-box" style={{ height: '320px' }}>
              <UniverseScene majors={store.matchedMajors} onMajorClick={setSelectedMajor} />
            </div>
            <p className="text-xs text-white/30 text-center -mt-2">拖拽旋转 · 滚轮缩放 · 点击球体查看专业详情 · 距离越近匹配度越高</p>

            {store.recommendation.personality_sketch && (
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'}`}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><i className="fas fa-user-astronaut text-indigo-400" /> 人物侧写</h3>
                <p className="text-sm leading-relaxed text-white/70">{store.recommendation.personality_sketch}</p>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} lg:col-span-1`}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><i className="fas fa-user-astronaut text-indigo-400" /> 人物侧写</h3>
                <p className="text-sm leading-relaxed text-white/70">{store.recommendation.personality_sketch}</p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'} lg:col-span-2`}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><i className="fas fa-arrows-left-right text-purple-400" /> 认知倾向四轴</h3>
                <PersonalityAxes axes={store.recommendation.personality_axes} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}><h3 className="text-sm font-bold mb-3"><i className="fas fa-chart-bar text-indigo-400 mr-2" />能力画像</h3><ProfileBars p={profile} /></div>
              <div className={`p-4 rounded-xl border overflow-y-auto max-h-96 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <h3 className="text-sm font-bold mb-3"><i className="fas fa-trophy text-amber-400 mr-2" />Top 5 推荐专业</h3>
                <div className="space-y-3">{store.recommendation!.top_majors.map((m, i) => <div key={m.major.id} onClick={() => setSelectedMajor(m.major)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedMajor?.id === m.major.id ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-white/10 hover:border-white/30'}`}><div className="flex justify-between items-center"><span className="text-white font-semibold text-sm">{i + 1}. {m.major.name}</span><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{m.final_score}分</span></div><div className="h-1 bg-white/10 rounded-full mt-2"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${m.final_score}%` }} /></div><div className="mt-2 text-xs text-white/40">{m.major.tags.join(' · ')}</div>{store.recommendation!.future_paths?.[m.major.name] && <div className="mt-2 p-2 rounded bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed"><i className="fas fa-route mr-1 text-indigo-400" /> {store.recommendation!.future_paths[m.major.name]}</div>}</div>)}</div>
              </div>
            </div>
            {store.recommendation.conflicts.length > 0 && <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4"><h3 className="text-sm font-bold text-amber-300 mb-2">冲突点</h3>{store.recommendation.conflicts.map((c, i) => <div key={i} className="text-xs text-white/50 mb-1"><span className="text-amber-400">{c.type}</span>：{c.explanation}</div>)}</div>}
            <div className={`p-4 rounded-xl border flex gap-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}><i className="fas fa-comment-dots text-indigo-400" /> <p className="text-white/60 text-sm">{store.recommendation.final_note || '综合能力画像和专业匹配度，以上推荐供参考。'}</p></div>
            <div className="flex gap-3">
              <button onClick={handleExport} disabled={loading} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-50">
                <i className="fas fa-camera mr-2" />导出报告PNG
              </button>
              <button onClick={handleRestart} className="flex-1 py-3 rounded-lg border border-white/20 text-white/60 hover:bg-white/10 transition-all text-sm">重新测评</button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast — shows regardless of phase */}
      {store.errors.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 rounded-xl p-4 max-w-md">
          {store.errors.map((e, i) => <p key={i} className="text-red-200 text-sm">{e}</p>)}
          <button onClick={store.clearErrors} className="mt-2 text-xs text-red-400 hover:text-red-300">关闭</button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center"><div className="flex items-center gap-3 text-white/70"><i className="fas fa-spinner fa-spin text-2xl text-indigo-400" />AI分析中...</div></div>}

      {/* Restart confirmation modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowRestartConfirm(false)}>
          <div className={`p-6 rounded-xl border max-w-sm mx-4 ${isDark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-zinc-200'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2"><i className="fas fa-triangle-exclamation text-amber-400 mr-2" />确认返回首页？</h3>
            <p className="text-sm text-white/50 mb-4">当前所有测评进度将会丢失，确定要重新开始吗？</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowRestartConfirm(false); handleRestart(); setTookGaokao(null); }} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold">确定返回</button>
              <button onClick={() => setShowRestartConfirm(false)} className="flex-1 py-2 rounded-lg border border-white/20 text-white/60 hover:bg-white/10 text-sm">取消</button>
            </div>
          </div>
        </div>
      )}

      <Particles />
    </div>
  );
};

export default App;
