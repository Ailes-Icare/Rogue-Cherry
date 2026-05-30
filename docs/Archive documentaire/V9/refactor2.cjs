const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// fix .catch(() => alert(...))
content = content.replace(/\.catch\(\(\) => alert\((.*?)\)\)/g, '.catch(async () => await showAlert($1, "Erreur"))');
// fix .then(() => alert(...))
content = content.replace(/\.then\(\(\) => alert\((.*?)\)\)/g, '.then(async () => await showAlert($1))');
// fix standalone alert(...) that the first script missed
// we need to make sure we don't mess up the async scopes again, but most are already async now.
content = content.replace(/alert\("Texte recherché introuvable dans le code source\. Ouverture du Débogueur pour visualiser le décalage \(Heatmap\)\."\);/g, 'await showAlert("Texte recherché introuvable dans le code source. Ouverture du Débogueur pour visualiser le décalage (Heatmap).", "Avertissement");');

content = content.replace(/alert\("🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !"\);/g, 'await showAlert("🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !");');

content = content.replace(/alert\("Le texte recherché est introuvable\. Ouverture automatique du Débogueur\."\);/g, 'await showAlert("Le texte recherché est introuvable. Ouverture automatique du Débogueur.", "Erreur");');

content = content.replace(/alert\(parsed\.label \? \`Requête "\$\{parsed\.label\}" chargée !\` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider\."\);/g, 'await showAlert(parsed.label ? \`Requête "\${parsed.label}" chargée !\` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider.");');

content = content.replace(/alert\("Erreur syntaxique détectée dans la requête\. Ouverture automatique du Débogueur\."\);/g, 'await showAlert("Erreur syntaxique détectée dans la requête. Ouverture automatique du Débogueur.", "Erreur");');

content = content.replace(/alert\("Texte brut importé dans la zone de recherche \(FIND\)\."\);/g, 'await showAlert("Texte brut importé dans la zone de recherche (FIND).");');

content = content.replace(/alert\("Aucune erreur à auditer\."\);/g, 'await showAlert("Aucune erreur à auditer.", "Information");');

content = content.replace(/alert\(label \? \`Opération "\$\{label\}" appliquée avec succès !\` : "Requête déboguée appliquée avec succès !"\);/g, 'await showAlert(label ? \`Opération "\${label}" appliquée avec succès !\` : "Requête déboguée appliquée avec succès !");');

content = content.replace(/alert\("Les textes ont été copiés dans les champs FIND et REPLACE\. Vous pouvez les vérifier et appliquer manuellement\."\);/g, 'await showAlert("Les textes ont été copiés dans les champs FIND et REPLACE. Vous pouvez les vérifier et appliquer manuellement.");');

content = content.replace(/alert\("Format JSON incorrect\. Fichier invalide\."\);/g, 'await showAlert("Format JSON incorrect. Fichier invalide.", "Erreur");');

content = content.replace(/alert\(\`Projet "\$\{data\.projectName\}" importé avec succès !"\);/g, 'await showAlert(\`Projet "\${data.projectName}" importé avec succès !\`);');

content = content.replace(/alert\("Erreur lors de la lecture du fichier JSON\."\);/g, 'await showAlert("Erreur lors de la lecture du fichier JSON.", "Erreur");');

content = content.replace(/alert\("Attention : il est impossible de générer une requête pour ce type d'élément \\(snapshot ou info\\)\."\);/g, `await showAlert("Attention : il est impossible de générer une requête pour ce type d'élément (snapshot ou info).", "Avertissement");`);

content = content.replace(/alert\("Impossible d'annuler ce type d'élément\."\);/g, `await showAlert("Impossible d'annuler ce type d'élément.", "Erreur");`);

content = content.replace(/alert\(message\);/g, 'await showAlert(message, "Avertissement");');

content = content.replace(/alert\("Impossible de compresser : cet item est déjà le premier de la pile\."\);/g, 'await showAlert("Impossible de compresser : cet item est déjà le premier de la pile.", "Avertissement");');

// Fix handleImportProject specifically, replacing reader.onload with async
content = content.replace(/reader\.onload = \(event\) => {/g, 'reader.onload = async (event) => {');

// Fix the template literal mismatch
content = content.replace(/await showAlert\(\`Projet "\$\{data\.projectName\}" importé avec succès !"\);/g, 'await showAlert(`Projet "${data.projectName}" importé avec succès !`);');

fs.writeFileSync('src/App.jsx', content);
