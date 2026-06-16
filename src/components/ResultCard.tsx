import React from 'react';
import { RecommendResult, TopMajor, RecommendConflict } from '../types';

interface Props {
  result: RecommendResult;
  onRestart: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'score-high';
  if (score >= 70) return 'score-mid';
  return 'score-low';
};

const getScoreLabel = (score: number): string => {
  if (score >= 85) return '强烈推荐';
  if (score >= 70) return '推荐';
  return '可考虑';
};

const MajorCard: React.FC<{ major: TopMajor; index: number }> = ({ major, index }) => (
  <div className={`major-card rank-${index + 1}`}>
    <div className="major-header">
      <span className="major-rank">
        {index === 0 ? (
          <i className="fas fa-crown"></i>
        ) : (
          <i className="fas fa-medal"></i>
        )}
        #{index + 1}
      </span>
      <div className="major-name-area">
        <h3>{major.major_name}</h3>
        <span className={`score-badge ${getScoreColor(major.score)}`}>
          {major.score} 分 · {getScoreLabel(major.score)}
        </span>
      </div>
    </div>

    <div className="major-score-bar">
      <div
        className={`score-fill ${getScoreColor(major.score)}`}
        style={{ width: `${major.score}%` }}
      />
    </div>

    <div className="major-section">
      <h4><i className="fas fa-check-circle"></i> 匹配理由</h4>
      <ul>
        {major.match_reason.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>

    <div className="major-section risk-section">
      <h4><i className="fas fa-exclamation-triangle"></i> 不适配风险</h4>
      <ul>
        {major.risk.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>

    <div className="major-grid">
      <div className="major-section">
        <h4><i className="fas fa-user-check"></i> 适合人群</h4>
        <ul>
          {major.suitable_for.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="major-section">
        <h4><i className="fas fa-user-xmark"></i> 不适合人群</h4>
        <ul>
          {major.not_suitable_for.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const ConflictCard: React.FC<{ conflict: RecommendConflict }> = ({ conflict }) => (
  <div className="conflict-item">
    <span className="conflict-dim">{conflict.dimension}</span>
    <p className="conflict-impact">{conflict.impact}</p>
    <p className="conflict-suggestion">
      <i className="fas fa-lightbulb"></i> {conflict.suggestion}
    </p>
  </div>
);

const ResultCard: React.FC<Props> = ({ result, onRestart }) => {
  const sorted = [...result.top_majors].sort((a, b) => b.score - a.score);

  return (
    <div className="result-card">
      <div className="result-hero">
        <h2>
          <i className="fas fa-clipboard-check"></i> 测评完成
        </h2>
        <div className="summary-confidence">
          <div className={`confidence-ring ${result.summary.confidence >= 70 ? 'high' : 'mid'}`}>
            <span>{result.summary.confidence}%</span>
          </div>
          <span>综合置信度</span>
        </div>
        <div className="profile-keywords">
          {result.summary.profile_keywords.map((kw, i) => (
            <span key={i} className="keyword-tag">{kw}</span>
          ))}
        </div>
      </div>

      <div className="top-majors-section">
        <h3>
          <i className="fas fa-trophy"></i> Top {sorted.length} 推荐专业
          <span className="sort-hint">（按匹配度从高到低排序）</span>
        </h3>
        {sorted.map((major, i) => (
          <MajorCard key={major.major_name} major={major} index={i} />
        ))}
      </div>

      {result.conflicts.length > 0 && (
        <div className="conflicts-section">
          <h3><i className="fas fa-scale-balanced"></i> 画像冲突点</h3>
          {result.conflicts.map((c, i) => (
            <ConflictCard key={i} conflict={c} />
          ))}
        </div>
      )}

      {result.next_questions_if_needed.length > 0 && (
        <div className="supplement-section">
          <h3><i className="fas fa-circle-question"></i> 补测建议</h3>
          <p>为提高置信度，建议补充以下问题：</p>
          <ul>
            {result.next_questions_if_needed.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="final-note">
        <i className="fas fa-comment-dots"></i> {result.final_note}
      </div>

      <button className="btn-restart" onClick={onRestart}>
        <i className="fas fa-rotate-right"></i> 重新测评
      </button>
    </div>
  );
};

export default ResultCard;
