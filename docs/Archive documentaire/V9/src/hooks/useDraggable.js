import { useState, useRef, useCallback } from 'react';

export function useDraggable(options = {}) {
  const { disabled = false } = options;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const modalStartPos = useRef({ x: 0, y: 0 });
  const modalRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    if (disabled || e.button !== 0) return;
    
    // Ignorer si on clique sur un élément interactif
    const targetTag = e.target.tagName.toUpperCase();
    if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'OPTION'].includes(targetTag)) return;
    // Ignorer si le parent est un bouton interactif (icônes)
    if (e.target.closest('button')) return;

    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    modalStartPos.current = { ...position };
    
    // Capture les événements même si la souris sort de l'élément pendant le drag
    e.target.setPointerCapture(e.pointerId);
  }, [disabled, position]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    let newX = modalStartPos.current.x + dx;
    let newY = modalStartPos.current.y + dy;

    // Optionnel : Limitation basique pour éviter que la modale sorte complètement
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const margin = 50; // Garder au moins 50px de la modale visibles
      const headerHeight = 40; // Hauteur approximative du header
      
      // La modale est généralement centrée au départ. Ses coordonnées actuelles :
      // On estime ses limites projetées
      const projectedLeft = rect.left - position.x + newX;
      const projectedTop = rect.top - position.y + newY;
      
      // Ne pas laisser le header sortir en haut (très important pour ne pas perdre la poignée)
      if (projectedTop < 0) {
        newY = position.y - rect.top;
      }
      
      // Limites sur les autres bords
      if (projectedLeft + rect.width < margin) newX = position.x - (rect.left + rect.width) + margin;
      if (projectedLeft > viewportWidth - margin) newX = position.x - rect.left + viewportWidth - margin;
      if (projectedTop > viewportHeight - margin) newY = position.y - rect.top + viewportHeight - margin;
    }

    setPosition({ x: newX, y: newY });
  }, [isDragging, position]);

  const handlePointerUp = useCallback((e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  }, [isDragging]);

  return {
    position,
    isDragging,
    modalRef,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp, // Gérer la perte de focus/annulation
    },
    style: { transform: `translate(${position.x}px, ${position.y}px)` }
  };
}
