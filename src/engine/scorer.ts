import { UserProfile, FixedQuestion, ScoreLog, MajorNode, ProfileConflict, ConfidenceBreakdown, OpenTagResult, CandidateFilter, DEFAULT_PROFILE } from '../types';
import { FIXED_QUESTIONS } from '../data/questions';
import { MAJOR_GRAPH } from '../data/majors';

export function scoreFixedAnswer(profile: UserProfile, question: FixedQuestion, optionKey: string): { profile: UserProfile; log: ScoreLog } {
  const opt = question.options.find(o=>o.key===optionKey);
  if (!opt) return { profile, log: { question_id: question.id, answer: optionKey, dimension_deltas: [], reason: '未匹配', timestamp: Date.now() } };
  const p = { ...profile };
  const deltas: { key: string; delta: number }[] = [];
  const primaryDelta = Math.round((opt.target_score - (p[question.primary_dim]??50)) * 0.25);
  p[question.primary_dim] = Math.min(100, Math.max(0, (p[question.primary_dim]??50) + primaryDelta));
  deltas.push({ key: question.primary_dim, delta: primaryDelta });
  for (const sd of question.secondary_dims) {
    const d = Math.round((opt.target_score - (p[sd.key]??50)) * (sd.weight / 12));
    p[sd.key] = Math.min(100, Math.max(0, (p[sd.key]??50) + d));
    deltas.push({ key: sd.key, delta: d });
  }
  return { profile: p, log: { question_id: question.id, answer: optionKey, dimension_deltas: deltas, reason: `${question.primary_dim}倾向`, timestamp: Date.now() } };
}

export function computeFixedProfile(answers: Record<string, string>): UserProfile {
  let p = { ...DEFAULT_PROFILE };
  for (const q of FIXED_QUESTIONS) if (answers[q.id]) p = scoreFixedAnswer(p, q, answers[q.id]).profile;
  return p;
}

export function applyDynamicScore(profile: UserProfile, dim: keyof UserProfile, delta: number): UserProfile {
  const p = { ...profile };
  p[dim] = Math.min(100, Math.max(0, (p[dim]??50) + delta * 2));
  return p;
}

export function applyOpenDimensions(profile: UserProfile, tagResult: OpenTagResult): UserProfile {
  const p = { ...profile };
  for (const d of tagResult.dimensions) {
    const delta = Math.round(d.delta * d.confidence * 1.5);
    p[d.key] = Math.min(100, Math.max(0, (p[d.key]??50) + delta));
  }
  return p;
}

function cosine(a: Record<string,number>, b: Record<string,number>): number {
  let dot=0, na=0, nb=0;
  for (const k of Object.keys(a)) { const va=a[k]??50, vb=b[k]??50; dot+=va*vb; na+=va*va; nb+=vb*vb; }
  return na && nb ? dot/(Math.sqrt(na)*Math.sqrt(nb)) : 0.5;
}

export function matchMajors(profile: UserProfile): { major: MajorNode; cosine_score: number }[] {
  return MAJOR_GRAPH.map(m=>({
    major: m,
    cosine_score: Math.round(cosine(profile as unknown as Record<string,number>, m.requirements as unknown as Record<string,number>) * 100),
  })).sort((a,b)=>b.cosine_score-a.cosine_score);
}

export function filterCandidates(gaokao: { math: number; chinese: number; gaokao_type: string }, majors: MajorNode[]): CandidateFilter {
  const eligible: MajorNode[]=[], ineligible: {major:MajorNode;reason:string}[]=[];
  for(const m of majors){
    const r=m.requirements; const ok=(r.math??0)<=90||gaokao.math>=90, langOk=(r.language??0)<=90||gaokao.chinese>=90;
    if(!ok){ineligible.push({major:m,reason:'数学单科未达专业需求'});continue;}
    if(!langOk){ineligible.push({major:m,reason:'语文单科未达专业需求'});continue;}
    eligible.push(m);
  }
  return {eligible,ineligible};
}

export function computeConfidence(fixed:number,dynamic:number,profile:UserProfile,conflicts:ProfileConflict[],openTags:OpenTagResult|null): ConfidenceBreakdown {
  const totalFixed=FIXED_QUESTIONS.length;
  const completion=Math.round((fixed+dynamic*0.6)/(totalFixed+10)*100);
  const covered=Object.values(profile).filter(v=>v!==50).length;
  const dimension_coverage=Math.min(100,Math.round(covered/18*100));
  const answer_consistency=Math.max(40,100-conflicts.length*15);
  const open_richness=openTags?.tags.length?Math.min(100,openTags.tags.length*25):30;
  const maxVals=Object.values(profile).filter(v=>v>75||v<25).length;
  const dynamic_convergence=Math.min(100,30+maxVals*6);
  const conflict_penalty=conflicts.filter(c=>c.severity==='high').length*12+conflicts.filter(c=>c.severity==='medium').length*5;
  const total=Math.max(0,Math.min(100,Math.round(completion*0.25+dimension_coverage*0.2+answer_consistency*0.2+open_richness*0.15+dynamic_convergence*0.2-conflict_penalty)));
  return {completion,dimension_coverage,answer_consistency,open_richness,dynamic_convergence,conflict_penalty,total};
}

export function detectConflicts(profile: UserProfile): ProfileConflict[] {
  const conflicts: ProfileConflict[]=[];
  if(profile.math>75&&profile.long_term_persistence<35)conflicts.push({type:'ability_vs_persistence',severity:'high',dimensions:['math','long_term_persistence'],explanation:'数学能力强但长期投入意愿低'});
  if(profile.social>75&&profile.independent_vs_team<25)conflicts.push({type:'social_vs_independence',severity:'medium',dimensions:['social','independent_vs_team'],explanation:'社交意愿强但极度偏好独立'});
  if(profile.creativity>75&&profile.rule_compliance>75)conflicts.push({type:'creation_vs_rules',severity:'medium',dimensions:['creativity','rule_compliance'],explanation:'创造力与规则遵守均高'});
  if(profile.pressure_tolerance<30&&profile.complexity_interest>70)conflicts.push({type:'pressure_vs_interest',severity:'high',dimensions:['pressure_tolerance','complexity_interest'],explanation:'喜欢复杂但抗压弱'});
  return conflicts;
}

const tagMap: Record<string, { key: keyof UserProfile; delta: number; confidence: number }[]> = {
  'independent_study':[{key:'independent_vs_team',delta:-8,confidence:0.7},{key:'social',delta:-3,confidence:0.6}],
  'project_based':[{key:'practice',delta:6,confidence:0.75},{key:'teamwork',delta:4,confidence:0.65}],
  'plan_and_execute':[{key:'pressure_tolerance',delta:6,confidence:0.7},{key:'decision_confidence',delta:4,confidence:0.6}],
  'seek_help':[{key:'social',delta:5,confidence:0.65},{key:'teamwork',delta:4,confidence:0.6}],
  'quiet_independent':[{key:'independent_vs_team',delta:-6,confidence:0.7},{key:'social',delta:-3,confidence:0.6}],
  'active_collaborative':[{key:'teamwork',delta:6,confidence:0.7},{key:'social',delta:4,confidence:0.65}],
  'high_intrinsic':[{key:'long_term_persistence',delta:7,confidence:0.8},{key:'complexity_interest',delta:5,confidence:0.7}],
  'research_interest':[{key:'critical_thinking',delta:6,confidence:0.75},{key:'complexity_interest',delta:5,confidence:0.7},{key:'theory_vs_practice',delta:-4,confidence:0.6}],
  /* 思维结构标签 (V4) */
  'multi_factor':[{key:'critical_thinking',delta:5,confidence:0.8},{key:'complexity_interest',delta:4,confidence:0.7}],
  'conditional_reasoning':[{key:'logic',delta:5,confidence:0.75},{key:'critical_thinking',delta:3,confidence:0.7}],
  'tradeoff_analysis':[{key:'critical_thinking',delta:4,confidence:0.7},{key:'decision_confidence',delta:3,confidence:0.65}],
  'counterexample_awareness':[{key:'critical_thinking',delta:5,confidence:0.75},{key:'logic',delta:3,confidence:0.65}],
  'concept_boundary':[{key:'critical_thinking',delta:6,confidence:0.8},{key:'logic',delta:4,confidence:0.7}],
  'abstraction_tolerance':[{key:'complexity_interest',delta:6,confidence:0.8},{key:'critical_thinking',delta:4,confidence:0.7},{key:'theory_vs_practice',delta:-3,confidence:0.6}],
  'problem_decomposition':[{key:'logic',delta:5,confidence:0.75},{key:'practice',delta:4,confidence:0.7},{key:'programming',delta:3,confidence:0.6}],
  'deductive_preference':[{key:'theory_vs_practice',delta:-5,confidence:0.7},{key:'logic',delta:3,confidence:0.65}],
  'inductive_preference':[{key:'theory_vs_practice',delta:5,confidence:0.7},{key:'practice',delta:4,confidence:0.65}],
  'rule_pragmatic':[{key:'rule_compliance',delta:-4,confidence:0.65},{key:'critical_thinking',delta:3,confidence:0.6}],
  'rule_principled':[{key:'rule_compliance',delta:4,confidence:0.65}],
};

export function openTagsToDimensions(rawTags: { tags?: string[] }): OpenTagResult {
  const tags = rawTags.tags || [];
  const dimensions: OpenTagResult['dimensions'] = [];
  for (const tag of tags) {
    const mapping = tagMap[tag];
    if (mapping) dimensions.push(...mapping.map(d=>({ key: d.key, delta: d.delta, confidence: d.confidence })));
  }
  return { tags: tags.map(t=>({ name: t, confidence: 0.7 })), dimensions };
}
