import React, { useEffect, useRef } from 'react';
import { useDraggable } from '../hooks/useDraggable.js';
import logoVector from '../assets/brand/Double cherry vector.svg';
import vectorRed from '../assets/brand/Vector red.svg';
import vectorPurple from '../assets/brand/Vector purple.svg';
import lightningVector from '../assets/brand/Rogue Cherry eclair seul.svg';

export default function SplashScreen({ isOpen, onClose }) {
  const containerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto animate-fadeIn" onClick={onClose}>
      <div 
        ref={containerRef}
        className="bg-[#1e1e1e] border border-[#333] shadow-2xl rounded-lg max-w-5xl w-full mx-4 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '95vh' }}
      >
        {/* Header Section (Logo + Title) */}
        <div className="py-3 px-6 lg:py-4 lg:px-8 [@media(min-height:1100px)]:py-6 [@media(min-height:1100px)]:px-8 flex items-center justify-between border-b border-[#333] bg-gradient-to-r from-[#2a1b2e] to-[#1e1e1e] flex-shrink-0">
          <div className="flex items-center gap-4 lg:gap-6">
            <img src={logoVector} alt="Rogue Cherry Logo" className="w-20 sm:w-24 lg:w-32 [@media(max-height:800px)]:w-16 [@media(min-height:1100px)]:w-40 h-auto transition-all" />
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl [@media(max-height:800px)]:text-4xl [@media(min-height:1100px)]:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cherry-red to-purple-500 uppercase tracking-wider mb-1 [@media(min-height:1100px)]:mb-2 leading-none transition-all">
                Rogue Cherry
              </h1>
              <span className="bg-[#333] text-white px-2 py-0.5 lg:px-3 lg:py-1 rounded text-[10px] lg:text-xs [@media(min-height:1100px)]:text-sm font-bold font-mono tracking-widest border border-[#555] transition-all">
                VERSION 1.8.11 / RELEASE 1.0
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#888] hover:text-white transition text-3xl lg:text-4xl leading-none -mt-2 lg:-mt-6 [@media(max-height:800px)]:-mt-1 [@media(min-height:1100px)]:-mt-10"
            title="Fermer"
          >
            &times;
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 lg:p-6 [@media(min-height:1100px)]:p-8 overflow-y-auto">
          <h2 className="text-sm sm:text-base lg:text-lg [@media(max-height:800px)]:text-xs [@media(min-height:1100px)]:text-xl font-bold text-[#d4d4d4] mb-4 lg:mb-6 [@media(min-height:1100px)]:mb-10 leading-relaxed italic border-l-4 border-cherry-red pl-4 transition-all">
            "Faites du cherry picking dans un texte pour cibler au sniper ce que vous voulez changer, et rien d'autre, avec l'aide de votre assistant IA préféré."
          </h2>

          <div className="flex flex-col gap-3 lg:gap-5 [@media(min-height:1100px)]:gap-10 text-[#d4d4d4] text-xs sm:text-sm lg:text-base [@media(max-height:800px)]:text-xs [@media(min-height:1100px)]:text-lg leading-snug sm:leading-relaxed [@media(min-height:1100px)]:leading-loose text-justify transition-all">
            
            {/* Bloc 1 */}
            <div className="flex items-center gap-3 lg:gap-5 [@media(min-height:1100px)]:gap-6 bg-[#252525] p-3 lg:p-5 [@media(min-height:1100px)]:p-6 rounded-xl border border-[#333] shadow-inner transition-all">
              <img 
                src={vectorRed} 
                alt="Cherry Red" 
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 [@media(max-height:800px)]:w-12 [@media(max-height:800px)]:h-12 [@media(min-height:1100px)]:w-40 [@media(min-height:1100px)]:h-40 object-contain filter drop-shadow-[0_0_15px_rgba(255,0,0,0.3)] flex-shrink-0 transition-all" 
              />
              <div className="flex-1">
                <p className="block [@media(max-height:800px)]:hidden">
                  Demandez à votre IA de décrire comment modifier le texte de votre choix. Dites-lui précisément ce que vous voulez changer en lui fournissant le texte source original. Expliquez-lui également avec précision comment elle doit formuler une "requête rogue cherry" pour faire ses modifications, afin de garantir une intégration parfaite et sans erreur dans votre environnement de travail.
                </p>
                <p className="hidden [@media(max-height:800px)]:block">
                  Demandez à l'IA de formuler une requête Rogue Cherry en fournissant le texte source original. Elle ciblera précisément la modification sans altérer le reste de votre environnement de travail.
                </p>
              </div>
            </div>

            {/* Bloc 2 */}
            <div className="flex items-center gap-3 lg:gap-5 [@media(min-height:1100px)]:gap-6 bg-[#252525] p-3 lg:p-5 [@media(min-height:1100px)]:p-6 rounded-xl border border-[#333] shadow-inner transition-all">
              <div className="flex-1">
                <p className="block [@media(max-height:800px)]:hidden">
                  L'IA ne retouchera jamais d'elle-même le texte source. Vous évitez ainsi tout risque qu'elle ne le réécrive entièrement de manière incontrôlée, qu'elle ne commette des erreurs de logique, ou qu'elle finisse par perdre son contexte initial au fil des réécritures prolongées. Elle se contentera de vous fournir une instruction informatique stricte et sécurisée : que faut-il chercher, et le remplacer par quoi ?
                </p>
                <p className="hidden [@media(max-height:800px)]:block">
                  L'IA ne réécrit pas le texte entier pour éviter toute erreur de contexte. Elle génère uniquement une instruction de remplacement stricte et ciblée : que faut-il chercher, et le remplacer par quoi ?
                </p>
              </div>
              <img 
                src={vectorPurple} 
                alt="Cherry Purple" 
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 [@media(max-height:800px)]:w-12 [@media(max-height:800px)]:h-12 [@media(min-height:1100px)]:w-40 [@media(min-height:1100px)]:h-40 object-contain filter drop-shadow-[0_0_15px_rgba(128,0,128,0.3)] flex-shrink-0 transition-all" 
              />
            </div>

            {/* Bloc 3 */}
            <div className="flex items-center gap-3 lg:gap-5 [@media(min-height:1100px)]:gap-6 bg-[#252525] p-3 lg:p-5 [@media(min-height:1100px)]:p-6 rounded-xl border border-[#333] shadow-inner transition-all">
              <img 
                src={lightningVector} 
                alt="Rogue Cherry Eclair" 
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 [@media(max-height:800px)]:w-10 [@media(max-height:800px)]:h-10 [@media(min-height:1100px)]:w-28 [@media(min-height:1100px)]:h-28 object-contain filter drop-shadow-[0_0_15px_rgba(255,215,0,0.3)] flex-shrink-0 sm:ml-2 lg:ml-4 sm:mr-1 lg:mr-2 [@media(min-height:1100px)]:ml-4 [@media(min-height:1100px)]:mr-2 transition-all" 
              />
              <div className="flex-1">
                <p className="block [@media(max-height:800px)]:hidden">
                  Une fois la requête générée, le texte intégré, le code source et la requête se rencontrent dans Rogue Cherry. Le système se charge d'appliquer les changements de manière chirurgicale. Vous pouvez ainsi contrôler au besoin ce qui est réellement modifié et laisser faire le processus en toute confiance.
                </p>
                <p className="hidden [@media(max-height:800px)]:block">
                  Rogue Cherry se charge d'appliquer la requête générée. Contrôlez visuellement les modifications apportées et validez le processus en toute sécurité et confiance.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Section */}
        <div className="bg-[#151515] p-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 border-t border-[#333] text-[10px] sm:text-xs lg:text-sm text-[#888] font-mono flex-shrink-0">
          <a href="https://github.com/InsoO/Rogue-Cherry" target="_blank" rel="noreferrer" className="hover:text-primary-blue transition flex items-center gap-1.5">
            <span>🔗</span> GitHub Repository
          </a>
          <a href="https://github.com/InsoO/Rogue-Cherry/blob/main/README.md" target="_blank" rel="noreferrer" className="hover:text-primary-blue transition flex items-center gap-1.5">
            <span>📄</span> README
          </a>
          <div className="flex items-center gap-1.5">
            <span>©</span> {new Date().getFullYear()} Rogue Cherry
          </div>
          <div className="flex items-center gap-1.5 bg-[#222] px-2 py-0.5 rounded border border-[#333]">
            ⚖️ Licence MIT
          </div>
        </div>
      </div>
    </div>
  );
}
