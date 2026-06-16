import { FixedQuestion } from '../types';

export const FIXED_QUESTIONS: FixedQuestion[] = [
  {
    id: 'F01',
    dimension: '数理敏感度',
    sub_dimensions: [
      { key: 'math', weight: 3 },
      { key: 'logic', weight: 2 },
    ],
    stem: '我遇到公式和数据时，通常不会抗拒。',
    options: [
      { key: 'A', text: '非常不同意', scores: { math: 0, logic: 0 } },
      { key: 'B', text: '不太同意', scores: { math: 1, logic: 1 } },
      { key: 'C', text: '一般', scores: { math: 2, logic: 2 } },
      { key: 'D', text: '比较同意', scores: { math: 3, logic: 3 } },
      { key: 'E', text: '非常同意', scores: { math: 4, logic: 4 } },
    ],
  },
  {
    id: 'F02',
    dimension: '空间想象',
    sub_dimensions: [
      { key: 'spatial', weight: 4 },
      { key: 'logic', weight: 1 },
    ],
    stem: '我能比较快地在脑中想象物体旋转后的样子。',
    options: [
      { key: 'A', text: '非常不同意', scores: { spatial: 0, logic: 0 } },
      { key: 'B', text: '不太同意', scores: { spatial: 1, logic: 1 } },
      { key: 'C', text: '一般', scores: { spatial: 2, logic: 2 } },
      { key: 'D', text: '比较同意', scores: { spatial: 3, logic: 3 } },
      { key: 'E', text: '非常同意', scores: { spatial: 4, logic: 4 } },
    ],
  },
  {
    id: 'F03',
    dimension: '语言表达',
    sub_dimensions: [
      { key: 'language', weight: 4 },
      { key: 'social', weight: 1 },
    ],
    stem: '我能够用清晰的语言表达复杂想法。',
    options: [
      { key: 'A', text: '非常不同意', scores: { language: 0, social: 0 } },
      { key: 'B', text: '不太同意', scores: { language: 1, social: 1 } },
      { key: 'C', text: '一般', scores: { language: 2, social: 2 } },
      { key: 'D', text: '比较同意', scores: { language: 3, social: 3 } },
      { key: 'E', text: '非常同意', scores: { language: 4, social: 4 } },
    ],
  },
  {
    id: 'F04',
    dimension: '逻辑推理',
    sub_dimensions: [
      { key: 'logic', weight: 4 },
      { key: 'critical_thinking', weight: 1 },
    ],
    stem: '我喜欢推理和分析事情的内在逻辑。',
    options: [
      { key: 'A', text: '非常不同意', scores: { logic: 0, critical_thinking: 0 } },
      { key: 'B', text: '不太同意', scores: { logic: 1, critical_thinking: 1 } },
      { key: 'C', text: '一般', scores: { logic: 2, critical_thinking: 2 } },
      { key: 'D', text: '比较同意', scores: { logic: 3, critical_thinking: 3 } },
      { key: 'E', text: '非常同意', scores: { logic: 4, critical_thinking: 4 } },
    ],
  },
  {
    id: 'F05',
    dimension: '编程/抽象规则接受度',
    sub_dimensions: [
      { key: 'programming', weight: 3 },
      { key: 'math', weight: 2 },
    ],
    stem: '我对编程或学习一套抽象规则感到有趣。',
    options: [
      { key: 'A', text: '非常不同意', scores: { programming: 0, math: 0 } },
      { key: 'B', text: '不太同意', scores: { programming: 1, math: 1 } },
      { key: 'C', text: '一般', scores: { programming: 2, math: 2 } },
      { key: 'D', text: '比较同意', scores: { programming: 3, math: 3 } },
      { key: 'E', text: '非常同意', scores: { programming: 4, math: 4 } },
    ],
  },
  {
    id: 'F06',
    dimension: '动手实践偏好',
    sub_dimensions: [
      { key: 'practice', weight: 4 },
      { key: 'theory_vs_practice', weight: 1 },
    ],
    stem: '比起纯理论学习，我更享受动手做实验或搭建东西。',
    options: [
      { key: 'A', text: '非常不同意（偏好理论）', scores: { practice: 0, theory_vs_practice: 0 } },
      { key: 'B', text: '不太同意', scores: { practice: 1, theory_vs_practice: 1 } },
      { key: 'C', text: '一般', scores: { practice: 2, theory_vs_practice: 2 } },
      { key: 'D', text: '比较同意', scores: { practice: 3, theory_vs_practice: 3 } },
      { key: 'E', text: '非常同意（偏好实践）', scores: { practice: 4, theory_vs_practice: 4 } },
    ],
  },
  {
    id: 'F07',
    dimension: '与人交流意愿',
    sub_dimensions: [
      { key: 'social', weight: 4 },
      { key: 'teamwork', weight: 1 },
    ],
    stem: '我和陌生人聊天通常不感到困难。',
    options: [
      { key: 'A', text: '非常不同意', scores: { social: 0, teamwork: 0 } },
      { key: 'B', text: '不太同意', scores: { social: 1, teamwork: 1 } },
      { key: 'C', text: '一般', scores: { social: 2, teamwork: 2 } },
      { key: 'D', text: '比较同意', scores: { social: 3, teamwork: 3 } },
      { key: 'E', text: '非常同意', scores: { social: 4, teamwork: 4 } },
    ],
  },
  {
    id: 'F08',
    dimension: '情绪稳定性',
    sub_dimensions: [
      { key: 'emotion_stability', weight: 4 },
      { key: 'pressure_tolerance', weight: 1 },
    ],
    stem: '我在压力下通常能保持冷静，不会情绪化。',
    options: [
      { key: 'A', text: '非常不同意', scores: { emotion_stability: 0, pressure_tolerance: 0 } },
      { key: 'B', text: '不太同意', scores: { emotion_stability: 1, pressure_tolerance: 1 } },
      { key: 'C', text: '一般', scores: { emotion_stability: 2, pressure_tolerance: 2 } },
      { key: 'D', text: '比较同意', scores: { emotion_stability: 3, pressure_tolerance: 3 } },
      { key: 'E', text: '非常同意', scores: { emotion_stability: 4, pressure_tolerance: 4 } },
    ],
  },
  {
    id: 'F09',
    dimension: '决策风格',
    sub_dimensions: [
      { key: 'decision_confidence', weight: 4 },
      { key: 'emotion_stability', weight: -1 },
    ],
    stem: '我做决定时很少反复纠结，通常比较果断。',
    options: [
      { key: 'A', text: '非常不同意（经常纠结）', scores: { decision_confidence: 0, emotion_stability: 0 } },
      { key: 'B', text: '不太同意', scores: { decision_confidence: 1, emotion_stability: 0 } },
      { key: 'C', text: '一般', scores: { decision_confidence: 2, emotion_stability: 0 } },
      { key: 'D', text: '比较同意', scores: { decision_confidence: 3, emotion_stability: 0 } },
      { key: 'E', text: '非常同意（非常果断）', scores: { decision_confidence: 4, emotion_stability: 0 } },
    ],
  },
  {
    id: 'F10',
    dimension: '抗压能力',
    sub_dimensions: [
      { key: 'pressure_tolerance', weight: 4 },
      { key: 'emotion_stability', weight: 1 },
    ],
    stem: '面对截止日期和高强度任务，我能保持效率。',
    options: [
      { key: 'A', text: '非常不同意', scores: { pressure_tolerance: 0, emotion_stability: 0 } },
      { key: 'B', text: '不太同意', scores: { pressure_tolerance: 1, emotion_stability: 1 } },
      { key: 'C', text: '一般', scores: { pressure_tolerance: 2, emotion_stability: 2 } },
      { key: 'D', text: '比较同意', scores: { pressure_tolerance: 3, emotion_stability: 3 } },
      { key: 'E', text: '非常同意', scores: { pressure_tolerance: 4, emotion_stability: 4 } },
    ],
  },
  {
    id: 'F11',
    dimension: '长期投入意愿',
    sub_dimensions: [
      { key: 'long_term', weight: 4 },
      { key: 'complexity_interest', weight: 1 },
    ],
    stem: '我愿意为一个长期目标坚持数年，不急于求成。',
    options: [
      { key: 'A', text: '非常不同意', scores: { long_term: 0, complexity_interest: 0 } },
      { key: 'B', text: '不太同意', scores: { long_term: 1, complexity_interest: 1 } },
      { key: 'C', text: '一般', scores: { long_term: 2, complexity_interest: 2 } },
      { key: 'D', text: '比较同意', scores: { long_term: 3, complexity_interest: 3 } },
      { key: 'E', text: '非常同意', scores: { long_term: 4, complexity_interest: 4 } },
    ],
  },
  {
    id: 'F12',
    dimension: '规则遵守程度',
    sub_dimensions: [
      { key: 'rule_compliance', weight: 4 },
      { key: 'creativity', weight: -1 },
    ],
    stem: '我认为遵守既定规则比打破规则更重要。',
    options: [
      { key: 'A', text: '非常不同意（偏好自由创新）', scores: { rule_compliance: 0, creativity: 4 } },
      { key: 'B', text: '不太同意', scores: { rule_compliance: 1, creativity: 3 } },
      { key: 'C', text: '一般', scores: { rule_compliance: 2, creativity: 2 } },
      { key: 'D', text: '比较同意', scores: { rule_compliance: 3, creativity: 1 } },
      { key: 'E', text: '非常同意（偏好规则约束）', scores: { rule_compliance: 4, creativity: 0 } },
    ],
  },
  {
    id: 'F13',
    dimension: '创造性偏好',
    sub_dimensions: [
      { key: 'creativity', weight: 4 },
      { key: 'complexity_interest', weight: 1 },
    ],
    stem: '我经常有新的创意或改进想法。',
    options: [
      { key: 'A', text: '非常不同意', scores: { creativity: 0, complexity_interest: 0 } },
      { key: 'B', text: '不太同意', scores: { creativity: 1, complexity_interest: 1 } },
      { key: 'C', text: '一般', scores: { creativity: 2, complexity_interest: 2 } },
      { key: 'D', text: '比较同意', scores: { creativity: 3, complexity_interest: 3 } },
      { key: 'E', text: '非常同意', scores: { creativity: 4, complexity_interest: 4 } },
    ],
  },
  {
    id: 'F14',
    dimension: '团队合作偏好',
    sub_dimensions: [
      { key: 'teamwork', weight: 4 },
      { key: 'independent_vs_team', weight: 1 },
    ],
    stem: '与独自承担任务相比，我更享受团队协作。',
    options: [
      { key: 'A', text: '非常不同意（偏好独立）', scores: { teamwork: 0, independent_vs_team: 0 } },
      { key: 'B', text: '不太同意', scores: { teamwork: 1, independent_vs_team: 1 } },
      { key: 'C', text: '一般', scores: { teamwork: 2, independent_vs_team: 2 } },
      { key: 'D', text: '比较同意', scores: { teamwork: 3, independent_vs_team: 3 } },
      { key: 'E', text: '非常同意（偏好团队）', scores: { teamwork: 4, independent_vs_team: 4 } },
    ],
  },
  {
    id: 'F15',
    dimension: '对未知/复杂问题的兴趣',
    sub_dimensions: [
      { key: 'complexity_interest', weight: 3 },
      { key: 'critical_thinking', weight: 2 },
    ],
    stem: '我对没有标准答案的复杂问题感到兴奋。',
    options: [
      { key: 'A', text: '非常不同意', scores: { complexity_interest: 0, critical_thinking: 0 } },
      { key: 'B', text: '不太同意', scores: { complexity_interest: 1, critical_thinking: 1 } },
      { key: 'C', text: '一般', scores: { complexity_interest: 2, critical_thinking: 2 } },
      { key: 'D', text: '比较同意', scores: { complexity_interest: 3, critical_thinking: 3 } },
      { key: 'E', text: '非常同意', scores: { complexity_interest: 4, critical_thinking: 4 } },
    ],
  },
];

export const OPEN_QUESTIONS: {
  id: string;
  dimension: string;
  stem: string;
  input_hint: string;
}[] = [
  {
    id: 'O01',
    dimension: '学习偏好',
    stem: '你最喜欢的一类学习任务是什么？请举一个具体例子。',
    input_hint: '比如：独立推导公式、团队做项目、背诵知识点、动手实验...',
  },
  {
    id: 'O02',
    dimension: '压力与冲突处理',
    stem: '遇到连续几天高压任务、有人催你、同时还有别的任务时，你一般怎么处理？',
    input_hint: '比如：列清单逐一解决、先做最急的、找人帮忙分担、先缓一缓调整心态...',
  },
  {
    id: 'O03',
    dimension: '自我判断',
    stem: '你觉得自己最适合的学习/工作环境是什么？为什么？',
    input_hint: '比如：安静的图书馆、活跃的讨论组、实验室、户外现场...',
  },
];
