import React, { useState, useEffect, useRef } from 'react';

export default function LineChoiceModal({
  isVisible,
  position, // { x, y }
  onClose,
  maxLines,
  linesArray,
  onGoToLine,
  title,
  initialValue = "1"
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);
  
  const latestProps = useRef({ maxLines, linesArray, onGoToLine });
  useEffect(() => {
    latestProps.current = { maxLines, linesArray, onGoToLine };
  });

  useEffect(() => {
    if (isVisible) {
      setValue(initialValue);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    } else {
      stopIncrement();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  }, [isVisible, initialValue]);

  const finalizeGoToLine = (customValue) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    const num = parseInt(customValue !== undefined ? customValue : value, 10);
    const { maxLines, linesArray, onGoToLine } = latestProps.current;
    if (!isNaN(num) && num >= 1 && num <= maxLines) {
      const targetLine = linesArray ? linesArray[num - 1] : num;
      onGoToLine(targetLine, num);
    }
  };

  const handleGoToLine = () => {
    finalizeGoToLine();
    onClose();
  };

  const handleValueChange = (newVal) => {
    setValue(newVal);
    
    // Suspend navigation, clear previous timer
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    // Start 5s timeout
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
      if (inputRef.current) inputRef.current.blur();
      finalizeGoToLine(newVal);
    }, 5000);
  };

  const startIncrement = (delta) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    const update = (currentDelta) => {
      setValue(v => {
        const { maxLines, linesArray, onGoToLine } = latestProps.current;
        let n = (parseInt(v) || 1) + currentDelta;
        n = Math.max(1, Math.min(maxLines, n));
        
        const targetLine = linesArray ? linesArray[n - 1] : n;
        onGoToLine(targetLine, n);
        
        return n.toString();
      });
    };

    update(delta); // initial click
    startTimeRef.current = Date.now();
    
    const loop = () => {
      const elapsed = Date.now() - startTimeRef.current;
      let d = delta;

      if (elapsed > 2000) {
        // Multiplie par 2 chaque seconde après 2s
        const secondsPastTwo = Math.floor((elapsed - 2000) / 1000);
        const multiplier = Math.pow(2, secondsPastTwo + 1);
        d = delta * multiplier;
      }
      
      // Limite absolue à 50
      if (d > 50) d = 50;
      if (d < -50) d = -50;

      update(d);

      timeoutRef.current = setTimeout(() => {
        loop();
      }, 100); // Un pas toutes les 100ms
    };

    // On attend 500ms avant de déclencher la boucle d'accélération continue
    timeoutRef.current = setTimeout(loop, 500);
  };

  const stopIncrement = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleModalClick = (e) => {
    // Si on clique dans la modale mais en dehors de l'input
    if (inputRef.current && e.target !== inputRef.current) {
      if (typingTimerRef.current) {
        finalizeGoToLine();
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onMouseDown={onClose} 
      />
      <div 
        className="fixed z-50 bg-[#252526] border border-border-dark p-3 rounded shadow-xl flex flex-col gap-2 animate-fadeIn"
        style={{ left: Math.max(10, Math.min(position.x, window.innerWidth - 250)), top: position.y }}
        onClick={handleModalClick}
      >
        <span className="text-[11px] text-[#ccc] font-bold uppercase tracking-wider">{title || `Aller à la ligne (1 - ${maxLines})`}</span>
        <div className="flex gap-1.5 items-center">
          <input 
            ref={inputRef}
            type="number" 
            min={1} 
            max={maxLines}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGoToLine();
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            className="bg-bg-dark text-text-light border border-border-dark px-2 py-1 text-xs outline-none focus:border-primary-blue w-24 rounded-sm font-mono hide-spin-button"
            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
          <div className="flex flex-col gap-0.5">
            <button 
              onMouseDown={(e) => { if (e.button === 0) startIncrement(1); }}
              onMouseUp={stopIncrement}
              onMouseLeave={stopIncrement}
              className="px-1.5 bg-[#333] hover:bg-[#444] text-white rounded-[2px] text-[8px] leading-none py-0.5 select-none"
            >
              ▲
            </button>
            <button 
              onMouseDown={(e) => { if (e.button === 0) startIncrement(-1); }}
              onMouseUp={stopIncrement}
              onMouseLeave={stopIncrement}
              className="px-1.5 bg-[#333] hover:bg-[#444] text-white rounded-[2px] text-[8px] leading-none py-0.5 select-none"
            >
              ▼
            </button>
          </div>
          <button onClick={handleGoToLine} className="ml-1 px-3 py-1 bg-primary-blue hover:bg-primary-blue-hover transition text-white rounded-sm text-xs font-bold">GO</button>
        </div>
      </div>
    </>
  );
}
