# Hand of Realms (hor)

Jeu de cartes tactique sur plateau, inspiré des mécaniques de Hand of the Gods (Hi-Rez, 2018-2020).
Moteur de règles d'abord, en TDD, sans graphismes. Le thème (factions) reste un fichier de données séparé.

## Documents
- Règles complètes, avec un niveau de confiance par règle : [docs/regles.md](docs/regles.md)
- Base des 188 cartes du jeu d'origine : [data/hotg-cards.json](data/hotg-cards.json) (voir [data/README.md](data/README.md))

## Règles implémentées (src/engine.ts)
- Plateau de 5×8, cristaux en C2/C7 à 25 PV. La victoire va à celui qui détruit le cristal adverse.
- Mise en place : 3 cartes pour le premier joueur, 4 cartes plus une carte Mana pour le second.
- Mana : 2 au premier tour, puis +1 par tour jusqu'à 10. Pioche à chaque tour, main limitée à 7, fatigue croissante quand le deck est vide.
- Déploiement autour de son cristal. L'unité déployée est épuisée jusqu'à son prochain tour.
- Déplacement orthogonal, à travers les alliés mais pas les ennemis ni les cristaux. Un déplacement puis une attaque par tour, jamais l'inverse.
- Mêlée sur les 8 cases voisines, avec riposte si le défenseur survit. Tir à 3 cases (distance de Manhattan), sans riposte.

## Pas encore codé
Objets (sauf la carte Mana), capacités de leader, mots-clés (Warcry, Afterlife, Guard, Charge…), terrain, mulligan.

## Lancer
    npm install
    npm test
    npx tsx scripts/extract-cards.ts   # régénère data/hotg-cards.json
    npm run build:ui                   # interface de test -> dist/hor.html (fichier autonome, à ouvrir dans un navigateur)

## Interface de test
Partie à deux joueurs sur le même écran : choix des panthéons, decks de 25 unités tirées au hasard (graine réglable). Cliquer une carte, puis une case dorée pour déployer. Cliquer une unité, puis une case verte pour la déplacer ou une case rouge pour attaquer.
