import React, { useState, useEffect } from 'react';

/**
 * Modale d'édition d'un enregistrement de l'historique.
 * Permet de modifier le label et le commentaire, et affiche la syntaxe brute équivalente.
 */
export default function EditRecordModal({ isOpen, onClose, record, index, onSave, syntaxConfig }) {
  const [label, setLabel] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (isOpen && record) {
      setLabel(record.action || "");
      setComment(record.comment || "");
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const handleSave = () => {
    onSave(index, label, comment);
    onClose();
  };

  // Reconstruction de la requête brute pour affichage
  let rawRequest = "";
  if (record.type === "replace") {
    let modifiers = "";
    // Le label est stocké dans record.action (label original ou nom généré)
    const recordLabel = record.label || record.action;
    if (recordLabel) modifiers += ` [LABEL:${recordLabel}]`;
    if (record.multiMode) {
      if (record.multiIndices && record.multiIndices.length > 0) {
        // Base-0 : les indices internes sont directement affichés tels quels
        modifiers += ` [MULTI:${record.multiIndices.join(', ')}]`;
      } else {
        modifiers += ` [MULTI:TRUE]`;
      }
    }
    if (record.ignoreSpaces) modifiers += ` [SMART:TRUE]`;

    rawRequest = `${syntaxConfig.START}${modifiers}\n`;
    if (record.comment) {
      rawRequest += `##Commentaire## ${record.comment}\n`;
    }
    rawRequest += `${syntaxConfig.FIND}\n${record.findStr}\n${syntaxConfig.REPLACE}\n${record.replaceStr}\n${syntaxConfig.END}`;
  } else {
    rawRequest = "Aucune requête associée (Snapshot).";
  }

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawRequest)
      .then(() => alert("Requête copiée dans le presse-papier !"))
      .catch(() => alert("Erreur lors de la copie."));
  };

  return (
    <div className="absolute inset-0 z-[1000] bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border-dark rounded-md shadow-2xl w-[600px] flex flex-col font-segoe select-none overflow-hidden">
        
        {/* Header */}
        <div className="bg-bg-dark border-b border-border-dark p-3 flex justify-between items-center flex-shrink-0">
          <h2 className="text-primary-blue font-black uppercase tracking-wide text-sm">
            Édition Historique — Version {record.version}
          </h2>
          <button 
            onClick={onClose} 
            className="text-text-light hover:text-white transition w-6 h-6 flex items-center justify-center bg-disabled-dark rounded"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#aaa] font-bold uppercase">Label (Action)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-bg-dark border border-[#444] rounded p-2 text-white text-sm focus:outline-none focus:border-primary-blue"
              placeholder="Ex: Correction padding bouton..."
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#aaa] font-bold uppercase">Commentaire</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-bg-dark border border-[#444] rounded p-2 text-white text-sm min-h-[80px] focus:outline-none focus:border-primary-blue resize-y"
              placeholder="Description détaillée ou consigne..."
            />
          </div>

          {/* Affichage read-only de la requête brute équivalente */}
          {record.type === "replace" && (
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-[#aaa] font-bold uppercase">Requête Source Équivalente</label>
                <button
                  onClick={handleCopyRaw}
                  className="text-xs bg-disabled-dark hover:bg-primary-blue text-white px-2 py-1 rounded transition"
                >
                  📋 Copier
                </button>
              </div>
              <pre className="bg-[#1e1e1e] border border-[#333] rounded p-3 text-[#d4d4d4] text-[11px] overflow-x-auto select-text font-mono">
                {rawRequest}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-bg-dark border-t border-border-dark p-3 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-disabled-dark hover:bg-[#555] text-white text-xs font-bold px-4 py-2 rounded transition"
          >
            ANNULER
          </button>
          <button
            onClick={handleSave}
            className="bg-primary-blue hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded transition"
          >
            ENREGISTRER
          </button>
        </div>
      </div>
    </div>
  );
}
