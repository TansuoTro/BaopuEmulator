import { useState, useCallback } from 'react';
import {
  DEFAULT_PROFILE,
  CHINESE_MAJORS,
  UserProfile,
  AssessmentState,
  AnswerRecord,
  Conflict,
} from '../types';
import {
  generateQuestion,
  scoreAnswer,
  getRecommendations,
  setApiKey,
} from '../api/deepseek';
import {
  buildQuestionPrompt,
  buildScorePrompt,
  buildRecommendPrompt,
} from '../prompts/systemPrompts';

const TOTAL_QUESTIONS = 12;

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>({
    stage: 'idle',
    userProfile: { ...DEFAULT_PROFILE },
    answers: [],
    askedQuestions: [],
    currentQuestion: null,
    candidateMajors: [...CHINESE_MAJORS],
    conflicts: [],
    recommendResult: null,
    remainingSlots: TOTAL_QUESTIONS,
    questionCount: 0,
    apiKey: '',
    errors: [],
  });

  const addError = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, errors: [...prev.errors, msg], stage: 'error' }));
  }, []);

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, errors: [] }));
  }, []);

  const startAssessment = useCallback(async (apiKey: string) => {
    setApiKey(apiKey);
    setState((prev) => ({
      ...prev,
      stage: 'asking',
      apiKey,
      errors: [],
    }));

    try {
      const prompt = buildQuestionPrompt(
        DEFAULT_PROFILE,
        [],
        CHINESE_MAJORS,
        null,
        TOTAL_QUESTIONS,
      );
      const result = await generateQuestion(prompt);
      if (result.type === 'question') {
        setState((prev) => ({
          ...prev,
          currentQuestion: result,
          remainingSlots: TOTAL_QUESTIONS - 1,
          questionCount: 1,
        }));
      } else if (result.type === 'error') {
        addError(result.message);
      }
    } catch (e) {
      addError((e as Error).message);
    }
  }, [addError]);

  const submitAnswer = useCallback(
    async (answer: string, confidence: number) => {
      const { currentQuestion, userProfile, askedQuestions, remainingSlots, questionCount, candidateMajors, conflicts } = state;
      if (!currentQuestion) return;

      const nextCount = questionCount + 1;
      const newAnswer: AnswerRecord = {
        question_id: currentQuestion.question_id,
        question: currentQuestion,
        answer,
        answer_confidence: confidence,
      };

      try {
        const scorePrompt = buildScorePrompt(
          userProfile,
          currentQuestion,
          answer,
          confidence,
          askedQuestions,
        );
        const scoreResult = await scoreAnswer(scorePrompt);
        let updatedProfile: UserProfile = userProfile;
        let updatedConflicts: Conflict[] = [...conflicts];
        let continueAssessment = true;

        if (scoreResult.type === 'score') {
          updatedProfile = scoreResult.updated_profile;
          updatedConflicts = [...conflicts, ...scoreResult.conflicts];
          continueAssessment = scoreResult.continue_assessment;
        }

        const newAskedQuestions = [...askedQuestions, currentQuestion];
        const remaining = remainingSlots - 1;

        const shouldRecommend = !continueAssessment || remaining <= 0 || nextCount >= TOTAL_QUESTIONS;

        if (shouldRecommend) {
          const confLevel = Math.min(100, 30 + nextCount * 6);
          const recPrompt = buildRecommendPrompt(
            updatedProfile,
            candidateMajors,
            updatedConflicts,
            confLevel,
          );
          const recResult = await getRecommendations(recPrompt);
          if (recResult.type === 'recommend') {
            const sorted = { ...recResult, top_majors: [...recResult.top_majors].sort((a, b) => b.score - a.score) };
            setState((prev) => ({
              ...prev,
              stage: 'recommend',
              userProfile: updatedProfile,
              answers: [...prev.answers, newAnswer],
              askedQuestions: newAskedQuestions,
              currentQuestion: null,
              conflicts: updatedConflicts,
              recommendResult: sorted,
              remainingSlots: remaining,
              questionCount: nextCount,
            }));
          } else if (recResult.type === 'error') {
            addError(recResult.message);
          }
        } else {
          const qPrompt = buildQuestionPrompt(
            updatedProfile,
            newAskedQuestions,
            candidateMajors,
            newAnswer,
            remaining,
          );
          const qResult = await generateQuestion(qPrompt);
          if (qResult.type === 'question') {
            setState((prev) => ({
              ...prev,
              userProfile: updatedProfile,
              answers: [...prev.answers, newAnswer],
              askedQuestions: newAskedQuestions,
              currentQuestion: qResult,
              conflicts: updatedConflicts,
              remainingSlots: remaining,
              questionCount: nextCount,
            }));
          } else if (qResult.type === 'error') {
            addError(qResult.message);
          }
        }
      } catch (e) {
        addError((e as Error).message);
      }
    },
    [state, addError],
  );

  const reset = useCallback(() => {
    setState({
      stage: 'idle',
      userProfile: { ...DEFAULT_PROFILE },
      answers: [],
      askedQuestions: [],
      currentQuestion: null,
      candidateMajors: [...CHINESE_MAJORS],
      conflicts: [],
      recommendResult: null,
      remainingSlots: TOTAL_QUESTIONS,
      questionCount: 0,
      apiKey: '',
      errors: [],
    });
  }, []);

  return { state, startAssessment, submitAnswer, reset, clearErrors };
}
