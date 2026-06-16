import { UserProfile, GaokaoInfo } from '../types';

export const SYSTEM_PROMPT = `你是一个严格的教育测评与专业推荐引擎。你必须只输出JSON，不能输出任何额外文本。

中国本科专业分为"强批判专业"（纯理学+形而上人文社科，需要深度质疑和抽象思辨）和"弱批判专业"（应用学科，依赖既有知识体系）。

出题原则：每题只打一个主要分歧点、选项互斥、4~5个选项、选择题或填空题。若置信度已高不再重复同类题。

情景题（scenario）出题原则：
- 生成4道沉浸式复杂情景题，考察临场发挥、人际关系处理和人格倾向
- 题目风格为简中互联网常见的"逆天问题"，场景要真实、代入感强、有道德/社交/压力等多重冲突
- 每道题描述一个具体冲突场景，让用户回答"你会怎么做？为什么？"
- 每题只测一个主要人格维度，选项4~5个且互斥，覆盖真实情境中的典型反应

推荐时必须按score从高到低排序，使用中国本科标准专业名称。`;

export function buildScenarioPrompt(profile: UserProfile, history: string[]): string {
  return JSON.stringify({
    task: 'generate_scenario_questions',
    instruction: '生成4道沉浸式复杂情景题，考察临场发挥、人际关系和人格倾向。题目风格要像简中互联网"逆天问题"——场景真实、代入感强、有道德/社交/压力冲突。每道题描述一个具体冲突场景，问"你会怎么做？为什么？"，4~5个选项覆盖典型反应。',
    current_profile: profile,
    previously_tested: history,
    required_count: 4,
    example_scenarios: [
      { stem: '你同时接到三个任务：A导师让你明天交一份你完全不会的数据分析报告，B室友让你帮他改简历今晚就要，C你自己下周一有个重要考试还没复习。你怎么安排？', options: [{ key: 'A', text: '先应付导师，随便交一份过得去的' }, { key: 'B', text: '拒绝室友，专注自己的事' }, { key: 'C', text: '熬夜全部做完，宁可牺牲睡眠' }, { key: 'D', text: '找其他人帮忙分担一部分' }, { key: 'E', text: '跟导师说实话申请延期' }] },
      { stem: '你们小组项目拿了奖，但你从别人嘴里听到：组长把你的核心贡献归到了他自己名下，你不在场时他跟老师汇报的。大家都在恭喜组长，没人在意你。你会怎么做？', options: [{ key: 'A', text: '私下找组长摊牌，要求他澄清' }, { key: 'B', text: '直接在群里公开事实，让所有人知道' }, { key: 'C', text: '忍了，以后不跟这个人合作就行' }, { key: 'D', text: '找老师单独说明情况' }, { key: 'E', text: '无所谓，谁汇报都一样，学到东西就行' }] },
      { stem: '实习时你发现带你的导师在系统里留了一个后门，他说"以前的人都有，方便调试"。他觉得你大惊小怪，让你别管。但你知道这不符合安全规范。他人很好，教了你很多东西，你正需要他的推荐信。你怎么处理？', options: [{ key: 'A', text: '上报公司安全部门，职业操守第一' }, { key: 'B', text: '不管了，导师说得对，别多管闲事' }, { key: 'C', text: '私下再跟导师沟通一次，摆明利弊' }, { key: 'D', text: '匿名举报，不给导师知道是你' }, { key: 'E', text: '做好技术记录，留一手，毕业再说' }] },
      { stem: '朋友圈里有人转了一篇文章，观点你强烈反对，甚至觉得在误导大家。底下几十条评论全是赞同，没有人提出异议。你和这个人平时关系一般，但有一些共同好友。你会公开表达反对意见吗？', options: [{ key: 'A', text: '公开评论反对，冷静列举事实' }, { key: 'B', text: '私下发消息给ta表达看法' }, { key: 'C', text: '自己也写一篇长文发出去' }, { key: 'D', text: '不公开说，跟几个亲近的朋友单独讨论' }, { key: 'E', text: '完全不管，没必要跟这些人较真' }] },
    ],
    dimension_mapping: {
      question_1: 'pressure_tolerance, decision_confidence, social',
      question_2: 'emotion_stability, social, rule_compliance',
      question_3: 'critical_thinking, rule_compliance, emotion_stability',
      question_4: 'social, independent_vs_team, emotion_stability',
    },
    output_format: '{"questions": [{"type":"question","question_id":"S01","question_type":"choice","dimension":"personality","sub_dimension":"场景处理","stem":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."},{"key":"E","text":"..."}],"input_hint":"","expected_signal":"区分X倾向"}]}',
    important: '必须返回一个JSON对象，questions字段是包含4个题目的数组。每个题目的选项必须是该场景下真实合理的5种典型反应，不能敷衍。',
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
    instruction: '综合所有数据（画像、高考、毕业意向、开放回答、情景题回答），输出：(1) personality_sketch——用3~5句话给用户一个精准的人物侧写，描述ta是什么样的人、核心特质、适合的环境类型、潜在短板；(2) top_majors——Top 5专业推荐，按score从高到低排序，每个专业给出match_reason(结合高考数据、画像和毕业意向)、risk、suitable_for、not_suitable_for；(3) 毕业意向为求职则优先推荐就业率高的专业，升学则优先推荐学术深造路径清晰的专业，考公则结合专业考公优势分析，灵活就业则关注专业的自主性和市场需求；(4) final_note——一句话结论。output_format: {"type":"recommend","personality_sketch":"...","top_majors":[...],"final_note":"..."}',
  });
}
