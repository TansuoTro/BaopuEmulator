import { create } from 'zustand';
import {
  Phase,
  UserProfile,
  Major,
  DynamicQuestion,
  RecommendResult,
  OpenAnswerTags,
  DEFAULT_PROFILE,
} from '../types';
import { MAJORS } from '../data/majors';
import { FIXED_QUESTIONS, OPEN_QUESTIONS } from '../data/questions';
import {
  scoreFixedAnswer,
  matchMajors,
} from '../engine/scorer';

interface AssessmentStore {
  phase: Phase;
  profile: UserProfile;
  fixedAnswers: Record<string, string>;
  fixedIndex: number;
  dynamicQuestions: DynamicQuestion[];
  dynamicIndex: number;
  dynamicAnswers: Record<string, string>;
  openIndex: number;
  openAnswers: Record<string, string>;
  openTags: OpenAnswerTags | null;
  recommendResult: RecommendResult | null;
  matchedMajors: { major: Major; score: number }[];
  apiKey: string;
  errors: string[];

  setApiKey: (key: string) => void;
  startAssessment: () => void;
  answerFixed: (answer: string) => void;
  answerDynamic: (answer: string) => void;
  answerOpen: (answer: string) => void;
  setDynamicQuestions: (questions: DynamicQuestion[]) => void;
  setOpenTags: (tags: OpenAnswerTags) => void;
  setRecommendResult: (result: RecommendResult) => void;
  addError: (msg: string) => void;
  clearErrors: () => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  phase: 'idle',
  profile: { ...DEFAULT_PROFILE },
  fixedAnswers: {},
  fixedIndex: 0,
  dynamicQuestions: [],
  dynamicIndex: 0,
  dynamicAnswers: {},
  openIndex: 0,
  openAnswers: {},
  openTags: null,
  recommendResult: null,
  matchedMajors: [],
  apiKey: '',
  errors: [],

  setApiKey: (key) => set({ apiKey: key }),

  startAssessment: () => set({
    phase: 'fixed',
    profile: { ...DEFAULT_PROFILE },
    fixedAnswers: {},
    fixedIndex: 0,
    dynamicQuestions: [],
    dynamicIndex: 0,
    dynamicAnswers: {},
    openIndex: 0,
    openAnswers: {},
    openTags: null,
    recommendResult: null,
    matchedMajors: [],
    errors: [],
  }),

  answerFixed: (answer) => {
    const s = get();
    const q = FIXED_QUESTIONS[s.fixedIndex];
    if (!q) return;
    const newProfile = scoreFixedAnswer(s.profile, q, answer);
    const newAnswers = { ...s.fixedAnswers, [q.id]: answer };
    const nextIndex = s.fixedIndex + 1;

    if (nextIndex >= FIXED_QUESTIONS.length) {
      const matched = matchMajors(newProfile, MAJORS);
      set({
        profile: newProfile,
        fixedAnswers: newAnswers,
        fixedIndex: nextIndex,
        phase: 'dynamic',
        matchedMajors: matched,
      });
    } else {
      set({
        profile: newProfile,
        fixedAnswers: newAnswers,
        fixedIndex: nextIndex,
        matchedMajors: matchMajors(newProfile, MAJORS),
      });
    }
  },

  answerDynamic: (answer) => {
    const s = get();
    const q = s.dynamicQuestions[s.dynamicIndex];
    if (!q) return;
    const newAnswers = { ...s.dynamicAnswers, [q.id]: answer };
    const nextIndex = s.dynamicIndex + 1;

    if (nextIndex >= s.dynamicQuestions.length) {
      set({
        dynamicAnswers: newAnswers,
        dynamicIndex: nextIndex,
        phase: 'open',
      });
    } else {
      set({
        dynamicAnswers: newAnswers,
        dynamicIndex: nextIndex,
      });
    }
  },

  answerOpen: (answer) => {
    const s = get();
    const q = OPEN_QUESTIONS[s.openIndex];
    if (!q) return;
    const newAnswers = { ...s.openAnswers, [q.id]: answer };
    const nextIndex = s.openIndex + 1;

    if (nextIndex >= OPEN_QUESTIONS.length) {
      set({
        openAnswers: newAnswers,
        openIndex: nextIndex,
        phase: 'recommend',
      });
    } else {
      set({
        openAnswers: newAnswers,
        openIndex: nextIndex,
      });
    }
  },

  setDynamicQuestions: (questions) => set({ dynamicQuestions: questions }),
  setOpenTags: (tags) => set({ openTags: tags }),
  setRecommendResult: (result) => set({
    recommendResult: { ...result, top_majors: [...result.top_majors].sort((a, b) => b.score - a.score) },
  }),
  addError: (msg) => set((s) => ({ errors: [...s.errors, msg], phase: 'error' })),
  clearErrors: () => set({ errors: [] }),
  reset: () => set({
    phase: 'idle',
    profile: { ...DEFAULT_PROFILE },
    fixedAnswers: {},
    fixedIndex: 0,
    dynamicQuestions: [],
    dynamicIndex: 0,
    dynamicAnswers: {},
    openIndex: 0,
    openAnswers: {},
    openTags: null,
    recommendResult: null,
    matchedMajors: [],
    errors: [],
  }),
}));
