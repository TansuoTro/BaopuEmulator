import { UserProfile, FixedQuestion, Major, DEFAULT_PROFILE, OpenAnswerTags } from '../types';
import { FIXED_QUESTIONS } from '../data/questions';

export function scoreFixedAnswer(
  profile: UserProfile,
  question: FixedQuestion,
  optionKey: string,
): UserProfile {
  const opt = question.options.find((o) => o.key === optionKey);
  if (!opt) return profile;

  const updated = { ...profile };
  for (const sd of question.sub_dimensions) {
    const key = sd.key as keyof UserProfile;
    const rawScore = opt.scores[sd.key] ?? 0;
    const scaled = rawScore * 25; // 0-4 → 0-100
    const delta = (scaled - (updated[key] ?? 50)) * (sd.weight / 5);
    updated[key] = Math.min(100, Math.max(0, (updated[key] ?? 50) + delta));
  }
  return updated;
}

export function computeAllFixedScores(
  answers: Record<string, string>,
): UserProfile {
  let profile = { ...DEFAULT_PROFILE };
  for (const q of FIXED_QUESTIONS) {
    const answer = answers[q.id];
    if (answer) {
      profile = scoreFixedAnswer(profile, q, answer);
    }
  }
  return profile;
}

export function applyDynamicScore(
  profile: UserProfile,
  dimension: string,
  delta: number,
): UserProfile {
  const key = dimension as keyof UserProfile;
  if (profile[key] !== undefined) {
    const newVal = Math.min(100, Math.max(0, (profile[key] ?? 50) + delta));
    return { ...profile, [key]: newVal };
  }
  return profile;
}

export function applyOpenTags(
  profile: UserProfile,
  tags: OpenAnswerTags,
): UserProfile {
  const updated = { ...profile };

  if (tags.learning_preference === 'project_based') {
    updated.practice = Math.min(100, updated.practice + 5);
    updated.teamwork = Math.min(100, updated.teamwork + 3);
  } else if (tags.learning_preference === 'independent_study') {
    updated.independent_vs_team = Math.max(0, updated.independent_vs_team - 5);
  }

  if (tags.pressure_response === 'plan_and_execute') {
    updated.pressure_tolerance = Math.min(100, updated.pressure_tolerance + 5);
    updated.decision_confidence = Math.min(100, updated.decision_confidence + 3);
  } else if (tags.pressure_response === 'seek_help') {
    updated.social = Math.min(100, updated.social + 5);
    updated.teamwork = Math.min(100, updated.teamwork + 3);
  }

  if (tags.environment === 'quiet_independent') {
    updated.independent_vs_team = Math.max(0, updated.independent_vs_team - 5);
  } else if (tags.environment === 'active_collaborative') {
    updated.teamwork = Math.min(100, updated.teamwork + 5);
    updated.independent_vs_team = Math.min(100, updated.independent_vs_team + 5);
  }

  return updated;
}

export function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const keys = Object.keys(a);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of keys) {
    const va = a[k] ?? 50;
    const vb = b[k] ?? 50;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 0.5;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function matchMajors(profile: UserProfile, majors: Major[]): { major: Major; score: number }[] {
  return majors
    .map((m) => {
      const vecA = profile as unknown as Record<string, number>;
      const vecB = m.profile_vector as unknown as Record<string, number>;
      const sim = cosineSimilarity(vecA, vecB);
      const score = Math.round(sim * 100);
      return { major: m, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function computeConfidence(answerCount: number, variance: number): number {
  const base = 30 + answerCount * 4;
  const penalty = Math.round(variance * 0.3);
  return Math.min(100, Math.max(0, base - penalty));
}
