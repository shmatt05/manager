import React from 'react';

export default function DecisionButton({ color, icon, text, onClick, keyboardShortcut }) {
  return (
    <button
      className={`relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-[8px] shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 border border-white/10 ${color}`}
      onClick={onClick}
      aria-label={text}
    >
      <div className="text-[#f5f5f7] mb-1">
        {icon}
      </div>
      <span className="text-[#f5f5f7] text-sm font-medium tracking-[0.3px] leading-[1.5]">{text}</span>
      {keyboardShortcut && (
        <span className="absolute top-1 right-1 text-[#f5f5f7]/70 text-xs bg-black/20 rounded px-1 opacity-70">
          {keyboardShortcut}
        </span>
      )}
    </button>
  );
}
