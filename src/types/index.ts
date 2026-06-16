export type Phase = 'idle' | 'gaokao' | 'fixed' | 'dynamic' | 'scenario' | 'open' | 'recommend' | 'error';
export type GaokaoType = '新高考' | '旧高考-理综' | '旧高考-文综';
export type Theme = 'dark' | 'light';
export type QuestionType = 'choice' | 'fill';

/* ── Gaokao ── */
export interface GaokaoInfo {
  year: number;
  province: string;
  total_score: number;
  provincial_rank: number;
  gaokao_type: GaokaoType;
  chinese: number; math: number; english: number;
  composite_score: number;
  elective_subjects: { name: string; score: number }[];
  target_provinces: string[];
  career_intention: '求职' | '升学' | '考公' | '灵活就业' | '不清楚';
}

/* ── Profile V3: 18 dimensions in 3 layers ── */
export interface UserProfile {
  /* Layer1: Core Abilities (6D) */
  math: number; spatial: number; language: number;
  logic: number; programming: number; practice: number;
  /* Layer2: Personality (5D) */
  social: number; teamwork: number; emotion_stability: number; decision_confidence: number;
  pressure_tolerance: number; long_term_persistence: number;
  /* Layer3: Cognitive Style (7D) */
  critical_thinking: number; creativity: number; rule_compliance: number;
  complexity_interest: number; theory_vs_practice: number;
  independent_vs_team: number; stable_vs_change: number;
}

export const PROFILE_DIMS = [
  'math','spatial','language','logic','programming','practice',
  'social','teamwork','emotion_stability','decision_confidence','pressure_tolerance','long_term_persistence',
  'critical_thinking','creativity','rule_compliance','complexity_interest','theory_vs_practice','independent_vs_team','stable_vs_change',
] as const;

export const DEFAULT_PROFILE: UserProfile = {
  math:50,spatial:50,language:50,logic:50,programming:50,practice:50,
  social:50,teamwork:50,emotion_stability:50,decision_confidence:50,pressure_tolerance:50,long_term_persistence:50,
  critical_thinking:50,creativity:50,rule_compliance:50,complexity_interest:50,theory_vs_practice:50,independent_vs_team:50,stable_vs_change:50,
};

/* ── Knowledge Graph Major ── */
export interface MajorNode {
  id: string; name: string; code: string;
  category: string; critical_type: '强批判' | '弱批判';
  rgb: [number, number, number];
  requirements: Partial<UserProfile>;
  courses: string[]; career: string[]; tags: string[];
  similar_majors: string[]; pca3d: [number, number, number];
  difficulty: number;
  employment_direction: string;
  postgraduate_direction: string;
}

/* ── Questions ── */
export interface FixedQuestion {
  id: string;
  layer: number;
  primary_dim: keyof UserProfile;
  secondary_dims: { key: keyof UserProfile; weight: number }[];
  stem: string;
  options: { key: string; text: string; target_score: number }[];
}

export interface DynamicQuestion {
  id: string;
  question_type: QuestionType;
  target_discrimination: string[];
  stem: string;
  options: { key: string; text: string }[];
  input_hint: string;
  expected_signal: string;
  option_scores?: Record<string, Record<string, number>>;
}

export interface OpenQuestion {
  id: string;
  category: string;
  stem: string;
  input_hint: string;
}

/* ── Tag Engine ── */
export interface OpenTagResult {
  tags: { name: string; confidence: number }[];
  dimensions: { key: keyof UserProfile; delta: number; confidence: number }[];
}

/* ── Scoring ── */
export interface ScoreLog {
  question_id: string;
  answer: string;
  dimension_deltas: { key: string; delta: number }[];
  reason: string;
  timestamp: number;
}

/* ── Confidence ── */
export interface ConfidenceBreakdown {
  completion: number;
  dimension_coverage: number;
  answer_consistency: number;
  open_richness: number;
  dynamic_convergence: number;
  conflict_penalty: number;
  total: number;
}

/* ── Conflict ── */
export interface ProfileConflict {
  type: string;
  severity: 'low' | 'medium' | 'high';
  dimensions: string[];
  explanation: string;
}

/* ── Recommendation ── */
export interface CandidateFilter {
  eligible: MajorNode[];
  ineligible: { major: MajorNode; reason: string }[];
}

export interface MatchedMajor {
  major: MajorNode;
  cosine_score: number;
  graph_score: number;
  final_score: number;
  confidence: number;
}

export interface RecommendationResult {
  session_id: string;
  nickname: string;
  confidence_breakdown: ConfidenceBreakdown;
  profile: UserProfile;
  top_majors: MatchedMajor[];
  conflicts: ProfileConflict[];
  keywords: string[];
  personality_sketch: string;
  personality_axes: { 接受vs怀疑: number; 保守vs激进: number; 经验vs知识: number; 权威vs独立: number };
  future_paths: Record<string, string>;
  final_note: string;
  score_logs: ScoreLog[];
}

/* ── Session ── */
export interface SessionState {
  session_id: string;
  phase: Phase;
  created_at: number;
  updated_at: number;
  gaokao_info: GaokaoInfo;
  profile: UserProfile;
  answers: { question_id: string; answer: string; phase: string }[];
  score_logs: ScoreLog[];
  candidate_filter: CandidateFilter | null;
  recommendation: RecommendationResult | null;
  api_key: string;
}

/* ── Constants ── */
export const PROVINCES = ['北京','天津','上海','重庆','河北','山西','辽宁','吉林','黑龙江','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','海南','四川','贵州','云南','陕西','甘肃','青海','内蒙古','广西','西藏','宁夏','新疆','香港','澳门'];

export const PROVINCE_MAX_SCORE: Record<string, number> = {
  '上海':660, '海南':900,
  '北京':750,'天津':750,'重庆':750,'河北':750,'山西':750,'辽宁':750,'吉林':750,'黑龙江':750,
  '江苏':750,'浙江':750,'安徽':750,'福建':750,'江西':750,'山东':750,'河南':750,
  '湖北':750,'湖南':750,'广东':750,'四川':750,'贵州':750,'云南':750,
  '陕西':750,'甘肃':750,'青海':750,'内蒙古':750,'广西':750,'西藏':750,'宁夏':750,'新疆':750,
};

/* Shanghai special rules */
export function getSubjectMax(province: string, subject: string, gaokaoType: string): number {
  if (province === '上海') {
    if (subject === 'elective') return gaokaoType === '新高考' ? 70 : 150;
    if (subject === 'chinese' || subject === 'math' || subject === 'english') return 150;
    return 100;
  }
  if (subject === 'elective') return gaokaoType === '新高考' ? 100 : 300;
  if (subject === 'chinese' || subject === 'math' || subject === 'english') return 150;
  return 100;
}

export const GAOKAO_YEARS = Array.from({length:27},(_,i)=>2026-i);

export const NEW_GAOKAO_SUBJECTS = ['物理','化学','生物','历史','政治','地理','技术'];

export const DEFAULT_GAOKAO: GaokaoInfo = {
  year:2025,province:'',total_score:0,provincial_rank:0,gaokao_type:'新高考',
  chinese:0,math:0,english:0,composite_score:0,elective_subjects:[],target_provinces:[],
  career_intention:'不清楚',
};

export const PHASE_TOTAL: Record<Phase, number> = {
  idle:0, gaokao:0, fixed:18, dynamic:5, scenario:4, open:6, recommend:0, error:0,
};
