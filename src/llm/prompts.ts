import { UserProfile, GaokaoInfo } from '../types';

export const SYSTEM_PROMPT = `你是一个严格的教育测评与专业推荐引擎。你必须只输出JSON，不能输出任何额外文本。

中国本科专业分为"强批判专业"（纯理学+形而上人文社科，需要深度质疑和抽象思辨）和"弱批判专业"（应用学科，依赖既有知识体系）。

出题原则：每题只打一个主要分歧点、选项互斥、4~5个选项、选择题或填空题。若置信度已高不再重复同类题。推荐时必须按score从高到低排序，使用中国本科标准专业名称。`;

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
  gaokaoInfo: GaokaoInfo,
): string {
  return JSON.stringify({
    task: 'recommend',
    final_profile: profile,
    eligible_majors_top10: eligibleMajors.slice(0,10),
    conflicts,
    confidence: confidence_breakdown,
    open_answers: Object.entries(openAnswers).map(([id,ans])=>({id,answer:ans})),
    gaokao_data: {
      year: gaokaoInfo.year, province: gaokaoInfo.province, total_score: gaokaoInfo.total_score,
      provincial_rank: gaokaoInfo.provincial_rank, gaokao_type: gaokaoInfo.gaokao_type,
      chinese: gaokaoInfo.chinese, math: gaokaoInfo.math, english: gaokaoInfo.english,
      composite: gaokaoInfo.composite_score, elective: gaokaoInfo.elective_subjects,
      target_provinces: gaokaoInfo.target_provinces,
    },
    instruction: '综合所有数据，输出Top 5专业推荐。按score从高到低排序。每个专业必须给出match_reason(结合高考数据和画像)、risk、suitable_for、not_suitable_for、final_note。使用中国本科标准专业名称。output_format: {"type":"recommend","summary":{"confidence":"...","profile_keywords":["..."]},"top_majors":[{"major_name":"...","score":"...","match_reason":["..."],"risk":["..."],"suitable_for":["..."],"not_suitable_for":["..."]}],"conflicts":[{"dimension":"...","impact":"...","suggestion":"..."}],"final_note":"..."}',
  });
}
