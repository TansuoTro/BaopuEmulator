export interface InterestProfile {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface PersonalityProfile {
  extraversion: number;
  conscientiousness: number;
  openness: number;
  agreeableness: number;
  neuroticism: number;
}

export type CriticalThinkingType = '强批判' | '弱批判';

export interface AbilityProfile {
  math: number;
  language: number;
  logic: number;
  spatial: number;
  programming: number;
  experiment: number;
  art: number;
  social: number;
  execution: number;
  pressure_tolerance: number;
  critical_thinking: number;
}

export interface LearningStyle {
  theory: number;
  practice: number;
  independent: number;
  teamwork: number;
  stable: number;
  changeable: number;
}

export interface UserProfile {
  interest: InterestProfile;
  personality: PersonalityProfile;
  ability: AbilityProfile;
  learning_style: LearningStyle;
}

export interface Conflict {
  dimension: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CandidateMajor {
  major_name: string;
  major_category: string;
  critical_thinking_type: CriticalThinkingType;
  skill_tags: string[];
  work_style_tags: string[];
  difficulty_tags: string[];
  job_direction: string;
}

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  type: 'question';
  question_id: string;
  question_type: 'choice' | 'fill';
  dimension: 'interest' | 'personality' | 'ability' | 'learning_style' | 'pressure' | 'social_style';
  sub_dimension: string;
  difficulty: number;
  stem: string;
  options: QuestionOption[];
  input_hint: string;
  expected_signal: string;
  stop_condition: string;
}

export interface ScoreResult {
  type: 'score';
  updated_profile: UserProfile;
  conflicts: Conflict[];
  next_best_dimensions: string[];
  continue_assessment: boolean;
}

export interface TopMajor {
  major_name: string;
  score: number;
  match_reason: string[];
  risk: string[];
  suitable_for: string[];
  not_suitable_for: string[];
}

export interface RecommendConflict {
  dimension: string;
  impact: string;
  suggestion: string;
}

export interface RecommendResult {
  type: 'recommend';
  summary: {
    confidence: number;
    profile_keywords: string[];
  };
  top_majors: TopMajor[];
  conflicts: RecommendConflict[];
  next_questions_if_needed: string[];
  final_note: string;
}

export interface ErrorResult {
  type: 'error';
  error_code: 'FORMAT_ERROR' | 'INSUFFICIENT_INFO' | 'INVALID_INPUT';
  message: string;
  need_more_info: string[];
}

export type EngineResponse = Question | ScoreResult | RecommendResult | ErrorResult;

export interface AnswerRecord {
  question_id: string;
  question: Question;
  answer: string;
  answer_confidence: number;
}

export interface AssessmentState {
  stage: 'idle' | 'asking' | 'recommend' | 'error';
  userProfile: UserProfile;
  answers: AnswerRecord[];
  askedQuestions: Question[];
  currentQuestion: Question | null;
  candidateMajors: CandidateMajor[];
  conflicts: Conflict[];
  recommendResult: RecommendResult | null;
  remainingSlots: number;
  questionCount: number;
  apiKey: string;
  errors: string[];
}

export const DEFAULT_INTEREST: InterestProfile = { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 };
export const DEFAULT_PERSONALITY: PersonalityProfile = { extraversion: 50, conscientiousness: 50, openness: 50, agreeableness: 50, neuroticism: 50 };
export const DEFAULT_ABILITY: AbilityProfile = { math: 50, language: 50, logic: 50, spatial: 50, programming: 50, experiment: 50, art: 50, social: 50, execution: 50, pressure_tolerance: 50, critical_thinking: 50 };
export const DEFAULT_LEARNING_STYLE: LearningStyle = { theory: 50, practice: 50, independent: 50, teamwork: 50, stable: 50, changeable: 50 };

export const DEFAULT_PROFILE: UserProfile = {
  interest: { ...DEFAULT_INTEREST },
  personality: { ...DEFAULT_PERSONALITY },
  ability: { ...DEFAULT_ABILITY },
  learning_style: { ...DEFAULT_LEARNING_STYLE },
};

export const CHINESE_MAJORS: CandidateMajor[] = [
  {
    major_name: '计算机科学与技术',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['编程', '算法', '逻辑思维', '数学', '英语'],
    work_style_tags: ['独立', '逻辑', '抽象', '持续学习'],
    difficulty_tags: ['高难度', '数学要求高', '更新快'],
    job_direction: '软件工程师、算法工程师、架构师、AI工程师',
  },
  {
    major_name: '软件工程',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['编程', '项目管理', '团队协作', '测试', '文档'],
    work_style_tags: ['团队', '实践', '工程化', '迭代'],
    difficulty_tags: ['中高难度', '实践性强', '协作要求高'],
    job_direction: '软件工程师、项目经理、DevOps工程师、测试工程师',
  },
  {
    major_name: '电子信息工程',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['电路', '信号处理', '嵌入式', '数学', '实验'],
    work_style_tags: ['实验', '动手', '逻辑', '精密'],
    difficulty_tags: ['高难度', '数学物理要求高', '实验多'],
    job_direction: '硬件工程师、嵌入式工程师、通信工程师',
  },
  {
    major_name: '临床医学',
    major_category: '医学',
    critical_thinking_type: '弱批判',
    skill_tags: ['生物', '化学', '记忆', '沟通', '动手', '抗压'],
    work_style_tags: ['高压力', '终身学习', '团队', '实践'],
    difficulty_tags: ['极高难度', '学制长', '强度大', '压力大'],
    job_direction: '医生、医学研究员、医疗管理者',
  },
  {
    major_name: '数学与应用数学',
    major_category: '理学',
    critical_thinking_type: '强批判',
    skill_tags: ['数学', '抽象思维', '逻辑', '建模'],
    work_style_tags: ['独立', '理论', '深度思考', '精确'],
    difficulty_tags: ['高难度', '抽象性强', '理论为主'],
    job_direction: '教师、研究员、数据分析师、金融量化',
  },
  {
    major_name: '物理学',
    major_category: '理学',
    critical_thinking_type: '强批判',
    skill_tags: ['数学', '物理', '实验', '抽象思维', '逻辑'],
    work_style_tags: ['独立', '理论', '实验', '深度思考'],
    difficulty_tags: ['极高难度', '数学物理要求极高', '抽象性强'],
    job_direction: '研究员、教师、半导体工程师、金融量化',
  },
  {
    major_name: '化学',
    major_category: '理学',
    critical_thinking_type: '强批判',
    skill_tags: ['化学', '实验', '数学', '观察', '耐心'],
    work_style_tags: ['实验', '独立', '深度', '精确'],
    difficulty_tags: ['高难度', '实验周期长', '需深造'],
    job_direction: '研究员、制药研发、材料科学、教师',
  },
  {
    major_name: '金融学',
    major_category: '经济学',
    critical_thinking_type: '弱批判',
    skill_tags: ['数学', '逻辑', '分析', '沟通', '抗压'],
    work_style_tags: ['快节奏', '社交', '竞争', '数据驱动'],
    difficulty_tags: ['中高难度', '竞争激烈', '实习重要'],
    job_direction: '投资银行、证券分析师、基金经理、风控',
  },
  {
    major_name: '会计学',
    major_category: '管理学',
    critical_thinking_type: '弱批判',
    skill_tags: ['细致', '逻辑', '规则', '数字', '耐心'],
    work_style_tags: ['稳定', '规范', '独立', '重复'],
    difficulty_tags: ['中等难度', '考证重要', '规则繁琐'],
    job_direction: '会计师、审计师、税务师、财务总监',
  },
  {
    major_name: '法学',
    major_category: '法学',
    critical_thinking_type: '弱批判',
    skill_tags: ['记忆', '逻辑', '语言', '辩论', '写作'],
    work_style_tags: ['独立', '逻辑', '对抗性', '深度研究'],
    difficulty_tags: ['高难度', '法考必要', '知识量大'],
    job_direction: '律师、法官、检察官、企业法务',
  },
  {
    major_name: '汉语言文学',
    major_category: '理学（形而上人文社科）',
    critical_thinking_type: '强批判',
    skill_tags: ['语言', '写作', '阅读', '文化', '审美'],
    work_style_tags: ['独立', '深度', '人文', '创造性'],
    difficulty_tags: ['中等难度', '需大量阅读', '就业面广但分散'],
    job_direction: '教师、编辑、文案、公务员、文化传媒',
  },
  {
    major_name: '英语',
    major_category: '文学',
    critical_thinking_type: '弱批判',
    skill_tags: ['语言', '跨文化', '沟通', '翻译', '写作'],
    work_style_tags: ['交流', '开放', '多元', '持续学习'],
    difficulty_tags: ['中等难度', '语言天赋重要', '竞争激烈'],
    job_direction: '翻译、教师、外企职员、外贸、涉外律师',
  },
  {
    major_name: '建筑学',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['空间', '艺术', '数学', '物理', '沟通', '项目管理'],
    work_style_tags: ['创意', '实践', '团队', '作品集'],
    difficulty_tags: ['高难度', '学制长', '需作品集', '强度大'],
    job_direction: '建筑师、城市规划师、室内设计师',
  },
  {
    major_name: '机械工程',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['物理', '数学', '空间', '动手', '设计'],
    work_style_tags: ['实践', '逻辑', '工程化', '精密'],
    difficulty_tags: ['中高难度', '实验多', '数学物理要求高'],
    job_direction: '机械工程师、汽车工程师、制造工程师',
  },
  {
    major_name: '心理学',
    major_category: '理学',
    critical_thinking_type: '强批判',
    skill_tags: ['观察', '沟通', '统计', '逻辑', '同理心'],
    work_style_tags: ['社交', '研究', '耐心', '深入'],
    difficulty_tags: ['中等难度', '需深造', '统计要求'],
    job_direction: '心理咨询师、HR、用户体验研究员、教育工作者',
  },
  {
    major_name: '新闻学',
    major_category: '文学',
    critical_thinking_type: '强批判',
    skill_tags: ['写作', '沟通', '调查', '敏锐', '多媒体'],
    work_style_tags: ['快节奏', '社交', '灵活', '好奇心'],
    difficulty_tags: ['中等难度', '实践重要', '行业变化快'],
    job_direction: '记者、编辑、新媒体运营、公关、内容策划',
  },
  {
    major_name: '工商管理',
    major_category: '管理学',
    critical_thinking_type: '弱批判',
    skill_tags: ['沟通', '组织', '分析', '领导力', '综合'],
    work_style_tags: ['社交', '多变', '管理', '实践'],
    difficulty_tags: ['中等难度', '泛而不精风险', '实习重要'],
    job_direction: '管理培训生、咨询顾问、创业者、项目经理',
  },
  {
    major_name: '土木工程',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['物理', '数学', '空间', '动手', '项目管理'],
    work_style_tags: ['实践', '工程化', '户外', '团队'],
    difficulty_tags: ['中高难度', '现场工作多', '体力要求'],
    job_direction: '土木工程师、结构工程师、项目经理',
  },
  {
    major_name: '经济学',
    major_category: '理学（形而上人文社科）',
    critical_thinking_type: '强批判',
    skill_tags: ['数学', '逻辑', '分析', '建模', '写作'],
    work_style_tags: ['独立', '理论', '研究', '政策'],
    difficulty_tags: ['中高难度', '数学要求较高', '理论性强'],
    job_direction: '经济分析师、研究员、政策顾问、金融从业者',
  },
  {
    major_name: '生物科学',
    major_category: '理学',
    critical_thinking_type: '强批判',
    skill_tags: ['实验', '生物', '化学', '观察', '耐心'],
    work_style_tags: ['实验', '独立', '深度', '坚持'],
    difficulty_tags: ['高难度', '实验周期长', '需深造'],
    job_direction: '研究员、制药、生物技术、教师',
  },
  {
    major_name: '化学工程与工艺',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['化学', '实验', '数学', '物理', '安全'],
    work_style_tags: ['实验', '流程化', '严密', '工厂'],
    difficulty_tags: ['高难度', '安全性要求高', '实验多'],
    job_direction: '化工工程师、制药工程师、材料工程师',
  },
  {
    major_name: '环境科学',
    major_category: '理学',
    critical_thinking_type: '弱批判',
    skill_tags: ['化学', '生物', '实验', '政策', '野外'],
    work_style_tags: ['跨学科', '实践', '社会价值', '户外'],
    difficulty_tags: ['中等难度', '跨学科要求', '政策关联'],
    job_direction: '环境顾问、监测分析师、政府环保部门、NGO',
  },
  {
    major_name: '历史学',
    major_category: '理学（形而上人文社科）',
    critical_thinking_type: '强批判',
    skill_tags: ['阅读', '写作', '研究', '批判思维', '文化'],
    work_style_tags: ['独立', '深度', '耐心', '人文'],
    difficulty_tags: ['中等难度', '就业面窄', '需学术深造'],
    job_direction: '教师、研究员、文化遗产、博物馆、公务员',
  },
  {
    major_name: '统计学',
    major_category: '理学',
    critical_thinking_type: '强批判',
    skill_tags: ['数学', '编程', '逻辑', '分析', '建模'],
    work_style_tags: ['独立', '数据驱动', '精确', '跨行业'],
    difficulty_tags: ['高难度', '数学要求高', '应用广泛'],
    job_direction: '数据分析师、精算师、量化研究员、数据科学家',
  },
  {
    major_name: '口腔医学',
    major_category: '医学',
    critical_thinking_type: '弱批判',
    skill_tags: ['动手', '生物', '沟通', '细致', '审美'],
    work_style_tags: ['实践', '精密', '社交', '独立'],
    difficulty_tags: ['高难度', '动手要求高', '学制长'],
    job_direction: '口腔医生、医院口腔科、私人诊所',
  },
  {
    major_name: '设计学类',
    major_category: '艺术学',
    critical_thinking_type: '弱批判',
    skill_tags: ['艺术', '创意', '空间', '软件', '沟通'],
    work_style_tags: ['创意', '作品集', '变化', '用户导向'],
    difficulty_tags: ['中等难度', '需作品集', '主观性强'],
    job_direction: 'UI/UX设计师、平面设计师、产品设计师',
  },
  {
    major_name: '数据科学与大数据技术',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['编程', '数学', '统计', '逻辑', '分析'],
    work_style_tags: ['独立', '数据驱动', '逻辑', '持续学习'],
    difficulty_tags: ['高难度', '数学编程要求高', '更新快'],
    job_direction: '数据科学家、数据分析师、大数据工程师',
  },
  {
    major_name: '人工智能',
    major_category: '工学',
    critical_thinking_type: '强批判',
    skill_tags: ['编程', '数学', '算法', '逻辑', '英语'],
    work_style_tags: ['独立', '研究', '持续学习', '抽象'],
    difficulty_tags: ['极高难度', '数学要求极高', '竞争激烈'],
    job_direction: 'AI工程师、算法研究员、机器学习工程师',
  },
  {
    major_name: '护理学',
    major_category: '医学',
    critical_thinking_type: '弱批判',
    skill_tags: ['沟通', '动手', '耐心', '同理心', '抗压'],
    work_style_tags: ['团队', '高压', '轮班', '实践'],
    difficulty_tags: ['中等难度', '体力要求', '情绪消耗大'],
    job_direction: '护士、护理管理者、社区健康顾问',
  },
  {
    major_name: '教育学',
    major_category: '教育学',
    critical_thinking_type: '强批判',
    skill_tags: ['沟通', '组织', '耐心', '心理学', '写作'],
    work_style_tags: ['社交', '引导', '人文', '稳定'],
    difficulty_tags: ['中等难度', '需教育实习', '政策关联'],
    job_direction: '教师、教育管理、课程设计、教育科技',
  },
  {
    major_name: '自动化',
    major_category: '工学',
    critical_thinking_type: '弱批判',
    skill_tags: ['数学', '编程', '物理', '逻辑', '动手'],
    work_style_tags: ['逻辑', '系统化', '工程化', '精密'],
    difficulty_tags: ['高难度', '交叉学科', '数学物理编程兼顾'],
    job_direction: '自动化工程师、机器人工程师、控制系统工程师',
  },
  {
    major_name: '信息管理与信息系统',
    major_category: '管理学',
    critical_thinking_type: '弱批判',
    skill_tags: ['编程', '管理', '数据', '分析', '沟通'],
    work_style_tags: ['跨学科', '技术+管理', '灵活', '项目'],
    difficulty_tags: ['中等难度', '技术深度不足风险', '交叉学科'],
    job_direction: 'IT咨询、产品经理、系统分析师、数据管理',
  },
];
