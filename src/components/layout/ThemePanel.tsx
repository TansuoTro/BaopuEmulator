import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  blur: number;
  opacity: number;
  onBlurChange: (v: number) => void;
  onOpacityChange: (v: number) => void;
  isDark: boolean;
}

const ThemePanel: React.FC<Props> = ({ show, blur, opacity, onBlurChange, onOpacityChange, onClose, isDark }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`p-6 rounded-2xl border max-w-sm w-full mx-4 glass ${isDark ? 'bg-[#1a1a2e]/90 border-white/10' : 'bg-white/90 border-zinc-200'}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold"><i className="fas fa-palette mr-2 text-indigo-400"/>主题设置</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70"><i className="fas fa-xmark text-lg"/></button>
        </div>

        {/* Blur */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/50"><i className="fas fa-droplet mr-1"/>玻璃模糊</span>
            <span className="text-indigo-400 font-mono">{blur}px</span>
          </div>
          <input type="range" min={0} max={24} value={blur} onChange={e => onBlurChange(+e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-white/10 accent-indigo-500 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-white/20 mt-1"><span>清晰</span><span>磨砂</span></div>
        </div>

        {/* Opacity */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/50"><i className="fas fa-eye mr-1"/>背景透明度</span>
            <span className="text-indigo-400 font-mono">{opacity}%</span>
          </div>
          <input type="range" min={20} max={80} value={opacity} onChange={e => onOpacityChange(+e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-white/10 accent-indigo-500 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-white/20 mt-1"><span>朦胧</span><span>通透</span></div>
        </div>

        <p className="text-[10px] text-white/30 text-center">设置自动保存，拖拽滑块实时预览</p>
      </div>
    </div>
  );
};

export default ThemePanel;
