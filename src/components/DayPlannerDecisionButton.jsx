import React from 'react';

export default function DecisionButton({ color, icon, text, onClick, keyboardShortcut }) {
  return (
    <button
      className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${color}`}
      onClick={onClick}
      aria-label={text}
    >
      <div className="text-white mb-2">
        {icon}
      </div>
      <span className="text-white text-sm font-medium">{text}</span>
      {keyboardShortcut && (
        <span className="absolute top-1 right-1 text-white/70 text-xs bg-black/20 rounded px-1">
          {keyboardShortcut}
        </span>
      )}
    </button>
  );
}