# Golf' Party

Mini-jeu de mini-golf jouable jusqu'à 4 joueurs en local, développé avec Webpack et un canvas HTML.


## Points à développer

- Obstacles mouvants : ces derniers ne prennent pas en compte la collision avc la balle lorsqu'ils lui passent dessus
- Collisions : les collisions de la balle avec l'environnement (principalement les bordures et obstacles) peuvent mal ête comprise et doivent être débuggées. En effet, il se peut que la balle longe les bordures ou arrive à rentrer dans les obstacles, pouvant la bloquer si le tir de la balle est mal effectué.

## Fonctionnalités
- Sélection de 1 à 4 joueurs depuis un écran de démarrage.
- 3 niveaux configurés dans `app/src/levels.json` avec obstacles, tapis roulants et zones d'eau.
- Compteurs de coups par joueur (par niveau et total).
- Passage de niveau/rotation des joueurs automatique, classement final et options « Rejouer » ou « Menu principal ».
- Assets simples (sprites, CSS minimal) packagés par Webpack 5.

## Prérequis
- Node.js 18+ recommandé (le `docker-compose.yml` utilise l'image `node:22-alpine`).
- Docker Desktop si vous préférez lancer via conteneur.

## Démarrer en local
```bash
cd app
npm install
npm start
```
Ouvrez ensuite http://localhost:8001 dans votre navigateur.

## Démarrer via Docker
```bash
docker compose up
```
Le serveur de dev Webpack est exposé sur http://localhost:8001.

## Build de production
```bash
cd app
npm run build
```
Les fichiers prêts à servir sont générés dans `app/dist`.

## Contrôles
- Cliquez sur la balle immobile, maintenez et déplacez la souris pour viser/charger, relâchez pour tirer.
- Chaque tir incrémente les coups du joueur courant; atterrir dans le trou charge le niveau suivant ou passe au joueur suivant.
- Les tapis roulants ralentissent puis déplacent la balle; les zones d'eau réinitialisent la position de départ.

## Personnalisation des niveaux
- Éditez `app/src/levels.json` pour ajuster taille du canvas, position des balles/trous, obstacles, tapis roulants et zones d'eau.
- Les valeurs sont fusionnées avec une configuration par défaut décrite dans `Game.js` (classe `Game.defaultConfig`).

## Structure rapide
- `app/src/index.js` : point d'entrée Webpack, crée le modal de démarrage.
- `app/src/Game/Game.js` : logique principale (boucle, collisions, UI, classement).
- `app/src/Game/*` : entités (balle, obstacles, tapis roulant, eau, etc.).
- `app/src/assets/` : sprites et styles (`css/style.css`).

## Dépannage
- Port 8001 déjà utilisé : modifiez `devServer.port` dans `app/webpack.config.js` puis relancez `npm start` (ou adaptez le port mappé dans `docker-compose.yml`).
- Si rien ne s'affiche, vérifiez la console du navigateur pour d'éventuelles erreurs de build ou de chargement d'assets.