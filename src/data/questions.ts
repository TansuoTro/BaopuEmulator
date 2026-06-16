import { FixedQuestion, OpenQuestion } from '../types';

/* ── 15 fixed questions: 面向高中生，测认知风格而非知识储备 ── */
export const FIXED_QUESTIONS: FixedQuestion[] = [
  /* A组: 认知入口 (演绎vs归纳) */
  { id:'F01',layer:1,primary_dim:'theory_vs_practice',secondary_dims:[{key:'logic',weight:1}],
    stem:'遇到一个新问题时，你更习惯先查资料寻找现成解法，还是自己先试着摸索总结规律？',
    options:[{key:'A',text:'先查资料/问人，再动手',target_score:25},{key:'B',text:'偏向先查资料',target_score:40},{key:'C',text:'看情况，一半一半',target_score:50},{key:'D',text:'偏向先自己摸索',target_score:65},{key:'E',text:'先自己琢磨，实在不行再查',target_score:85}] },
  { id:'F02',layer:1,primary_dim:'logic',secondary_dims:[{key:'theory_vs_practice',weight:2}],
    stem:'你更喜欢先建立一套规则再用规则推导结论（演绎），还是先看大量例子再从中总结规律（归纳）？',
    options:[{key:'A',text:'强烈偏好演绎：先规则后推导',target_score:85},{key:'B',text:'更偏向演绎',target_score:68},{key:'C',text:'两者差不多',target_score:50},{key:'D',text:'更偏向归纳',target_score:32},{key:'E',text:'强烈偏好归纳：先看例子后总结',target_score:15}] },

  /* B组: 规则理解 (目的→条件→例外→变化) */
  { id:'F03',layer:1,primary_dim:'critical_thinking',secondary_dims:[{key:'rule_compliance',weight:2}],
    stem:'"公共厕所为什么通常男女分开？"——你对这类规则背后原因的看法是？',
    options:[{key:'A',text:'没想过，规则就是规则',target_score:10},{key:'B',text:'大概因为方便/隐私，但没深究',target_score:35},{key:'C',text:'能想到几个原因但不完全确定',target_score:55},{key:'D',text:'能分析原因并考虑什么情况下可以改',target_score:75},{key:'E',text:'能系统分析目的/条件/例外/变化',target_score:95}] },
  { id:'F04',layer:1,primary_dim:'rule_compliance',secondary_dims:[{key:'critical_thinking',weight:2}],
    stem:'"为什么偷东西违法？"——以下哪项最接近你的第一反应？',
    options:[{key:'A',text:'因为法律规定了',target_score:80},{key:'B',text:'因为伤害了别人',target_score:60},{key:'C',text:'因为是约定俗成的道德',target_score:45},{key:'D',text:'要看具体情况，不是绝对的',target_score:30},{key:'E',text:'如果物品无限多，这个概念就不成立了',target_score:15}] },

  /* C组: 抽象耐受 */
  { id:'F05',layer:1,primary_dim:'complexity_interest',secondary_dims:[{key:'critical_thinking',weight:1}],
    stem:'"为什么人不愿意吃屎？"——不要只说"恶心"，你能继续往下解释"恶心"可能来自哪里吗？',
    options:[{key:'A',text:'恶心就是恶心，没法解释',target_score:10},{key:'B',text:'可能跟气味/外观有关',target_score:35},{key:'C',text:'可能是进化形成的自我保护',target_score:55},{key:'D',text:'能分析进化+文化+心理多层原因',target_score:75},{key:'E',text:'能继续追问：如果从小吃就觉得正常吗',target_score:95}] },
  { id:'F06',layer:1,primary_dim:'complexity_interest',secondary_dims:[{key:'spatial',weight:1}],
    stem:'"铁块加热为什么会发光？"——你面对这种问题的第一反应是？',
    options:[{key:'A',text:'不知道，也不想知道',target_score:10},{key:'B',text:'大概跟温度有关，但不想深究',target_score:35},{key:'C',text:'想知道原理，会去查一下',target_score:55},{key:'D',text:'能想到跟电子激发有关',target_score:75},{key:'E',text:'能继续追问：怎么让它更亮但不熔化',target_score:95}] },

  /* D组: 概念边界 */
  { id:'F07',layer:1,primary_dim:'critical_thinking',secondary_dims:[{key:'logic',weight:2}],
    stem:'有人问"先有华为还是先有天？"——你的第一反应是？',
    options:[{key:'A',text:'当然是先有天',target_score:60},{key:'B',text:'先有华为（按字面）',target_score:45},{key:'C',text:'这个问题本身有概念混淆',target_score:75},{key:'D',text:'能指出"天"和"华为"不是同一类概念',target_score:85},{key:'E',text:'能分析问题预设了错误的分类框架',target_score:95}] },
  { id:'F08',layer:1,primary_dim:'logic',secondary_dims:[{key:'critical_thinking',weight:1}],
    stem:'"如果我发明一个鱼头朝向机，让鱼的头始终朝北，这个机器有价值吗？"',
    options:[{key:'A',text:'有价值，可以控制鱼的方向',target_score:30},{key:'B',text:'没价值，鱼不需要朝北',target_score:50},{key:'C',text:'要看应用场景才能判断',target_score:65},{key:'D',text:'能分析需求来源和替代方案',target_score:80},{key:'E',text:'能指出这可能是伪需求+分析为什么',target_score:95}] },

  /* E组: 工程分解 */
  { id:'F09',layer:1,primary_dim:'practice',secondary_dims:[{key:'logic',weight:2}],
    stem:'设计一个自动排队买奶茶的系统，你会先做什么？',
    options:[{key:'A',text:'不太擅长这种问题',target_score:15},{key:'B',text:'先想想大概需要哪些功能',target_score:40},{key:'C',text:'先列出关键步骤：排队→点单→付款→取茶',target_score:60},{key:'D',text:'列出步骤+考虑异常情况（插队/退款/网络故障）',target_score:80},{key:'E',text:'能拆解需求→流程→异常→边界条件',target_score:95}] },
  { id:'F10',layer:1,primary_dim:'programming',secondary_dims:[{key:'practice',weight:1}],
    stem:'给你一个没见过的机械装置，让你猜它怎么工作。你会怎么做？',
    options:[{key:'A',text:'直接放弃',target_score:10},{key:'B',text:'看说明书',target_score:35},{key:'C',text:'观察零件之间的连接关系',target_score:55},{key:'D',text:'动手拆开看看，再拼回去',target_score:75},{key:'E',text:'拆解→假设→测试→修正',target_score:95}] },

  /* F组: 开放性社会情境 (多因分析+权衡) */
  { id:'F11',layer:1,primary_dim:'social',secondary_dims:[{key:'language',weight:1}],
    stem:'你觉得"为什么公共厕所要分男女"？请列出支持和反对保留分开的理由。',
    options:[{key:'A',text:'我不太会分析这类问题',target_score:15},{key:'B',text:'支持：隐私/安全；反对：有时排队不均',target_score:40},{key:'C',text:'能各列出至少两个理由',target_score:60},{key:'D',text:'能分析不同情境下结论可能不同',target_score:80},{key:'E',text:'能分析目的/条件/例外/变化+权衡',target_score:95}] },
  { id:'F12',layer:1,primary_dim:'language',secondary_dims:[{key:'social',weight:2}],
    stem:'"为什么一种制度会存在很久？"——你能同时说出它的好处、坏处和例外情况吗？',
    options:[{key:'A',text:'存在即合理，不想分析',target_score:15},{key:'B',text:'能想到一两个好处',target_score:40},{key:'C',text:'能说出好处和坏处各一些',target_score:60},{key:'D',text:'能分析好处/坏处/例外/条件变化',target_score:80},{key:'E',text:'能权衡+反例意识+条件推理',target_score:95}] },

  /* G组: 人格与行为 (保留核心) */
  { id:'F13',layer:2,primary_dim:'social',secondary_dims:[{key:'independent_vs_team',weight:3}],
    stem:'更享受团队协作还是独自承担整个任务？',
    options:[{key:'A',text:'强烈偏好独自完成',target_score:10},{key:'B',text:'更倾向独立',target_score:35},{key:'C',text:'差不多',target_score:50},{key:'D',text:'更倾向团队',target_score:65},{key:'E',text:'强烈偏好团队协作',target_score:85}] },
  { id:'F14',layer:2,primary_dim:'pressure_tolerance',secondary_dims:[{key:'emotion_stability',weight:1}],
    stem:'截止日期迫近、多个任务同时压过来时，你通常的反应是？',
    options:[{key:'A',text:'容易崩溃/拖延',target_score:10},{key:'B',text:'会焦虑但还能动',target_score:35},{key:'C',text:'一般能应付',target_score:55},{key:'D',text:'列出优先级逐一处理',target_score:75},{key:'E',text:'越压越高效',target_score:95}] },
  { id:'F15',layer:2,primary_dim:'long_term_persistence',secondary_dims:[{key:'complexity_interest',weight:1}],
    stem:'愿意为一个长远目标持续投入数年时间吗？',
    options:[{key:'A',text:'很难坚持',target_score:10},{key:'B',text:'看兴趣，可能中途放弃',target_score:35},{key:'C',text:'如果目标值得会坚持',target_score:55},{key:'D',text:'通常能长期坚持',target_score:75},{key:'E',text:'享受长期深耕的过程',target_score:95}] },
];

/* ── 3 open questions: 认知复杂度 + 思维结构检测 ── */
export const OPEN_QUESTIONS: OpenQuestion[] = [
  { id:'O01',category:'多因分析',stem:'你觉得"为什么公共厕所要分男女"？请列出至少两个原因。如果所有厕所都变成完全独立隔间，这个制度还需要保留吗？为什么？',input_hint:'试着从多个角度想：隐私、安全、效率、文化习惯...' },
  { id:'O02',category:'抽象耐受',stem:'"为什么人不愿意吃屎？"不要只写"因为恶心"。请继续往下解释：是什么让人产生"恶心"这种感觉？这可能是从哪里来的？如果人类从出生起就吃某些我们现在觉得恶心的东西，长大后还会觉得恶心吗？',input_hint:'试着一步步追问自己，每层解释完了再问一个"为什么"...' },
  { id:'O03',category:'概念边界',stem:'如果我发明一个"鱼头朝向机"，让鱼的头始终朝北，这个机器有价值吗？请从用途、弊端、是否解决真实需求、有没有更好的替代方案几个方面来分析。',input_hint:'先想：鱼的头朝北有什么实际意义？再想：有没有更简单的办法达到同样目的？' },
];
