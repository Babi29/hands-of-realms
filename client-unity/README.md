# Client Unity de Hand of Realms

Prototype 3D en formes simples (plateau, capsules, cylindres). Il se connecte au serveur de jeu, qui applique les règles. Le client ne fait qu'afficher l'état, animer les événements et envoyer les clics.

## Installer (une fois)

1. [Unity Hub](https://unity.com/download), puis dans Hub : *Installs > Install Editor > Unity 6 (LTS)*. Cocher les modules **WebGL Build Support** et **Android Build Support** (ce dernier peut attendre).
2. [Node.js LTS](https://nodejs.org) et [Git](https://git-scm.com).
3. `git clone https://github.com/Babi29/hands-of-realms.git` puis, dans le dossier : `npm install`.

## Jouer une partie de test

1. Lancer le serveur : `npm run server` (écoute sur `ws://localhost:8080`).
2. Unity Hub > *Projects > Add > Add project from disk* > choisir le dossier `client-unity`. Si Hub signale une autre version d'éditeur, choisir la version Unity 6 installée.
3. Au premier lancement, Unity télécharge les paquets (NativeWebSocket depuis GitHub, Newtonsoft). Attendre la fin de l'import.
4. Ouvrir n'importe quelle scène (la scène vide par défaut suffit) et appuyer sur **Play**. Le script `GameRoot` construit tout seul la caméra, la lumière et le plateau.
5. Remplir le formulaire (même salon pour les deux joueurs) et cliquer *Rejoindre*.
6. Second joueur : *File > Build And Run* (plateforme Windows ou Mac) lance une deuxième fenêtre à côté de l'éditeur. La partie démarre quand deux clients ont rejoint le même salon.

## Commandes

- Clic sur une carte de la main, puis sur une case dorée : déploiement.
- Clic sur une de ses unités : cases vertes = déplacement, rouges = attaque.
- **Passer** termine le tour. Le bouton clignote quand plus aucune action n'est possible.

## Structure

- `Assets/HandOfRealms/Core` : C# pur (protocole, contrôleur de clics). Testé hors Unity : `dotnet test Tests.Core`.
- `Assets/HandOfRealms/Unity` : scripts Unity (`GameRoot` point d'entrée et interface, `BoardView` plateau et animations, `NetClient` WebSocket).
- `Tests.Core/fixtures/server-session.json` : session réelle produite par le serveur (`test/contract.test.ts`). Si le protocole change côté serveur, `UPDATE_FIXTURES=1 npx vitest run test/contract.test.ts` régénère le fichier et les tests C# vérifient que le client sait toujours le lire.
