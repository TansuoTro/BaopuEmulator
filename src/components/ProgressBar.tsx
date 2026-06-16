import React from 'react';

interface Props {
  current: number;
  total: number;
  stageLabel: string;
}

const ProgressBar: React.FC<Props> = ({ current, total, stageLabel }) => {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="progress-bar">
      <div className="progress-info">
        <span className="progress-label">{stageLabel}</span>
        <span className="progress-count">
          {current} / {total}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-dots">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`dot ${i < current ? 'filled' : ''} ${i === current - 1 ? 'current' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
