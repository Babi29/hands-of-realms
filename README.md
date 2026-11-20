# Hand of Realms (hor)

Jeu de cartes tactique sur plateau, inspiré des mécaniques de Hand of the Gods (Hi-Rez, 2018-2020).
Moteur de règles d'abord, en TDD, sans graphismes. Le thème (factions) reste un fichier de données séparé.

## Documents
- Règles complètes, avec un niveau de confiance par règle : [docs/regles.md](docs/regles.md)
- Base des 188 cartes du jeu d'origine : [data/hotg-cards.json](data/hotg-cards.json) (voir [data/README.md](data/README.md))

## Règles implémentées
- Plateau de 5 rangées (A-E) sur 8 colonnes (1-8).
- Cristal du joueur 1 en C2, du joueur 2 en C7, 25 PV chacun.
- Un cristal à 0 PV fait perdre son propriétaire.

## Règles connues, pas encore codées
- Deck de 25 cartes, 2 exemplaires maximum par carte (sauf légendaires). Main de 7 cartes maximum.
- Une unité posée attend un tour avant d'agir (sauf « Initiative »). Attaquer termine le tour de l'unité.
- Mana croissante (4 au tour observé). Règle exacte de gain à confirmer.

## Lancer
    npm install
    npm test
    npx tsx scripts/extract-cards.ts   # régénère data/hotg-cards.json
