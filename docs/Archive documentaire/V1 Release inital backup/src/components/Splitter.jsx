import React, { useRef, useEffect } from 'react';

/**
 * Composant de séparation interactif (Resizer) réutilisable pour diviser et dimensionner les panneaux.
 * 
 * @param {Object} props - Les propriétés du composant.
 * @param {'horizontal'|'vertical'} [props.direction='vertical'] - La direction du redimensionnement (horizontal = hauteur, vertical = largeur).
 * @param {function(number)} props.onResize - Callback appelé lors du drag avec la coordonnée X ou Y de la souris.
 * @returns {JSX.Element}
 */
export default function Splitter({ direction = 'vertical', onResize, collapsible = false, isCollapsed = false, collapseDirection = 'left', onToggleCollapse }) {
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      // On propage la position X ou Y absolue de la souris pour que le composant parent adapte les dimensions.
      onResize(direction === 'horizontal' ? e.clientY : e.clientX);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, onResize]);

  const handleMouseDown = (e) => {
    // Si on clique sur le bouton collapse, on ne déclenche pas le drag
    if (e.target.closest('.splitter-collapse-btn')) return;
    isDragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none'; // Évite la sélection parasite du texte pendant le redimensionnement
  };

  const isVertical = direction === 'vertical';

  const getChevronIcon = () => {
    if (!collapsible) return null;
    if (isVertical) {
      if (collapseDirection === 'left') {
        return isCollapsed ? '▶' : '◀';
      } else {
        return isCollapsed ? '◀' : '▶';
      }
    }
    return null;
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`bg-border-dark hover:bg-primary-blue transition-colors duration-200 z-10 select-none relative flex items-center justify-center ${
        isVertical
          ? 'w-[5px] cursor-col-resize h-full flex-shrink-0'
          : 'h-[5px] cursor-row-resize w-full flex-shrink-0'
      }`}
    >
      {collapsible && isVertical && (
        <button
          className="splitter-collapse-btn absolute z-20 flex items-center justify-center w-4 h-8 bg-bg-panel border border-border-dark rounded-sm text-white hover:text-primary-blue hover:border-primary-blue cursor-pointer shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleCollapse) onToggleCollapse();
          }}
          style={{
            [collapseDirection === 'left' ? 'right' : 'left']: '50%',
            transform: collapseDirection === 'left' ? 'translateX(50%)' : 'translateX(-50%)'
          }}
          title={isCollapsed ? "Déplier" : "Replier"}
        >
          <span className="text-[10px] leading-none select-none" style={{ transform: 'scaleY(1.5)' }}>
            {getChevronIcon()}
          </span>
        </button>
      )}
    </div>
  );
}
