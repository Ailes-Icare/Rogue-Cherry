---
name: Patterns React Avancés
description: Utilisation des patterns modernes pour un code robuste (React 19+)
---

# Skill : Patterns React Avancés

> [!NOTE] 
> **🔄 MIGRATION REACT :** Remplace les patterns de conception orientés objet classiques par les patterns déclaratifs et modernes de l'écosystème web.

## Objectif
Aller au-delà de l'assemblage basique de balises JSX. Utiliser les patterns que les développeurs séniors utilisent pour créer des composants extrêmement flexibles et maintenables.

## 1. Le Pattern "Compound Components" (Composants Composites)

C'est LE pattern à utiliser pour les composants complexes (ex: Dropdowns, Modals, Accordéons, Tabs). Au lieu de passer 15 props incompréhensibles à un seul composant monolithique, on expose des sous-composants.

❌ **Mauvaise approche (Monolithe) :**
```jsx
<Dropdown 
  items={["A", "B", "C"]} 
  onSelect={handleSelect} 
  triggerText="Menu" 
  isDarkTheme={true}
/>
```

✅ **Bonne approche (Compound) :**
```jsx
<Dropdown>
  <Dropdown.Trigger>Menu</Dropdown.Trigger>
  <Dropdown.Menu>
    <Dropdown.Item onClick={() => handleSelect("A")}>A</Dropdown.Item>
    <Dropdown.Item onClick={() => handleSelect("B")}>B</Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
```
*Comment l'implémenter ?* Utiliser le `Context API` à l'intérieur du composant parent (`Dropdown`) pour partager l'état (ouvert/fermé) avec les enfants sans exposer ce state à l'utilisateur du composant.

## 2. Standards React 19 (Les nouveautés à adopter)

L'écosystème React évolue. Nous adoptons les conventions de React 19.

### Fin du cauchemar `forwardRef`
❌ **Avant (React 18) :** 
```jsx
const MonInput = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />
});
```

✅ **Maintenant (React 19) :**
`ref` est désormais une prop standard ! Plus besoin de l'enveloppe complexe.
```jsx
function MonInput({ ref, ...props }) {
  return <input ref={ref} {...props} />
}
```

### Remplacement partiel de `useContext` par `use()`
Dans React 19, on peut utiliser le hook `use(MyContext)` au lieu de `useContext(MyContext)`. L'avantage ? `use()` peut être appelé à l'intérieur de conditions (les boucles `if`), ce qui casse la vieille règle stricte des hooks.

## 3. Custom Hooks (L'extraction de logique)

Si un composant contient plus de 3 ou 4 hooks natifs (`useState`, `useEffect`) qui gèrent un processus métier spécifique, **cette logique doit être extraite dans un Custom Hook**.

❌ **Tout dans le composant :**
```jsx
function Profil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { /* fetch user logic */ }, []);
  // ...
}
```

✅ **Hook extrait :**
```jsx
function Profil() {
  const { user, loading } = useFetchUser(userId);
  // Le composant ne gère que l'affichage !
}
```

## Plafond de complexité
**❌ Interdit :** Ne pas utiliser les *Higher-Order Components (HOC)* (`withRouter`, `withTheme`). C'est un pattern obsolète, remplacé massivement par les Hooks.
