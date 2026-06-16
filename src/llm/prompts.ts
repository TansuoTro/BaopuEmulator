import { UserProfile, GaokaoInfo } from '../types';

export const SYSTEM_PROMPT = `你是专业测评引擎，只输出JSON。

核心规则:
- 只分析思维结构（多因分析/条件推理/权衡/反例/概念边界/拆解/抽象耐受），不评价观点对错
- 不把知识储备当批判思维，不把立场当能力
- 强批判专业(纯理学+形而上人文社科)、弱批判专业(应用学科)

出题: 每题一个分歧点，选项互斥4~5个。置信度够高不重复。

情景题: 生成4道沉浸式填空题，真实冲突场景，问"你会怎么做？为什么？"

推荐规则(2025数据):
- 升学:电子/AI/计算机/机械/材料化工/生物医药/会计/统计/数字经济
- 教学:语→汉语言,数→数学,英→英语,物→物理,化→化学,生→生物,地→地理,史→历史
- 考公T1:法学/财税/会计/统计/经济/汉语言/计算机 T2:金融/新闻/公管/政治学/工商管理
- 求职:电子/计算机/自动化/机械/金融/会计/软工/数据科学/数字媒体
- 灵活就业:设计/数字媒体/新闻/工商管理/计算机
- 不清楚:根据分数排名+画像+专业特征给明确去向建议

推荐按score降序，用中国本科标准专业名。`;

/* ── Dynamic question generation (V5: AI-driven disambiguation) ── */
export function buildDynamicPrompt(profile: UserProfile, conflicts: { type: string; severity: string; dimensions: string[]; explanation: string }[], history: string[]): string {
  // Find dimensions with highest uncertainty (closest to 50)
  const allDims = Object.entries(profile as unknown as Record<string, number>)
    .filter(([,v]) => v > 30 && v < 70)
    .sort(([,a], [,b]) => Math.abs(a - 50) - Math.abs(b - 50))
    .slice(0, 10);
  const uncertain = allDims.map(([k, v]) => `${k}=${v}`).join(', ');

  return JSON.stringify({
    task: 'generate_5_disambiguation_questions',
    instruction: `你是消歧题生成器。用户的18题基础画像已完成，但以下维度置信度不足(接近50分，最不确定): ${uncertain}。
现有冲突: ${conflicts.map(c => `${c.type}(${c.severity}): ${c.explanation}`).join('; ') || '无'}。
你需要生成5道选择题，每道题精确打击一个不确定维度。

生成原则:
- 每道题只针对一个置信度最低的维度，题目和选项必须能明确区分该维度的高低
- 如果两个维度存在冲突(如math高但persistence低)，优先出能区分这两者的题
- 题型为4选1或5选1选择题，选项互斥，覆盖面广
- 题目生活化、高中生能理解，不要学术腔
- 不要重复问固定题已经问过的维度: ${history.join(', ')}`,
    uncertain_dimensions: uncertain,
    conflicts,
    previously_tested: history,
    required_count: 5,
    output_format: '{"questions":[{"type":"question","question_id":"D01","question_type":"choice","target_discrimination":["math","logic"],"stem":"...","options":[{"key":"A","text":"..."}],"option_scores":{"A":{"math":75,"logic":70},"B":{"math":55,"logic":50},"C":{"math":35,"logic":30},"D":{"math":15,"logic":10}},"expected_signal":"区分数学能力"}]}',
    important: '每个选项必须附带option_scores字段，映射到target_discrimination中的维度，分值0~100。option_scores用于评分回退。',
  });
}

export function buildScenarioPrompt(profile: UserProfile, _history: string[], gaokao: { province: string; total_score: number; gaokao_type: string; math: number; chinese: number; elective: string }): string {
  const s = `math:${profile.math}, language:${profile.language}, social:${profile.social}, pressure:${profile.pressure_tolerance}, creativity:${profile.creativity}, critical:${profile.critical_thinking}, rule:${profile.rule_compliance}, independent:${profile.independent_vs_team}`;
  return JSON.stringify({
    task: 'generate_scenario_questions',
    instruction: `根据用户画像生成4道完全不同的沉浸式情景填空题。不要用示例题！

用户画像: ${s}
高考: ${gaokao.province}/${gaokao.total_score}分/${gaokao.gaokao_type}/数学${gaokao.math}/语文${gaokao.chinese}/${gaokao.elective}

要求:
- 真实冲突场景，问"你会怎么做？为什么？"
- 根据画像定制: 数学强→数据逻辑冲突，社交强→人际场景，批判高→价值观困境，抗压低→不要高压题
- 4道题类型必须不同(时间压力/道德困境/人际冲突/价值判断/资源分配等)
- 填空格式，不给选项`,
    output_format: '{"questions":[{"type":"question","question_id":"S01","question_type":"fill","sub_dimension":"场景处理","stem":"...","options":[],"input_hint":"引导提示","target_discrimination":["dim1","dim2"]}]}',
  });
}

export function buildScorePrompt(profile: UserProfile, stem: string, answer: string, discDims: string[]): string {
  return JSON.stringify({
    task: 'score_dynamic_answer',
    current_profile: profile,
    question_stem: stem,
    answer,
    target_dimensions: discDims,
    instruction: '根据回答更新目标维度的分数(0~100)。只返回受影响维度。',
    output_format: '{"updated_profile":{"dim":value}}',
  });
}

export function buildScenarioScorePrompt(profile: UserProfile, stem: string, answer: string): string {
  return JSON.stringify({
    task: 'score_scenario_answer',
    current_profile: profile,
    scenario_stem: stem,
    user_answer: answer,
    instruction: '判断回答质量。太短(<15字)→{"needs_followup":true,"followup_prompt":"具体追问"}。足够→分析人格倾向，更新受影响维度(0~100): social/emotion_stability/decision_confidence/pressure_tolerance/rule_compliance/critical_thinking/independent_vs_team。',
    output_format: '回答不足:{"needs_followup":true,"followup_prompt":"..."} 充分:{"needs_followup":false,"updated_profile":{"social":65},"analysis":"..."}',
  });
}

export function buildOpenTagsPrompt(stem: string, answer: string): string {
  return JSON.stringify({
    task: 'extract_tags',
    question: stem,
    answer,
    instruction: '判断质量。太短→{"needs_followup":true,"followup_prompt":"追问"}。足够→提取3~5个思维标签: multi_factor/conditional_reasoning/tradeoff_analysis/counterexample_awareness/concept_boundary/abstraction_tolerance/problem_decomposition/deductive_preference/inductive_preference。',
    output_format: '不足:{"needs_followup":true,"followup_prompt":"..."} 充分:{"needs_followup":false,"tags":["..."]}',
  });
}

export function buildRecommendPrompt(
  profile: UserProfile,
  eligibleMajors: { name: string; code: string; category: string; cosine_score: number; tags: string[] }[],
  conflicts: { type: string; severity: string; explanation: string }[],
  confidence: { total: number; completion: number; dimension_coverage: number },
  openAnswers: Record<string, string>,
  scenarioAnswers: Record<string, string>,
  gaokao: GaokaoInfo,
): string {
  return JSON.stringify({
    task: 'recommend',
    final_profile: profile,
    eligible_majors_top10: eligibleMajors.slice(0, 10),
    conflicts,
    confidence,
    open_answers: Object.entries(openAnswers).map(([id, ans]) => ({ id, answer: ans })),
    scenario_answers: Object.entries(scenarioAnswers).map(([id, ans]) => ({ id, answer: ans })),
    gaokao: {
      year: gaokao.year, province: gaokao.province, total: gaokao.total_score, rank: gaokao.provincial_rank,
      type: gaokao.gaokao_type, chinese: gaokao.chinese, math: gaokao.math, english: gaokao.english,
      composite: gaokao.composite_score, elective: gaokao.elective_subjects.map(s => `${s.name}${s.score}`).join(','),
      target_provinces: gaokao.target_provinces, career_intention: gaokao.career_intention,
    },
    instruction: `毕业意向="${gaokao.career_intention}"。高考:${gaokao.province}/${gaokao.total_score}分/排名${gaokao.provincial_rank||'?'}。

输出:
(1) personality_sketch — 3~5句侧写
(2) personality_axes — 接受vs怀疑/保守vs激进/经验vs知识/权威vs独立, 各0~100
(3) top_majors — Top5按score降序。每个专业必须有future_path字段，根据毕业意向+分数+排名+选科分析:
  考公→"本专业考公岗位较多(XX部门/XX局)，建议大三备考"
  升学→"本专业建议优先升学→XX方向→研究生后进入XX领域"
  求职→"本专业就业面广，可投XX行业，大二开始实习"
  灵活就业→"本专业适合自由职业/创业，结合XX建立品牌"
  不清楚→根据竞争力判断给出最合理去向
(4) final_note`,
    output_format: '{"personality_sketch":"...","personality_axes":{"接受vs怀疑":55,"保守vs激进":40,"经验vs知识":70,"权威vs独立":65},"top_majors":[{"major_name":"计算机科学与技术","score":88,"match_reason":["数学强"],"future_path":"优先升学→AI研究生→算法工程师","risk":["压力大"]}],"final_note":"..."}',
  });
}
