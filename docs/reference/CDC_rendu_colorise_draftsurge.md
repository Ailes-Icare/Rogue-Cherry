# Spécifications Fonctionnelles : Moteur de Rendu DraftSurge

Ce document explicite le comportement mathématique et visuel du moteur de comparaison (LCS) issu de la V7.5, pour la colorisation de l'historique et des différences.

## Mécanique Globale du Moteur

L'algorithme opère en **deux passes** :
1. **Passe macroscopique (Ligne par Ligne)** : Compare les lignes entières pour détecter les insertions pures, suppressions pures, ou modifications de lignes.
2. **Passe microscopique (Intra-Ligne)** : Si une ligne est "modifiée" (similarité >= 25%), un second algorithme LCS la découpe en *tokens* (mots et espaces) pour détecter exactement ce qui a changé au caractère près.

---

## Réponses aux Cas d'Usage (Visuel sur le texte final `tAfter`)

### 1. Nouvelle ligne insérée (`state === 2`)
- **Texte** : La totalité de la ligne reçoit la classe `hl-ins` (surlignée d'un fond vert/vif).
- **Gouttière (Numéros)** : La présence du marqueur `hl-ins` déclenche l'ajout de la classe `gutter-mod` sur le numéro de la ligne (barre verticale gauche).

### 2. Ligne entière supprimée (`state === 1`)
- **Texte** : La ligne n'existe plus physiquement. À l'endroit de la jointure, le moteur insère un marqueur de longueur 0 (`hl-del`). Visuellement, cela crée un "tiret" ou une icône rouge entre les deux lignes restantes.
- **Gouttière (Numéros)** : La classe `gutter-mod` s'applique à la ligne hôte du marqueur.

### 3. Ligne conservée, avec mots supprimés à l'intérieur (`state === 3`)
- **Texte** : Le fond de la ligne reçoit la classe globale `hl-line-mod` (mutation, fond violacé/bleuté léger). À l'emplacement exact du mot supprimé, le marqueur `hl-del` de longueur 0 est inséré (tiret rouge intra-texte).
- **Gouttière (Numéros)** : Reçoit la classe `gutter-mod` grâce au marqueur global `hl-line-mod`.

### 4. Ligne conservée, avec mots rajoutés à l'intérieur (`state === 3`)
- **Texte** : Le fond global prend la classe `hl-line-mod`. Par-dessus, les mots rajoutés reçoivent la classe `hl-ins` (surlignage vert fort). S'il y a remplacement d'un mot par un autre, ils reçoivent `hl-word-mod`.
- **Gouttière (Numéros)** : Reçoit la classe `gutter-mod`.

### 5. Ligne NON modifiée, mais incluse au milieu du bloc modifié
- **Texte** : Toute ligne intacte située entre la `firstChange` et la `lastChange` du bloc perd son statut de "Trim" et reçoit la classe globale `hl-line-mod`. Le fond muté unifie visuellement tout le bloc.
- **Gouttière (Numéros)** : Le marqueur `hl-line-mod` prolonge la barre verticale `gutter-mod` de manière ininterrompue tout au long du bloc.

---

## Logique d'identification des Groupes de Mots (LCS Intra)

1. **L'indice de Similarité (Seuil de 25%)** : 
   La regex `/[a-zA-Z0-9\-_]+/g` extrait les mots. Si l'intersection des mots (Jaccard sur des Sets) entre l'ancienne et la nouvelle ligne est >= 0.25 (25% des mots survivent), la ligne est appariée.

2. **Le découpage (Tokenization)** :
   Une fois appariée, la ligne est redécoupée par `/[a-zA-Z0-9]+|\s+|./g`. Un "token" est soit un mot alphanumérique, un bloc d'espaces continu, soit un caractère spécial unique. C'est cette granularité ultra-fine qui permet la précision chirurgicale de la colorisation.
