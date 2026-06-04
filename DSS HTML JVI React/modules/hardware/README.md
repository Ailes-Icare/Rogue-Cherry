# Module : Hardware & IoT

> Guide pour interfacer React avec du matériel physique (Arduino, Capteurs, Robots, Bluetooth).

## Les ponts entre le Web et la Machine

Le navigateur Chrome offre aujourd'hui des APIs natives incroyables pour parler au matériel sans aucun serveur backend :

- **Web Serial API** : Pour lire un port COM (ex: Arduino en USB).
- **Web Bluetooth API** : Pour se connecter à des capteurs sans-fil.
- **WebUSB API** : Pour des périphériques spécifiques.
- **WebSockets** : Pour parler à un Raspberry Pi sur le réseau local.

## Architecture Matérielle React

```
src/
├── hardware/            ← Isolateur matériel (Abstractions)
│   ├── serial/          ← Scripts utilisant `navigator.serial`
│   └── bluetooth/       ← Scripts utilisant `navigator.bluetooth`
├── store/
│   └── useSensorStore.js ← L'état temps réel des capteurs
├── components/
│   ├── dashboard/       ← Affichage des jauges et des LED
│   └── connection/      ← Boutons "Connecter l'appareil" (Nécessite interaction utilisateur)
```

## Piège classique : Sécurité du Navigateur

Le navigateur **refusera** toujours d'ouvrir un port série ou Bluetooth au démarrage de la page (pour des raisons de sécurité). 
L'ouverture d'un port ne peut se faire **QUE** suite à un clic physique de l'utilisateur sur un bouton `<button onClick={connectToDevice}>`.

## Gestion des flux de données à haute fréquence

Un capteur peut envoyer 1000 valeurs par seconde.
**Ne mettez JAMAIS ces 1000 valeurs dans un State React (`useState`)**, votre UI va s'effondrer.
- Utilisez un `useRef` pour accumuler les valeurs.
- Mettez à jour le graphique (ex: Canvas ou Chart) à 60 FPS (via `requestAnimationFrame`), en piochant dans le `useRef`.
