import React, { useState } from 'react';

interface Props {
  onStart: (apiKey: string) => void;
  loading: boolean;
}

const StartScreen: React.FC<Props> = ({ onStart, loading }) => {
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="start-screen">
      <div className="hero">
        <div className="hero-icon">
          <i className="fas fa-graduation-cap"></i>
        </div>
        <h1>抱朴</h1>
        <p className="subtitle">中国本科专业匹配测评</p>
        <p className="desc">
          通过 <strong>10~15</strong> 道混合题，<br />
          基于兴趣 · 能力 · 人格 · 批判思维 · 学习偏好，<br />
          为你推荐最匹配的中国本科专业。
        </p>
      </div>

      <div className="api-key-section">
        <label htmlFor="api-key-input">
          <i className="fas fa-key"></i> DeepSeek API Key
        </label>
        <div className="input-wrapper">
          <input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
          />
        </div>
        <p className="hint">
          <i className="fas fa-info-circle"></i> 你的 Key 仅在浏览器本地使用，不会上传到第三方服务器。
        </p>
      </div>

      <button
        className="btn-start"
        disabled={!apiKey.trim() || loading}
        onClick={() => onStart(apiKey.trim())}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i> 加载中...
          </>
        ) : (
          <>
            <i className="fas fa-rocket"></i> 开始测评
          </>
        )}
      </button>

      <div className="features">
        <div className="feature-item">
          <i className="fas fa-shuffle"></i>
          <span>动态出题</span>
        </div>
        <div className="feature-item">
          <i className="fas fa-list-check"></i>
          <span>混合题型</span>
        </div>
        <div className="feature-item">
          <i className="fas fa-brain"></i>
          <span>强/弱批判区分</span>
        </div>
        <div className="feature-item">
          <i className="fas fa-chart-line"></i>
          <span>可解释推荐</span>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
