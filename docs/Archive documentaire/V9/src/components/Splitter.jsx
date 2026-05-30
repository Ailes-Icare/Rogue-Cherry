import React, { useRef, useEffect } from 'react';

/**
 * Composant de séparation interactif (Resizer) réutilisable pour diviser et dimensionner les panneaux.
 * 
 * @param {Object} props - Les propriétés du composant.
 * @param {'horizontal'|'vertical'} [props.direction='vertical'] - La direction du redimensionnement (horizontal = hauteur, vertical = largeur).
 * @param {function(number)} props.onResize - Callback appelé lors du drag avec la coordonnée X ou Y de la souris.
 * @returns {JSX.Element}
 */
export default function Splitter({ direction = 'vertical', onResize }) {
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
    isDragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none'; // Évite la sélection parasite du texte pendant le redimensionnement
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`bg-border-dark hover:bg-primary-blue transition-colors duration-200 z-10 select-none ${
        direction === 'horizontal'
          ? 'h-[5px] cursor-row-resize w-full flex-shrink-0'
          : 'w-[5px] cursor-col-resize h-full flex-shrink-0'
      }`}
    />
  );
}
