# Données

- `raw/hotg-wiki-pages.json` : dump brut (wikitexte) des 246 pages du wiki [handofthegods.fandom.com](https://handofthegods.fandom.com), récupéré le 2026-11-20 via l'API MediaWiki. Le contenu du wiki est sous licence CC BY-SA 3.0, auteurs : les contributeurs du wiki fandom.
- `hotg-cards.json` : 188 cartes extraites par `npx tsx scripts/extract-cards.ts`. Ne pas éditer à la main : corriger l'extracteur ou ajouter une surcharge.

Limites connues : le wiki date surtout de la bêta (2017). Certains panthéons sont incomplets (Maya, Hindou, Romain), et des stats ont pu changer avant la version 1.0.
