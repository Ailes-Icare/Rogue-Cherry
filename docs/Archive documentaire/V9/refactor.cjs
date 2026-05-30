const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// handleImportMainCode
content = content.replace(
  /const handleImportMainCode = \(\) => {([\s\S]*?)alert\("Impossible de lire le presse-papier\."\);(\s*)};/m,
  `const handleImportMainCode = async () => {$1await showAlert("Impossible de lire le presse-papier.", "Erreur");$2};`
);
content = content.replace(
  /alert\("Le presse-papier est vide\."\);/,
  `await showAlert("Le presse-papier est vide.", "Erreur");`
);
content = content.replace(
  /if \(!confirm\("Attention : L'importation d'un nouveau fichier va réinitialiser tout le projet\. Continuer \?"\)\) {/,
  `if (!(await showConfirm("Attention : L'importation d'un nouveau fichier va réinitialiser tout le projet. Continuer ?"))) {`
);

// handleCopyMainCode
content = content.replace(
  /const handleCopyMainCode = \(\) => {([\s\S]*?)alert\("Aucun code source à copier\."\);([\s\S]*?)alert\("Code source copié dans le presse-papier !"\);([\s\S]*?)alert\("Échec de la copie\."\);(\s*)};/m,
  `const handleCopyMainCode = async () => {$1await showAlert("Aucun code source à copier.", "Avertissement");$2await showAlert("Code source copié dans le presse-papier !");$3await showAlert("Échec de la copie.", "Erreur");$4};`
);

// handleSaveAs
content = content.replace(
  /alert\("Fichier enregistré avec succès !"\);/,
  `await showAlert("Fichier enregistré avec succès !");`
);
content = content.replace(
  /alert\("Erreur lors de l'enregistrement du fichier\."\);/,
  `await showAlert("Erreur lors de l'enregistrement du fichier.", "Erreur");`
);

// handleApplyReplace
content = content.replace(
  /const handleApplyReplace = \(\) => {([\s\S]*?)alert\("Texte recherché introuvable dans le code source\. Ouverture du Débogueur pour visualiser le décalage \(Heatmap\)\."\);/m,
  `const handleApplyReplace = async () => {$1await showAlert("Texte recherché introuvable dans le code source. Ouverture du Débogueur pour visualiser le décalage (Heatmap).", "Avertissement");`
);
content = content.replace(
  /alert\("Impossible de localiser cette modification dans le code actuel\."\);/,
  `await showAlert("Impossible de localiser cette modification dans le code actuel.", "Erreur");`
);
content = content.replace(
  /alert\(\`Erreur : Trouvé \$\{occurrencesCount\} fois\. Une occurrence unique est exigée en mode strict\.\`\);/,
  `await showAlert(\`Erreur : Trouvé \${occurrencesCount} fois. Une occurrence unique est exigée en mode strict.\`, "Erreur");`
);

// processMultistack
content = content.replace(
  /const processMultistack = \(currentTextState, currentStack, currentIndex\) => {([\s\S]*?)alert\("🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !"\);/m,
  `const processMultistack = async (currentTextState, currentStack, currentIndex) => {$1await showAlert("🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !");`
);
content = content.replace(
  /alert\("Une requête exige une ouverture automatique du Débogueur : Erreur de syntaxe détectée\."\);/,
  `await showAlert("Une requête exige une ouverture automatique du Débogueur : Erreur de syntaxe détectée.", "Erreur");`
);
content = content.replace(
  /alert\(\`📦 MODE MULTISTACK : \$\{newPending\.length\} requêtes détectées\.\\nLa première est chargée\. Cliquez sur 'APPLIQUER' pour passer automatiquement à la suivante !`\);/,
  `await showAlert(\`📦 MODE MULTISTACK : \${newPending.length} requêtes détectées.\\nLa première est chargée. Cliquez sur 'APPLIQUER' pour passer automatiquement à la suivante !\`, "Information");`
);
content = content.replace(
  /alert\("Aucune requête syntaxique valide trouvée dans la pile Multistack\."\);/,
  `await showAlert("Aucune requête syntaxique valide trouvée dans la pile Multistack.", "Erreur");`
);

// handleProcessNextStackItem
content = content.replace(
  /const handleProcessNextStackItem = \(\) => {([\s\S]*?)alert\("Le texte recherché est introuvable\. Ouverture automatique du Débogueur\."\);([\s\S]*?)alert\(parsed\.label \? \`Requête "\$\{parsed\.label\}" chargée !\` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider\."\);([\s\S]*?)alert\("Erreur syntaxique détectée dans la requête\. Ouverture automatique du Débogueur\."\);/m,
  `const handleProcessNextStackItem = async () => {$1await showAlert("Le texte recherché est introuvable. Ouverture automatique du Débogueur.", "Erreur");$2await showAlert(parsed.label ? \`Requête "\${parsed.label}" chargée !\` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider.");$3await showAlert("Erreur syntaxique détectée dans la requête. Ouverture automatique du Débogueur.", "Erreur");`
);

// handleParseRequest (if it's not async yet)
content = content.replace(
  /const handleParseRequest = \(\) => {([\s\S]*?)alert\("Texte brut importé dans la zone de recherche \(FIND\)\."\);/m,
  `const handleParseRequest = async () => {$1await showAlert("Texte brut importé dans la zone de recherche (FIND).");`
);

// handleDirectOpenDebugger -> replaced earlier? Wait, no, processMultistack alerts:
content = content.replace(
  /alert\(\`Arrêt de l'exécution de la pile : erreur détectée à l'index \$\{activeStackIndex \+ 1\}\.\`\);/g,
  `await showAlert(\`Arrêt de l'exécution de la pile : erreur détectée à l'index \${activeStackIndex + 1}.\`, "Erreur");`
);
content = content.replace(
  /alert\(\`Arrêt de l'exécution : l'occurrence est introuvable pour la requête n°\$\{activeStackIndex \+ 1\}\.\`\);/g,
  `await showAlert(\`Arrêt de l'exécution : l'occurrence est introuvable pour la requête n°\${activeStackIndex + 1}.\`, "Erreur");`
);
content = content.replace(
  /alert\(\`Arrêt de l'exécution : mode multi avec cherry-picking requis à l'index \$\{activeStackIndex \+ 1\}\. Veuillez sélectionner les occurrences ciblées\.\`\);/g,
  `await showAlert(\`Arrêt de l'exécution : mode multi avec cherry-picking requis à l'index \${activeStackIndex + 1}. Veuillez sélectionner les occurrences ciblées.\`, "Avertissement");`
);

// handleCopyAuditIA
content = content.replace(
  /const handleCopyAuditIA = \(\) => {([\s\S]*?)alert\("Aucune erreur à auditer\."\);([\s\S]*?)alert\("Audit copié dans le presse-papier pour l'IA !"\)([\s\S]*?)alert\("Erreur de copie de l'audit\."\);(\s*)};/m,
  `const handleCopyAuditIA = async () => {$1await showAlert("Aucune erreur à auditer.", "Information");$2await showAlert("Audit copié dans le presse-papier pour l'IA !")$3await showAlert("Erreur de copie de l'audit.", "Erreur");$4};`
);

// handleApplyDebugger
content = content.replace(
  /const handleApplyDebugger = \(parsedPayload\) => {([\s\S]*?)alert\(label \? \`Opération "\$\{label\}" appliquée avec succès !\` : "Requête déboguée appliquée avec succès !"\);/m,
  `const handleApplyDebugger = async (parsedPayload) => {$1await showAlert(label ? \`Opération "\${label}" appliquée avec succès !\` : "Requête déboguée appliquée avec succès !");`
);

// handleAcceptAndCopyDebugger
content = content.replace(
  /const handleAcceptAndCopyDebugger = \(parsedPayload\) => {([\s\S]*?)alert\("Les textes ont été copiés dans les champs FIND et REPLACE\. Vous pouvez les vérifier et appliquer manuellement\."\);/m,
  `const handleAcceptAndCopyDebugger = async (parsedPayload) => {$1await showAlert("Les textes ont été copiés dans les champs FIND et REPLACE. Vous pouvez les vérifier et appliquer manuellement.");`
);

// handleExportProject
content = content.replace(
  /const handleExportProject = \(\) => {([\s\S]*?)alert\("Rien à exporter\. L'historique est vide\."\);([\s\S]*?)alert\("Veuillez donner un nom au projet en haut de l'écran avant de sauvegarder\."\);/m,
  `const handleExportProject = async () => {$1await showAlert("Rien à exporter. L'historique est vide.", "Avertissement");$2await showAlert("Veuillez donner un nom au projet en haut de l'écran avant de sauvegarder.", "Avertissement");`
);

// handleImportProject
content = content.replace(
  /const handleImportProject = \(e\) => {([\s\S]*?)alert\("Format JSON incorrect\. Fichier invalide\."\);([\s\S]*?)alert\(\`Projet "\$\{data\.projectName\}" importé avec succès !"\);([\s\S]*?)alert\("Erreur lors de la lecture du fichier JSON\."\);/m,
  // handleImportProject uses FileReader, so inside the onload callback we need to make it async:
  // We'll replace the reader.onload = (event) => { to reader.onload = async (event) => {
  `const handleImportProject = (e) => {$1await showAlert("Format JSON incorrect. Fichier invalide.", "Erreur");$2await showAlert(\`Projet "\${data.projectName}" importé avec succès !\`);$3await showAlert("Erreur lors de la lecture du fichier JSON.", "Erreur");`
);

// We need a specific fix for FileReader in handleImportProject
content = content.replace(
  /reader\.onload = \(event\) => {/g,
  `reader.onload = async (event) => {`
);

// handleCopyRequestFromHistory
content = content.replace(
  /const handleCopyRequestFromHistory = \(index\) => {([\s\S]*?)alert\("Attention : il est impossible de générer une requête pour ce type d'élément \(snapshot ou info\)\."\);([\s\S]*?)alert\("La requête a bien été copiée dans le presse-papier\."\)([\s\S]*?)alert\("Erreur lors de la copie\."\);/m,
  `const handleCopyRequestFromHistory = async (index) => {$1await showAlert("Attention : il est impossible de générer une requête pour ce type d'élément (snapshot ou info).", "Avertissement");$2await showAlert("La requête a bien été copiée dans le presse-papier.")$3await showAlert("Erreur lors de la copie.", "Erreur");`
);

// handleUndoStrict
content = content.replace(
  /const handleUndoStrict = \(index\) => {([\s\S]*?)alert\("Impossible d'annuler ce type d'élément\."\);/m,
  `const handleUndoStrict = async (index) => {$1await showAlert("Impossible d'annuler ce type d'élément.", "Erreur");`
);

// handleCompressHistory
content = content.replace(
  /const handleCompressHistory = \(index\) => {([\s\S]*?)alert\(message\);([\s\S]*?)alert\("Impossible de compresser : cet item est déjà le premier de la pile\."\);/m,
  `const handleCompressHistory = async (index) => {$1await showAlert(message, "Avertissement");$2await showAlert("Impossible de compresser : cet item est déjà le premier de la pile.", "Avertissement");`
);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated');
