# Règles de Hand of Realms

Ces règles reproduisent celles de Hand of the Gods: SMITE Tactics (Hi-Rez, 2017-2020). Elles servent de spécification au moteur : chaque règle codée a un test qui la cite.

Chaque règle porte un niveau de confiance :
- **[sûr]** : confirmé par l'utilisateur, ou par le wiki et les notes de patch de façon cohérente.
- **[probable]** : une seule source, ou une source ancienne (alpha/bêta).
- **[à trancher]** : inconnu ou contradictoire. Une décision est nécessaire avant de coder la règle.

Sources : dump du wiki fandom (`data/raw/hotg-wiki-pages.json`, 246 pages, licence CC BY-SA), notes de patch alpha 0.0.198 à bêta 0.16.501, guide TenTonHammer (bêta, 2017), capture d'écran et souvenirs de l'utilisateur.

## 1. Matériel

| Règle | Confiance |
|---|---|
| Plateau rectangulaire de 5 rangées (A à E) sur 8 colonnes (1 à 8). | [sûr] |
| Chaque joueur a une **pierre d'invocation** (cristal) : en C2 pour le joueur 1, en C7 pour le joueur 2. | [sûr] |
| La pierre a 25 PV et 0 d'attaque. Elle ne bouge pas. Certains effets peuvent augmenter ses PV. | [sûr] |
| Le **leader** (la divinité de la faction) se tient hors du plateau, sur le bord de son camp. Il ne peut pas être attaqué. | [probable] (en bêta, le leader était une unité sur le plateau avec 18 à 20 PV) |
| Le terrain peut contenir des obstacles : rochers et piliers bloquent le déplacement, mais pas les tirs à distance. | [probable] |
| Hautes herbes : une unité qui s'y trouve ne peut être ciblée que par un ennemi adjacent. | [probable] |
| Feu : une unité qui finit son tour sur une case en feu subit 1 dégât. La traverser ne fait rien. | [probable] |
| Urnes (2 PV) : la détruire donne une carte au joueur (Potion de mana +1 mana ce tour, Urne d'attaque +1 ATQ, Urne de vie). | [probable] |

## 2. Deck

| Règle | Confiance |
|---|---|
| 25 cartes par deck (20 avant la bêta 0.16). | [sûr] |
| 1 seul leader par deck. Il fixe la faction : toutes les cartes doivent être de cette faction ou neutres. | [sûr] |
| 2 exemplaires maximum par carte, et 1 seul pour une légendaire. | [sûr] |

## 3. Déroulement d'une partie

| Règle | Confiance |
|---|---|
| Victoire : la pierre d'invocation adverse tombe à 0 PV. | [sûr] |
| Main de départ : 3 cartes pour le premier joueur (tiré au hasard), 4 pour le second. | [sûr] (MMOHuts, test de la 1.0, mars 2018) |
| Mulligan avant le tour 1 : on peut remplacer tout ou partie de sa main. Les cartes rejetées retournent dans le deck. | [sûr] |
| Main de 7 cartes maximum. Une carte piochée au-delà est défaussée. | [sûr] |
| Pioche : 1 carte au début de chaque tour. | [sûr] (MMOHuts 1.0) |
| Deck vide : à chaque pioche impossible, le joueur subit des dégâts qui augmentent de 1 à chaque tour (1, 2, 3…). | [sûr] (la cible exacte, pierre ou leader, est [à trancher]) |
| Mana : 2 au premier tour. Au début de chaque tour suivant, la réserve gagne +1 de maximum (jusqu'à 10) et se recharge entièrement. | [sûr] (MMOHuts 1.0 : « recharge your Mana/gain another point (up to 10) ») |
| La mana non dépensée est perdue en fin de tour. | [probable] |
| Compensation du second joueur : une carte de plus en main, plus une carte « Mana » à 0 de coût qui donne +1 mana pour un tour. | [sûr] (MMOHuts 1.0 ; en bêta 2017, la potion allait au premier joueur) |

## 4. Le tour d'un joueur

| Règle | Confiance |
|---|---|
| Le joueur actif peut, dans l'ordre qu'il veut : jouer des cartes (en payant leur coût en mana), utiliser la capacité de son leader, puis déplacer et faire attaquer ses unités. | [sûr] |
| Capacité du leader : elle coûte 2 mana (sauf modificateur) et s'utilise une fois par tour. Elle n'empêche pas le leader d'agir autrement. | [sûr] (MMOHuts 1.0, patch 0.15) |
| **Déploiement** : une unité jouée apparaît sur une case libre autour de sa propre pierre, sauf si le texte de la carte dit autre chose (Ah Puch, drapeau d'Enyo, Cri de guerre « n'importe où »). | [sûr] (MMOHuts 1.0) |
| Les objets (sorts) se lancent autour de sa propre pierre. | [probable] (bêta 2017, contredit par les objets qui ciblent n'importe quel ennemi : à vérifier carte par carte) |
| Une unité qui vient d'être déployée est **épuisée** jusqu'au tour suivant : elle ne peut ni bouger ni attaquer. Sauf avec Charge ou Initiative. | [sûr] |
| Chaque unité a son propre tour d'action : elle peut se déplacer d'au plus « déplacement » cases, puis attaquer ou utiliser sa capacité. On peut se déplacer puis attaquer, jamais attaquer puis se déplacer. | [sûr] |
| On peut déplacer une unité, agir avec une autre, puis revenir faire attaquer la première. | [sûr] |
| Le déplacement peut traverser les unités alliées, mais pas les ennemies ni les obstacles. | [sûr] (MMOHuts 1.0) |
| Déplacement en orthogonal uniquement (pas de diagonale). | [à trancher] (aucune source) |
| Une unité au corps à corps attaque une case adjacente. | [probable] (adjacence diagonale [à trancher]) |
| Chaque unité a sa propre portée d'attaque. Les obstacles ne bloquent pas les tirs. | [sûr] |
| Portée et forme de la portée d'une unité à distance. | [à trancher] (aucune source, et le wiki ne donne pas de champ « portée ») |
| **Riposte** : l'unité attaquée inflige son ATQ à l'attaquant si celui-ci est dans sa propre portée d'attaque. Ainsi, une unité de mêlée ne riposte pas à un tir lointain, mais une unité à distance riposte à un tir. Pardon et « immunisé à la riposte » l'annulent. | [probable] (TenTonHammer 2017 et GameOverThirty : « Return Damage if the attacker is in range ») |
| Les dégâts sont simultanés en mêlée : l'attaquant inflige son ATQ, puis subit l'ATQ du défenseur. | [à trancher] |
| Les unités gardent leurs dégâts d'un tour à l'autre (pas de soin automatique). | [probable] |
| Temps de tour limité (alerte à 20 s de la fin). | hors moteur |

## 5. Types de cartes

| Type | Rôle | Confiance |
|---|---|---|
| Leader | Hors deck. Il fixe la faction et donne une capacité payante. | [sûr] |
| Dieu (God) | Unité puissante, souvent avec un Cri de guerre ou une capacité. | [sûr] |
| Serviteur (Minion), Bête (Beast) | Unités de base. | [sûr] |
| Structure | Unité immobile (ruche, canon, drapeau…). | [sûr] |
| Objet (Item) | Sort à usage unique (dégâts, bonus, pioche…). | [sûr] |

## 6. Mots-clés

| Mot-clé | Effet | Confiance |
|---|---|---|
| Warcry (Cri de guerre) | S'active quand la carte est déployée. | [sûr] |
| Afterlife (Outre-tombe) | S'active quand l'unité meurt. | [sûr] |
| Charge | Peut agir le tour où elle est déployée. | [sûr] |
| Initiative | Ne subit pas l'épuisement à son déploiement. | [probable] (proche de Charge, différence [à trancher]) |
| Guard (Garde) | Les alliés adjacents ne peuvent pas être ciblés directement par les unités ennemies. Ne protège ni des objets ni des zones d'effet. | [sûr] |
| Protect X / Shield X | Réduit chaque dégât subi de X. Ne se cumule pas : on garde la plus forte valeur. | [sûr] |
| Immune: X | Ne peut pas être ciblé par X (Mêlée, Distance, Sorts, Objets…). | [sûr] |
| Colossal | Son effet passif se déclenche au début de son tour. | [sûr] |
| Command | Se déclenche quand son contrôleur joue un objet. | [sûr] |
| Stealth (Furtif) | Ne peut pas être ciblé tant qu'il n'a pas attaqué. | [probable] |
| Stun (Étourdi) | Ne peut pas agir pendant son prochain tour. | [probable] |
| Root (Enraciné) | Ne peut pas se déplacer. | [probable] |
| Silence | Perd ses passifs et ses capacités. | [probable] |
| Disarm (Désarmé) | Ne peut pas attaquer. | [sûr] |
| Poison | L'unité meurt à la fin de son prochain tour. | [sûr] |
| Pardon | La cible de son attaque ne riposte pas. | [sûr] |
| Cleave (Enchaînement) | Son attaque touche aussi les ennemis adjacents à la cible. | [probable] |
| Forge / Discover | Crée une carte dans la main (Discover propose un choix). | [probable] |
| Banish (Bannir) | Retire l'unité du plateau jusqu'au prochain tour. | [probable] |

## 7. Questions à trancher

Aucune source trouvée (wiki, notes de patch, 6 articles de 2017-2020) ne répond à ces points. Ils restent à décider :

1. Déplacement : les diagonales sont-elles autorisées ?
2. Mêlée : une case en diagonale compte-t-elle comme adjacente ?
3. Portée des unités à distance : quelle distance, et quelle forme (ligne, losange, carré) ?
4. Riposte : a-t-elle lieu avant ou après la mort du défenseur (dégâts simultanés ou non) ?

Sources supplémentaires : [MMOHuts, test de la 1.0 (mars 2018)](https://mmohuts.com/news/hand-of-the-gods-launch-review), [MMOHuts, bêta ouverte (août 2017)](https://mmohuts.com/news/hand-of-the-gods-open-beta-impressions), [TenTonHammer (février 2017)](https://www.tentonhammer.com/guides/smite-tactics-the-basics), [GameOverThirty (alpha)](https://gameoverthirty.com/hand-of-the-gods/), [gg2ez (2020)](https://gg2ez.blog/2020/02/05/hand-of-the-gods-smite-tactics-what-is-it/).
