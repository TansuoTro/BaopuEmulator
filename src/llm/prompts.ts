import { UserProfile, GaokaoInfo } from '../types';

export const SYSTEM_PROMPT = `你是一个严格的认知测评与专业推荐引擎。你必须只输出JSON，不能输出任何额外文本。

核心原则：
- 你只分析思维结构（多因分析、条件推理、权衡、反例意识、概念边界、问题拆解、抽象耐受），不评价观点对错
- 你不对用户的价值观、政治立场、道德判断做任何评价
- 你不能把"支持某个观点"当成"更有思维能力"或"更适合某个专业"
- 你不能把"知识储备"误判成"批判思维"

中国本科专业分为"强批判专业"（纯理学+形而上人文社科）和"弱批判专业"（应用学科）。

出题原则：每题只打一个主要分歧点、选项互斥、4~5个选项。若置信度已高不再重复同类题。

情景题出题原则：生成4道沉浸式复杂情景填空题，场景真实、有冲突，问"你会怎么做？为什么？"，让用户自由输入文字。

=== 毕业意向 × 专业推荐规则（2025研招/考公/教师数据）===

【升学优先】电子信息、AI、计算机、机械、材料与化工、生物与医药、会计、统计、数字经济等研招计划大或扩招增量大。
【教学优先】语文→汉语言/学科教学(语文)，数学→数学与应用数学，英语→英语，物理→物理学，化学→化学，生物→生物科学，地理→地理科学，历史→历史学。
【考公优先】Tier1: 法学/财税/会计/统计/经济/汉语言/计算机。Tier2: 金融/新闻/公共管理/政治学/工商管理。
【求职优先】电子/计算机/自动化/机械/金融/会计/软件工程/数据科学/数字媒体。
【灵活就业优先】设计/数字媒体/新闻/工商管理/计算机。
【不清楚】AI根据高考分数+省排名+选科+画像+专业特征，为每个Top5专业给出明确去向建议。

推荐时按score从高到低排序，使用中国本科标准专业名称。`;

export function buildScenarioPrompt(profile: UserProfile, history: string[], gaokao: { province: string; total_score: number; gaokao_type: string; math: number; chinese: number; elective: string }): string {
  const profileSummary = `math:${profile.math}, language:${profile.language}, social:${profile.social}, pressure:${profile.pressure_tolerance}, creativity:${profile.creativity}, critical:${profile.critical_thinking}, rule:${profile.rule_compliance}, independent:${profile.independent_vs_team}`;
  return JSON.stringify({
    task: 'generate_scenario_questions',
    instruction: `你是情景题生成器。根据用户画像和高考背景，生成4道完全不同的沉浸式复杂情景填空题。绝对不要使用任何示例题！每道题必须是全新的、根据下面profile定制的场景。

用户画像：${profileSummary}
高考背景：${gaokao.province}考生，${gaokao.gaokao_type}，总分${gaokao.total_score}，数学${gaokao.math}，语文${gaokao.chinese}，选科${gaokao.elective}

出题要求：
- 场景要真实、代入感强、有道德/社交/压力/价值观冲突
- 每道题问"你会怎么做？为什么？"
- 题目必须根据画像定制：数学强→涉及数据/逻辑的冲突，社交强→人际复杂场景，抗压低→不要出高压题，批判强→价值立场冲突
- 4道题的场景类型必须不同（不能4道都是人际冲突，要混合：时间压力、道德困境、社交冲突、价值判断等）
- 不要用选择题格式，不要给选项`,
    current_profile: profile,
    previously_tested: history,
    required_count: 4,
    output_format: '{"questions": [{"type":"question","question_id":"S01","question_type":"fill","dimension":"personality","sub_dimension":"场景处理","stem":"...","options":[],"input_hint":"引导用户详细回答的提示...","expected_signal":"区分X倾向","target_discrimination":["dim1","dim2"]}]}',
    critical: '必须根据用户画像定制！绝对不要复制任何示例！如果数学高就出数据分析相关的冲突场景，如果社交高就出复杂人际关系场景，如果批判思维高就出价值观冲突场景。',
  });
}

export function buildScenarioScorePrompt(profile: UserProfile, stem: string, answer: string): string {
  return JSON.stringify({
    task: 'score_scenario_answer',
    current_profile: profile,
    scenario_stem: stem,
    user_answer: answer,
    instruction: '分析用户在复杂情景中的反应，更新以下人格维度的分数(0~100)：social(社交倾向)、emotion_stability(情绪稳定性)、decision_confidence(决策果断度)、pressure_tolerance(抗压能力)、rule_compliance(规则意识)、critical_thinking(批判思维)、independent_vs_team(独立vs协作)。只返回受影响的维度，不要动其他维度。返回updated_profile。',
    output_format: '{"type":"score","updated_profile":{"social":65,"emotion_stability":70,"decision_confidence":55},"analysis":"一句话分析"}',
  });
}

export function buildDynamicPrompt(profile: UserProfile, conflicts: { type: string; severity: string; dimensions: string[]; explanation: string }[], history: string[]): string {
  return JSON.stringify({
    task: 'generate_dynamic_questions',
    instruction: '生成5道最有信息增益的选择题/填空题，每道题只打一个主要分歧点，用于消除画像中的歧义。必须返回JSON对象，questions字段包含5个题目。',
    current_profile: profile,
    conflicts,
    previously_tested_topics: history,
    required_count: 5,
    output_format: '{"questions": [{"type":"question","question_type":"choice","target_discrimination":["dimA","dimB"],"stem":"题干","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"input_hint":"","expected_signal":"区分X与Y"}]}',
  });
}

export function buildScorePrompt(profile: UserProfile, stem: string, answer: string, discDims: string[]): string {
  return JSON.stringify({
    task: 'score_dynamic_answer',
    current_profile: profile,
    question_stem: stem,
    answer,
    discrimination_dimensions: discDims,
    instruction: '根据回答，为每个discrimination_dimensions输出0~100的分数，返回updated_profile中只包含受影响的维度，不要碰其他维度。',
    output_format: '{"type":"score","updated_profile":{"dim":value,...},"continue_assessment":true}',
  });
}

export function buildOpenTagsPrompt(stem: string, answer: string): string {
  return JSON.stringify({
    task: 'extract_tags',
    question: stem,
    answer,
    instruction: '从回答中提取3~5个描述性标签，如"independent_study""project_based""high_intrinsic""research_interest""practical_orientation""leadership""quiet_independent""active_collaborative""plan_and_execute""seek_help"',
    output_format: '{"tags":["tag1","tag2","tag3"]}',
  });
}

export function buildRecommendPrompt(
  profile: UserProfile,
  eligibleMajors: { name: string; code: string; category: string; cosine_score: number; tags: string[] }[],
  conflicts: { type: string; severity: string; explanation: string }[],
  confidence_breakdown: { total: number; completion: number; dimension_coverage: number },
  openAnswers: Record<string, string>,
  scenarioAnswers: Record<string, string>,
  gaokaoInfo: GaokaoInfo,
): string {
  return JSON.stringify({
    task: 'recommend',
    final_profile: profile,
    eligible_majors_top10: eligibleMajors.slice(0,10),
    conflicts,
    confidence: confidence_breakdown,
    open_answers: Object.entries(openAnswers).map(([id,ans])=>({id,answer:ans})),
    scenario_answers: Object.entries(scenarioAnswers).map(([id,ans])=>({id,answer:ans})),
    gaokao_data: {
      year: gaokaoInfo.year, province: gaokaoInfo.province, total_score: gaokaoInfo.total_score,
      provincial_rank: gaokaoInfo.provincial_rank, gaokao_type: gaokaoInfo.gaokao_type,
      chinese: gaokaoInfo.chinese, math: gaokaoInfo.math, english: gaokaoInfo.english,
      composite: gaokaoInfo.composite_score, elective: gaokaoInfo.elective_subjects,
      target_provinces: gaokaoInfo.target_provinces,
      career_intention: gaokaoInfo.career_intention,
    },
    instruction: `毕业意向="${gaokaoInfo.career_intention}"。综合所有数据输出：(1)personality_sketch；(2)personality_axes——基于用户的所有回答（特别是情景题和开放题的文本内容），为以下4个对立维度打分(0~100，50=平衡)：接受vs怀疑(0=完全接受他人观点,100=习惯性质疑和批判)、保守vs激进(0=极度保守求稳,100=极度激进冒险)、经验vs知识(0=完全依赖个人经验,100=完全依赖系统知识/理论)、权威vs独立(0=完全听从权威和规则,100=完全独立自主决定)；(3)top_majors—Top5按score降序，每专业给match_reason、future_path(根据毕业意向+每个维度的打分去分析+高考数据)；(4)final_note。output_format:{"type":"recommend","personality_sketch":"...","personality_axes":{"接受vs怀疑":55,"保守vs激进":40,"经验vs知识":70,"权威vs独立":65},"top_majors":[...],"final_note":"..."}`,
  });
}
