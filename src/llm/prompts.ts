import { UserProfile, GaokaoInfo } from '../types';

export const SYSTEM_PROMPT = `你是一个严格的教育测评与专业推荐引擎。你必须只输出JSON，不能输出任何额外文本。

中国本科专业分为"强批判专业"（纯理学+形而上人文社科，需要深度质疑和抽象思辨）和"弱批判专业"（应用学科，依赖既有知识体系）。

出题原则：每题只打一个主要分歧点、选项互斥、4~5个选项、选择题或填空题。若置信度已高不再重复同类题。

情景题（scenario）出题原则：
- 生成4道沉浸式复杂情景题，考察临场发挥、人际关系处理和人格倾向
- 题目风格为简中互联网常见的"逆天问题"，场景要真实、代入感强、有道德/社交/压力等多重冲突
- 每道题描述一个具体冲突场景，让用户回答"你会怎么做？为什么？"
- 每题只测一个主要人格维度，选项4~5个且互斥，覆盖真实情境中的典型反应

推荐时必须按score从高到低排序，使用中国本科标准专业名称。

=== 毕业意向 × 专业推荐规则（2025研招/考公/教师数据） ===

【升学 优先推荐】电子信息、人工智能、计算机技术、机械、材料与化工、生物与医药、会计、公共管理、工商管理、数字经济、应用统计、法律（法学）、资源与环境、智能科学与技术。这些专业要么研招计划大，要么近年扩招增量大。
- 注：生物类、化学类、材料类、环境类及部分基础理科"不读研很难找好工作"，研招端仍在扩招，推荐时需提示学历门槛。

【教学 优先推荐】学科对口：语文→汉语言文学/学科教学(语文)，数学→数学与应用数学/学科教学(数学)，英语→英语/学科教学(英语)，物理→物理学，化学→化学，生物→生物科学，地理→地理科学，历史→历史学，道法/政治→思想政治教育/政治学，信息技术→计算机/教育技术，心理健康→心理学/应用心理。教育学类、课程与教学论在教师招聘中广泛认可。需提示教师资格证要求。

【考公 优先推荐】第一梯队（岗位覆盖面最广）：法学、财政学/税收学、会计学/审计学、统计学、经济学、汉语言文学、计算机科学与技术。第二梯队：金融学、新闻传播学、公共管理/行政管理、政治学、工商管理。推荐时需提示：法考（法学）、CPA/税务师（财会类）等证书重要性。

【求职 优先推荐】电子信息类、计算机类、自动化类、机械类、金融学、会计学、软件工程、数据科学、数字媒体技术——这些就业面广、行业需求稳定。

【灵活就业/创业 优先推荐】设计学类、数字媒体技术、新闻学、工商管理、计算机类——专业性+自主性强。

【不清楚 系统分析】当用户毕业意向选择"不清楚"时，你必须在future_path中根据ta的高考分数、省排名、选科组合、画像向量和匹配专业，为每个Top5专业给出最合理的毕业去向建议（考公/升学/求职/灵活就业四选一，不能含糊），并解释为什么。例如"你的数学成绩优秀(XX分)+画像批判思维强+省排名前X%，本专业建议优先升学→研究生方向→未来可进入XX领域"。`;

export function buildScenarioPrompt(profile: UserProfile, history: string[]): string {
  return JSON.stringify({
    task: 'generate_scenario_questions',
    instruction: '生成4道沉浸式复杂情景填空题。用户必须打字输入回答，不能用选择题。题目风格要像简中互联网"逆天问题"——场景真实、代入感强、有道德/社交/压力冲突。每道题描述一个具体冲突场景，问"你会怎么做？为什么？"，让用户自由输入。',
    current_profile: profile,
    previously_tested: history,
    required_count: 4,
    example_scenarios: [
      '你同时接到三个任务：A导师让你明天交一份你完全不会的数据分析报告，B室友让你帮他改简历今晚就要，C你自己下周一有个重要考试还没复习。你会怎么处理这个局面？为什么这样安排？',
      '你们小组项目拿了奖，但你从别人嘴里听到组长把你的核心贡献归到了他自己名下，他不在场时跟老师汇报的。大家都在恭喜组长，没人注意到你。你会怎么做？为什么？',
      '实习时你发现带你的导师在系统里留了一个后门。他说"以前的人都有，方便调试"，让你别管。他教了你很多东西，你正需要他的推荐信。你怎么处理？说明你的考虑。',
      '朋友圈里有人转了一篇文章，观点你强烈反对，底下几十条评论全是赞同，没有人提出异议。你和ta有共同好友，关系一般。你会公开表达反对吗？为什么？',
    ],
    output_format: '{"questions": [{"type":"question","question_id":"S01","question_type":"fill","dimension":"personality","sub_dimension":"场景处理","stem":"...","options":[],"input_hint":"请描述你的做法和理由...","expected_signal":"区分X倾向"}]}',
    important: '必须返回一个JSON对象，questions字段是包含4个填空题的数组。question_type必须是"fill"，stem是场景描述+问题，input_hint引导用户详细回答。',
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
    instruction: `毕业意向="${gaokaoInfo.career_intention}"。综合所有数据输出：(1)personality_sketch；(2)top_majors—Top5按score降序。每个专业的future_path字段是重点！如果毕业意向是"不清楚"，你必须分析ta的高考分数(总分${gaokaoInfo.total_score}/省排${gaokaoInfo.provincial_rank})、选科组合、画像向量和该专业特征，给出最合理的明确去向建议(考公/升学/求职/灵活就业四选一)，附具体原因和路径。如果毕业意向已明确，则分析该意向下的可行性和替代方案；(3)final_note。output_format:{"type":"recommend","personality_sketch":"...","top_majors":[{"major_name":"...","score":...,"match_reason":[...],"future_path":"...","risk":[...]}],"final_note":"..."}`,
  });
}
