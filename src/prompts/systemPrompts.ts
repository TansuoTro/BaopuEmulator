import { UserProfile, Conflict, GaokaoInfo } from '../types';

export const SYSTEM_PROMPT = `你是一个严格的教育测评与专业推荐引擎。
你必须只输出JSON，不能输出任何额外文本。
你不能编造不存在的中国本科专业。
你必须根据用户画像生成最有区分度的题目，或在信息足够时给出Top 5专业推荐。

中国本科专业分为"强批判专业"和"弱批判专业"两类：
- 强批判专业（纯理学+形而上人文社科）：数学、物理、化学、统计、AI、心理学、历史学、经济学、汉语言文学——核心特征为形而上追问、深度质疑
- 弱批判专业（应用学科）：法学、工学、医学、管理学、会计学、金融学、英语、设计——核心特征为应用既定框架和规则

出题原则：
- 每题只打一个主要分歧点
- 选项必须互斥
- 每题只服务一个推荐判别
- 若置信度已高，不再重复同类题
- 选择题4~5个选项
- 可以偶尔用填空题收集细节

输出格式：
- 生成题目时返回 type="question"
- 评分时返回 type="score"
- 推荐时返回 type="recommend"
- 出错时返回 type="error"

=== 题目生成 ===
{
  "type": "question",
  "question_id": "D01",
  "question_type": "choice",
  "dimension": "ability",
  "sub_dimension": "math",
  "difficulty": 3,
  "stem": "题目文本",
  "options": [{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],
  "input_hint": "",
  "expected_signal": "本题区分数学能力强弱",
  "stop_condition": "当主要维度置信度均>70时可结束"
}

=== 评分 ===
{
  "type": "score",
  "updated_profile": {"math":70,"spatial":60,...},
  "conflicts": [{"dimension":"math","reason":"固定题和动态题分数矛盾","severity":"medium"}],
  "next_best_dimensions": ["social","creativity"],
  "continue_assessment": true
}

=== 推荐 ===
{
  "type": "recommend",
  "summary": {"confidence":78,"profile_keywords":["数理强","独立性强","批判思维"]},
  "top_majors": [
    {
      "major_name":"计算机科学与技术",
      "score":88,
      "match_reason":["数学能力强","编程兴趣高","逻辑分析突出"],
      "risk":["可能需要更多团队协作","长期高压力"],
      "suitable_for":["喜欢独立解决问题","对数理逻辑有信心"],
      "not_suitable_for":["偏好纯人文环境","不喜欢抽象思维"]
    }
  ],
  "conflicts": [{"dimension":"social","impact":"社交偏好与部分工学专业的协作要求有冲突","suggestion":"可考虑软件工程等更重团队协作的工学方向"}],
  "next_questions_if_needed": ["你对团队项目的真实态度是什么？"],
  "final_note": "综合来看你适合数理逻辑密集型专业，建议优先考虑工学方向"
}

所有输出必须符合上述JSON结构，top_majors必须按score从高到低排序。
如果信息不足，优先继续出题，不要过早下结论。`;

export function buildDynamicPrompt(
  profile: UserProfile,
  conflicts: Conflict[],
  history: string[],
): string {
  return JSON.stringify({
    task: 'generate_dynamic_questions',
    instruction: '根据用户画像和已测信息，生成5道最有区分度的选择题。每道题只打一个主要分歧点。由于使用了json_object模式，你必须将题目列表放在一个对象内返回。',
    user_profile: profile,
    conflicts: conflicts.map((c) => ({ dimension: c.dimension, reason: c.reason, severity: c.severity })),
    previously_asked_topics: history,
    required_count: 5,
    output_format: '必须返回如下格式: {"questions": [{"type":"question","question_id":"D01","question_type":"choice","dimension":"ability","sub_dimension":"math","difficulty":3,"stem":"题干","options":[{"key":"A","text":"选项A"},{"key":"B","text":"选项B"},{"key":"C","text":"选项C"},{"key":"D","text":"选项D"}],"input_hint":"","expected_signal":"区分数学倾向","stop_condition":""}]}',
    important: '必须返回一个JSON对象，其中questions字段是一个包含5个question对象的数组。不要返回顶层数组！',
  });
}

export function buildScorePrompt(
  profile: UserProfile,
  questionStem: string,
  answer: string,
  subDimension: string,
): string {
  return JSON.stringify({
    task: 'score_dynamic_answer',
    current_profile: profile,
    question: { stem: questionStem, sub_dimension: subDimension },
    answer,
    instruction: '根据回答更新画像中对应维度分数，不要改动不相关维度',
  });
}

export function buildOpenTagsPrompt(questionStem: string, answer: string, dimension: string): string {
  return JSON.stringify({
    task: 'extract_tags',
    question_dimension: dimension,
    question: questionStem,
    answer,
    instruction: '从回答中提取最多3个标签，标签为简短的描述性短语（如"偏好独立学习""倾向动手实践""抗压能力强"），不要打分',
    output_format: '{"tags":["tag1","tag2","tag3"]}',
  });
}

export function buildRecommendPrompt(
  profile: UserProfile,
  matchedMajors: { major_name: string; score: number }[],
  conflicts: { dimension: string; reason: string }[],
  confidence: number,
  openAnswers: Record<string, string>,
  gaokaoInfo: GaokaoInfo,
): string {
  return JSON.stringify({
    task: 'recommend',
    final_profile: profile,
    code_matched_top10: matchedMajors.slice(0, 10),
    conflicts,
    confidence_level: confidence,
    open_question_answers: Object.entries(openAnswers).map(([id, ans]) => ({ id, answer: ans })),
    gaokao_data: {
      year: gaokaoInfo.year,
      province: gaokaoInfo.province,
      total_score: gaokaoInfo.total_score,
      provincial_rank: gaokaoInfo.provincial_rank,
      gaokao_type: gaokaoInfo.gaokao_type,
      subjects: {
        chinese: gaokaoInfo.chinese,
        math: gaokaoInfo.math,
        english: gaokaoInfo.english,
        composite_score: gaokaoInfo.composite_score,
        elective: gaokaoInfo.elective_subjects,
      },
      target_provinces: gaokaoInfo.target_provinces,
    },
    instruction: '综合用户画像、高考成绩、选科、排名和目标省份，输出Top 5专业推荐。高考成绩高+数学强→推荐高要求工科/理学；语文英语强→推荐文科/法学/外语；选科偏向→对应学科门类。必须考虑省份和排名因素。top_majors必须按score从高到低严格排序。所有专业名必须使用中国本科标准名称。每个专业必须结合高考数据给出具体解释。',
  });
}
