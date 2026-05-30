import { useEffect, useState, useCallback } from 'react';

/**
 * Hook personnalisé pour rendre un élément DOM zoomable via Ctrl + Molette.
 * Utilise un "callback ref" pour détecter le moment exact où l'élément
 * apparaît dans le DOM (nécessaire pour les modales qui font un return null).
 * Attache un écouteur natif (passive: false) pour contourner l'erreur
 * "Unable to preventDefault inside passive event listener" de React/Chrome.
 * Appelle stopPropagation pour isoler chaque zone de zoom.
 * 
 * @param {number} initialSize Taille de départ en pixels (ex: 14)
 * @returns {function} Un callback ref à passer en prop `ref` de l'élément
 */
export function useZoomable(initialSize = 14) {
  // On stocke l'élément DOM dans un état pour que useEffect réagisse
  // quand la ref s'attache (ou se détache) d'un noeud réel.
  const [node, setNode] = useState(null);

  // Callback ref : React appelle cette fonction avec le noeud DOM
  // à chaque fois que l'élément est monté/démonté.
  const callbackRef = useCallback((el) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation(); // Empêche tout autre handler parent de réagir

        const currentVal = node.style.getPropertyValue('--zoom-size');
        let num = currentVal ? parseFloat(currentVal) : initialSize;

        if (e.deltaY < 0) {
          num = Math.min(40, num + 1);
        } else {
          num = Math.max(8, num - 1);
        }

        node.style.setProperty('--zoom-size', `${num}px`);
      }
    };

    // passive: false est CRITIQUE pour autoriser e.preventDefault()
    node.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, [node, initialSize]);

  return callbackRef;
}
