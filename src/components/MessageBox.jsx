import React, { useState, useEffect } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import faviconSvg from '../assets/brand/FAVICON.svg';

const iconMap = {
  warning: '⚠️',
  info: 'ℹ️',
  error: '❌',
  question: '❓',
  success: '✅'
};

export default function MessageBox({
  type,
  title = "Message",
  message = "",
  icon,
  buttons = [],
  inputs = [],
  onClose,
  draggable = true,
  centerLocked = false,
  position: initialPosition = null
}) {
  const [inputValues, setInputValues] = useState({});

  // Initialiser les valeurs par défaut
  useEffect(() => {
    if (inputs && inputs.length > 0) {
      const initial = {};
      inputs.forEach(inp => {
        initial[inp.id] = inp.defaultValue ?? (inp.type === 'checkbox' ? false : '');
      });
      setInputValues(initial);
    }
  }, [inputs]);

  // Configuration du drag & drop
  // Si on fournit une position initiale, on désactive le centrage automatique
  const isCentered = centerLocked || !initialPosition;
  
  const canDrag = draggable && !centerLocked;
  // useDraggable gère le décalage (x, y) relatif. Si la modale n'est pas centrée,
  // ce décalage s'ajoutera à sa position fixe définie plus bas.
  const { modalRef, dragHandlers, style: dragStyle } = useDraggable({ disabled: !canDrag });

  const defaultIcon = type === 'alert' ? 'ℹ️' : type === 'confirm' ? '❓' : type === 'prompt' ? '📝' : null;
  const displayIcon = iconMap[icon] || icon || defaultIcon;

  const handleInputChange = (id, val) => {
    setInputValues(prev => ({ ...prev, [id]: val }));
  };

  const handleButtonClick = (btn) => {
    if (btn.value === 'submit' && type === 'prompt') {
      onClose(inputValues['promptValue']);
    } else if (btn.value === 'submit') {
      onClose(inputValues);
    } else {
      onClose(btn.value);
    }
  };

  // Combinaison des styles de drag et de positionnement initial
  const containerStyle = !centerLocked 
    ? {
        ...dragStyle,
        ...(initialPosition ? { position: 'fixed', top: initialPosition.y, left: initialPosition.x } : {})
      }
    : {};

  return (
    <div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm pointer-events-auto ${isCentered ? 'flex items-center justify-center' : ''}`}>
      <div 
        ref={modalRef}
        className={`bg-bg-dark border border-border-dark shadow-2xl rounded-sm flex flex-col min-w-[350px] max-w-[600px] overflow-hidden animate-fadeIn ${!centerLocked ? 'absolute' : ''}`}
        style={containerStyle}
      >
        {/* Header (Drag handle) */}
        <div 
          className={`bg-[#2a2a2a] px-4 py-2 border-b border-border-dark flex justify-between items-center ${canDrag ? 'cursor-move' : ''} select-none flex-shrink-0`}
          {...(canDrag ? dragHandlers : {})}
        >
          <div className="flex items-center gap-2 flex-1 pointer-events-auto cursor-grab active:cursor-grabbing font-bold font-mono">
            <img src={faviconSvg} alt="" className="w-8 h-8 -ml-1.5 -mt-1 drop-shadow-md" />
            {displayIcon && <span className="text-lg">{displayIcon}</span>}
            <span className="text-white font-bold text-sm uppercase tracking-wider truncate">{title}</span>
          </div>
          <button 
            onClick={() => onClose(null)}
            className="text-[#aaa] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {message && (
            <div className="text-sm text-[#ccc] whitespace-pre-wrap leading-relaxed">
              {message}
            </div>
          )}

          {/* Dynamic Inputs */}
          {inputs && inputs.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              {inputs.map((inp) => {
                if (inp.type === 'checkbox') {
                  return (
                    <label key={inp.id} className="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={!!inputValues[inp.id]}
                        onChange={(e) => handleInputChange(inp.id, e.target.checked)}
                        className="cursor-pointer"
                      />
                      {inp.label || inp.id}
                    </label>
                  );
                } else if (inp.type === 'select') {
                  return (
                    <div key={inp.id} className="flex flex-col gap-1">
                      {inp.label && <span className="text-xs text-[#888] uppercase">{inp.label}</span>}
                      <select 
                        value={inputValues[inp.id] || ''}
                        onChange={(e) => handleInputChange(inp.id, e.target.value)}
                        className="bg-[#1e1e1e] border border-border-dark p-2 text-sm text-[#ccc] rounded-sm"
                      >
                        {inp.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                } else if (inp.type === 'number') {
                  return (
                    <div key={inp.id} className="flex flex-col gap-1">
                      {inp.label && <span className="text-xs text-[#888] uppercase">{inp.label}</span>}
                      <input 
                        type="number"
                        min={inp.min}
                        max={inp.max}
                        step={inp.step || 1}
                        value={inputValues[inp.id] || 0}
                        onChange={(e) => handleInputChange(inp.id, Number(e.target.value))}
                        className="bg-[#1e1e1e] border border-border-dark p-2 text-sm text-[#ccc] rounded-sm font-mono"
                      />
                    </div>
                  );
                } else {
                  return (
                    <div key={inp.id} className="flex flex-col gap-1">
                      {inp.label && <span className="text-xs text-[#888] uppercase">{inp.label}</span>}
                      <input 
                        type={inp.type || 'text'}
                        value={inputValues[inp.id] || ''}
                        onChange={(e) => handleInputChange(inp.id, e.target.value)}
                        className="bg-[#1e1e1e] border border-border-dark p-2 text-sm text-white rounded-sm font-mono w-full"
                        autoFocus={inp.autoFocus}
                        onKeyDown={(e) => {
                          // Allow enter to submit if it's the only input
                          if (e.key === 'Enter' && inputs.length === 1) {
                            const submitBtn = buttons.find(b => b.value === 'submit' || b.value === true);
                            if (submitBtn) handleButtonClick(submitBtn);
                          }
                        }}
                      />
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#2a2a2a] border-t border-border-dark flex justify-end gap-2 flex-shrink-0">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleButtonClick(btn)}
              className={`px-4 py-1.5 rounded-sm text-sm font-bold uppercase transition-colors ${
                btn.variant === 'primary' 
                  ? 'bg-primary-blue hover:bg-opacity-80 text-white' 
                  : btn.variant === 'danger'
                    ? 'bg-cherry-red hover:bg-opacity-80 text-white'
                    : 'bg-[#555] hover:bg-[#666] text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
