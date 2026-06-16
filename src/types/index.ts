export type CriticalThinkingType = '强批判' | '弱批判';

export type MajorCategory =
  | '理学'
  | '工学'
  | '医学'
  | '文学'
  | '法学'
  | '经济学'
  | '管理学'
  | '教育学'
  | '艺术学'
  | '理学（形而上人文社科）';

export type Phase = 'idle' | 'fixed' | 'dynamic' | 'open' | 'recommend' | 'error';

export type QuestionType = 'choice' | 'fill';

export interface FixedQuestion {
  id: string;
  dimension: string;
  sub_dimensions: { key: string; weight: number }[];
  stem: string;
  options: { key: string; text: string; scores: Record<string, number> }[];
}

export interface DynamicQuestion {
  id: string;
  dimension: string;
  sub_dimension: string;
  question_type: QuestionType;
  stem: string;
  options: { key: string; text: string }[];
  input_hint: string;
  expected_signal: string;
}

export interface OpenQuestion {
  id: string;
  dimension: string;
  stem: string;
  input_hint: string;
}

export interface UserProfile {
  math: number;
  spatial: number;
  language: number;
  logic: number;
  programming: number;
  practice: number;
  social: number;
  emotion_stability: number;
  decision_confidence: number;
  pressure_tolerance: number;
  long_term: number;
  rule_compliance: number;
  creativity: number;
  teamwork: number;
  complexity_interest: number;
  critical_thinking: number;
  theory_vs_practice: number;
  independent_vs_team: number;
  stable_vs_change: number;
}

export interface Major {
  major_name: string;
  major_code: string;
  major_category: MajorCategory;
  critical_thinking_type: CriticalThinkingType;
  skill_tags: string[];
  work_style_tags: string[];
  difficulty_tags: string[];
  job_direction: string;
  profile_vector: Partial<UserProfile>;
  color: string;
}

export interface OpenAnswerTags {
  learning_preference: string;
  pressure_response: string;
  environment: string;
  self_awareness: string;
}

export interface Conflict {
  dimension: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RecommendConflict {
  dimension: string;
  impact: string;
  suggestion: string;
}

export interface TopMajor {
  major_name: string;
  score: number;
  match_reason: string[];
  risk: string[];
  suitable_for: string[];
  not_suitable_for: string[];
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

export interface ScoreResult {
  type: 'score';
  updated_profile: UserProfile;
  conflicts: Conflict[];
  next_best_dimensions: string[];
  continue_assessment: boolean;
}

export interface ErrorResult {
  type: 'error';
  error_code: string;
  message: string;
  need_more_info: string[];
}

export type EngineResponse =
  | { type: 'question'; question_id: string; question_type: QuestionType; dimension: string; sub_dimension: string; difficulty: number; stem: string; options: { key: string; text: string }[]; input_hint: string; expected_signal: string; stop_condition: string }
  | ScoreResult
  | RecommendResult
  | ErrorResult;

export const DEFAULT_PROFILE: UserProfile = {
  math: 50, spatial: 50, language: 50, logic: 50, programming: 50,
  practice: 50, social: 50, emotion_stability: 50, decision_confidence: 50,
  pressure_tolerance: 50, long_term: 50, rule_compliance: 50, creativity: 50,
  teamwork: 50, complexity_interest: 50, critical_thinking: 50,
  theory_vs_practice: 50, independent_vs_team: 50, stable_vs_change: 50,
};

export const PHASE_TOTAL: Record<Phase, number> = {
  idle: 0, fixed: 15, dynamic: 5, open: 3, recommend: 0, error: 0,
};
