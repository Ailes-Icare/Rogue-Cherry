# Spécifications : Boîte de Message Universelle (`MessageBox.jsx`)

**Fichiers sources** :
- `src/components/MessageBox.jsx`
- `src/context/MessageBoxContext.jsx`

La `MessageBox` remplace toutes les boîtes de dialogue natives du navigateur (`window.alert`, `window.confirm`, `window.prompt`) par une interface stylisée, draggable, et intégrable dans le flux React via un Context API.

---

## 1. Architecture : Context + Composant

### 1.1 `MessageBoxProvider` (Context)
- Enveloppe l'application entière dans `App.jsx` : `<MessageBoxProvider><App /></MessageBoxProvider>`.
- Maintient un état unique `modalState` (null = aucune modale ouverte).
- Expose via `useMessageBox()` les 4 fonctions d'appel.

### 1.2 `useMessageBox()` Hook
Importé dans n'importe quel composant enfant pour déclencher une modale :

```js
const { showAlert, showConfirm, showPrompt, showCustom } = useMessageBox();
```

---

## 2. Les 4 Types de Modales

### 2.1 `showAlert(message, title?, position?)` → `Promise<true>`
- Modale d'information simple.
- **Bouton unique** : "OK" → résout `true`.
- Titre par défaut : `"Information"`.
- Optionnel : `position = { x, y }` pour forcer la position initiale (en pixels, par rapport au coin supérieur gauche de l'écran).

### 2.2 `showConfirm(message, title?)` → `Promise<true | false>`
- Modale de confirmation Oui/Non.
- **Bouton "Annuler"** → résout `false`.
- **Bouton "OK"** → résout `true`.
- Titre par défaut : `"Confirmation"`.
- Usage typique :
  ```js
  if (await showConfirm("Supprimer ce projet ?")) {
    handleDelete();
  }
  ```

### 2.3 `showPrompt(message, defaultValue?, title?)` → `Promise<string | null>`
- Modale de saisie texte libre.
- **Input unique** pré-rempli avec `defaultValue`.
- La touche `Enter` dans le champ soumet le formulaire.
- **Bouton "Annuler"** → résout `null`.
- **Bouton "OK"** → résout la valeur texte saisie (string).
- Titre par défaut : `"Saisie requise"`.

### 2.4 `showCustom(options)` → `Promise<any>`
- Modale entièrement configurable.
- Prend les mêmes arguments que `showModal` en interne.
- Utilisé pour les cas complexes : formulaires multi-champs, boutons multiples, inputs variés.

---

## 3. Configuration des Inputs Dynamiques (`inputs` Array)

La modale peut générer des formulaires à la volée via un tableau `inputs` dans les options :

| Type | Comportement | Retour |
|---|---|---|
| `text` | Champ texte libre. `autoFocus` si défini. `Enter` soumet si champ unique | `string` |
| `number` | Champ numérique. Configurable via `min`, `max`, `step` | `Number` (entier) |
| `checkbox` | Case à cocher. `defaultValue: true/false` | `boolean` |
| `select` | Menu déroulant. `options: [{label, value}]` | Valeur choisie |

L'ensemble des valeurs saisies est renvoyé sous forme de dictionnaire : `{ id_champ: valeur }`.

---

## 4. Boutons et Résolution de la Promesse

```js
buttons: [
  { label: 'Annuler', value: null, variant: 'secondary' },
  { label: 'Valider', value: 'submit', variant: 'primary' }
]
```

| Variante | Style |
|---|---|
| `primary` | Bouton principal (bleu VSCode) |
| `secondary` | Bouton secondaire (gris) |
| `danger` | Bouton destructif (rouge) |

**Logique de résolution** :
- Si `value === 'submit'` → La promesse renvoie le **dictionnaire des inputs** (ou la valeur texte unique en mode `prompt`).
- Si `value !== 'submit'` → La promesse renvoie directement la `value` du bouton cliqué.
- Clic sur la **croix ✕** → Résout `null` (équivalent à "Annuler").

---

## 5. Drag & Drop et Positionnement

- La modale est **draggable** via `useDraggable` : cliquer sur le bandeau titre et faire glisser déplace la fenêtre.
- **Positionnement par défaut** : Centré à l'écran (`items-center justify-center`).
- **Positionnement forcé** : Si `position = { x, y }` est fourni dans les options, la modale s'ouvre à ces coordonnées précises (en `px` absolus). Utilisé par la `LineChoiceModal` et la barre de navigation globale.

---

## 6. Règle d'Usage Obligatoire

> **⚠️ INTERDIT** : Utiliser `window.alert()`, `window.confirm()`, ou `window.prompt()` directement dans le code. Toute boîte de dialogue **doit** passer par `useMessageBox()` pour rester cohérente avec le design de l'application et éviter de bloquer le thread JavaScript.

Composants exemptés : Aucun. La règle est absolue sur toute la codebase.
