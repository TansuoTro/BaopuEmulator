import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Phase, Theme, UserProfile, GaokaoInfo, MajorNode, DynamicQuestion,
  RecommendationResult, ScoreLog, DEFAULT_PROFILE, DEFAULT_GAOKAO,
} from '../types';
import { FIXED_QUESTIONS, OPEN_QUESTIONS } from '../data/questions';
import {
  scoreFixedAnswer, matchMajors, computeConfidence, detectConflicts,
  applyDynamicScore, applyOpenDimensions, openTagsToDimensions,
} from '../engine/scorer';

interface AssessmentStore {
  phase: Phase; theme: Theme; apiKey: string; sessionId: string;
  gaokaoInfo: GaokaoInfo;
  profile: UserProfile; scoreLogs: ScoreLog[];
  fixedAnswers: Record<string,string>; fixedIndex: number;
  dynamicQuestions: DynamicQuestion[]; dynamicIndex: number; dynamicAnswers: Record<string,string>;
  openIndex: number; openAnswers: Record<string,string>;
  matchedMajors: { major: MajorNode; cosine_score: number }[];
  recommendation: RecommendationResult | null;
  errors: string[];

  setApiKey: (k:string)=>void; toggleTheme: ()=>void;
  setGaokaoInfo: (info:GaokaoInfo)=>void;
  startAssessment: ()=>void;
  answerFixed: (a:string)=>void;
  answerDynamic: (a:string)=>void;
  answerOpen: (a:string)=>void;
  setDynamicQuestions: (qs:DynamicQuestion[])=>void;
  updateProfileDynamic: (dim: keyof UserProfile, delta: number)=>void;
  applyOpenResult: (rawTags:{tags?:string[]})=>void;
  finalizeRecommendation: (llmData: Partial<RecommendationResult>)=>void;
  addError: (m:string)=>void; clearErrors: ()=>void; reset: ()=>void;
}

export const useAssessmentStore = create<AssessmentStore>()(
  persist((set,get)=>({
    phase:'idle',theme:'dark',apiKey:'',sessionId:'',
    gaokaoInfo:{...DEFAULT_GAOKAO},profile:{...DEFAULT_PROFILE},scoreLogs:[],
    fixedAnswers:{},fixedIndex:0,
    dynamicQuestions:[],dynamicIndex:0,dynamicAnswers:{},
    openIndex:0,openAnswers:{},
    matchedMajors:[],recommendation:null,errors:[],

    setApiKey:k=>set({apiKey:k}),
    toggleTheme:()=>set(s=>({theme:s.theme==='dark'?'light':'dark'})),
    setGaokaoInfo:info=>set({gaokaoInfo:info,phase:'fixed',sessionId:`s${Date.now()}`}),
    startAssessment:()=>set({
      phase:'gaokao',profile:{...DEFAULT_PROFILE},scoreLogs:[],
      gaokaoInfo:{...DEFAULT_GAOKAO},fixedAnswers:{},fixedIndex:0,
      dynamicQuestions:[],dynamicIndex:0,dynamicAnswers:{},
      openIndex:0,openAnswers:{},recommendation:null,matchedMajors:[],errors:[],
    }),
    answerFixed:a=>{
      const s=get(); const q=FIXED_QUESTIONS[s.fixedIndex]; if(!q)return;
      const {profile,log}=scoreFixedAnswer(s.profile,q,a);
      const ans={...s.fixedAnswers,[q.id]:a};
      const idx=s.fixedIndex+1;
      const matched=matchMajors(profile);
      if(idx>=FIXED_QUESTIONS.length) set({profile,fixedAnswers:ans,fixedIndex:idx,scoreLogs:[...s.scoreLogs,log],matchedMajors:matched,phase:'dynamic'});
      else set({profile,fixedAnswers:ans,fixedIndex:idx,scoreLogs:[...s.scoreLogs,log],matchedMajors:matched});
    },
    answerDynamic:a=>{
      const s=get(); const q=s.dynamicQuestions[s.dynamicIndex]; if(!q)return;
      const ans={...s.dynamicAnswers,[q.id]:a}; const idx=s.dynamicIndex+1;
      if(idx>=s.dynamicQuestions.length) set({dynamicAnswers:ans,dynamicIndex:idx,phase:'open'});
      else set({dynamicAnswers:ans,dynamicIndex:idx});
    },
    answerOpen:a=>{
      const s=get(); const q=OPEN_QUESTIONS[s.openIndex]; if(!q)return;
      const ans={...s.openAnswers,[q.id]:a}; const idx=s.openIndex+1;
      if(idx>=OPEN_QUESTIONS.length) set({openAnswers:ans,openIndex:idx,phase:'recommend'});
      else set({openAnswers:ans,openIndex:idx});
    },
    setDynamicQuestions:qs=>set({dynamicQuestions:qs}),
    updateProfileDynamic:(dim,delta)=>set(s=>({profile:applyDynamicScore(s.profile,dim,delta)})),
    applyOpenResult:rawTags=>set(s=>{
      const result=openTagsToDimensions(rawTags);
      return {profile:applyOpenDimensions(s.profile,result)};
    }),
    finalizeRecommendation:llmData=>{
      const s=get();
      const matched=matchMajors(s.profile);
      const conflicts=detectConflicts(s.profile);
      const conf=computeConfidence(s.fixedIndex,s.dynamicIndex,s.profile,conflicts,null);
      const top=matched.slice(0,5).map(m=>({
        major:m.major, cosine_score:m.cosine_score, graph_score:m.cosine_score,
        final_score:Math.round(m.cosine_score*0.7+(conf.total*0.3)), confidence:conf.total,
      }));
      set({
        phase:'recommend',
        recommendation:{
          session_id:s.sessionId,
          confidence_breakdown:conf,
          profile:s.profile,
          top_majors:top,
          conflicts,
          keywords:s.profile.math>70?['数理强']:s.profile.language>70?['语言强']:['综合型'],
          final_note:llmData.final_note||'',
          score_logs:s.scoreLogs,
        },
        matchedMajors:matched,
      });
    },
    addError:m=>set(s=>({errors:[...s.errors,m],phase:'error'})),
    clearErrors:()=>set({errors:[]}),
    reset:()=>set({
      phase:'idle',theme:'dark',apiKey:'',sessionId:'',
      gaokaoInfo:{...DEFAULT_GAOKAO},profile:{...DEFAULT_PROFILE},scoreLogs:[],
      fixedAnswers:{},fixedIndex:0,
      dynamicQuestions:[],dynamicIndex:0,dynamicAnswers:{},
      openIndex:0,openAnswers:{},matchedMajors:[],recommendation:null,errors:[],
    }),
  }),{name:'baopu-session',partialize:s=>({
    phase:s.phase,sessionId:s.sessionId,gaokaoInfo:s.gaokaoInfo,profile:s.profile,
    scoreLogs:s.scoreLogs,fixedAnswers:s.fixedAnswers,fixedIndex:s.fixedIndex,
    dynamicQuestions:s.dynamicQuestions,dynamicIndex:s.dynamicIndex,dynamicAnswers:s.dynamicAnswers,
    openIndex:s.openIndex,openAnswers:s.openAnswers,recommendation:s.recommendation,
    apiKey:s.apiKey,
  })})
);
