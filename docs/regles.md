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
| Main de départ, puis mulligan : on peut remplacer des cartes, et les cartes rejetées retournent dans le deck. | [sûr] (taille de la main de départ [à trancher]) |
| Main de 7 cartes maximum. Une carte piochée au-delà est défaussée. | [sûr] |
| Pioche : 1 carte au début de chaque tour. | [probable] |
| Deck vide : à chaque pioche impossible, le joueur subit des dégâts qui augmentent de 1 à chaque tour (1, 2, 3…). | [sûr] (la cible exacte, pierre ou leader, est [à trancher]) |
| Mana : la réserve grandit à chaque tour et se recharge entièrement au début du tour. On voit 0/4 sur la capture. | [à trancher] : mana de départ, gain par tour (+1 ?), maximum (10 ?) |
| Un joueur qui commence en second a-t-il une compensation ? | [à trancher] |

## 4. Le tour d'un joueur

| Règle | Confiance |
|---|---|
| Le joueur actif peut, dans l'ordre qu'il veut : jouer des cartes (en payant leur coût en mana), utiliser la capacité de son leader, puis déplacer et faire attaquer ses unités. | [sûr] |
| Capacité du leader : elle coûte de la mana (2 en général) et s'utilise une fois par tour. | [probable] |
| **Déploiement** : une unité jouée apparaît sur une case libre adjacente à sa propre pierre (ou à un point de déploiement, comme le drapeau d'Enyo). | [probable] (en bêta : adjacente au leader) |
| Une unité qui vient d'être déployée est **épuisée** jusqu'au tour suivant : elle ne peut ni bouger ni attaquer. Sauf avec Charge ou Initiative. | [sûr] |
| Chaque unité a son propre tour d'action : elle peut se déplacer d'au plus « déplacement » cases, puis attaquer ou utiliser sa capacité. Attaquer termine ses actions. | [sûr] |
| On peut déplacer une unité, agir avec une autre, puis revenir faire attaquer la première. | [sûr] |
| Déplacement en orthogonal uniquement (pas de diagonale), sans traverser les unités ni les obstacles. | [à trancher] |
| Une unité au corps à corps attaque une case adjacente. | [probable] (adjacence diagonale [à trancher]) |
| Une unité à distance attaque n'importe quelle cible, hors de portée de mêlée. | [à trancher] (portée exacte) |
| **Riposte** : l'unité attaquée au corps à corps contre-attaque si elle survit. Il n'y a pas de riposte contre une attaque à distance. | [probable] (déduit du mot-clé Pardon, « l'unité attaquée ne riposte pas ») |
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

## 7. Questions à trancher en priorité

1. Mana : combien au tour 1, combien de gain par tour, et quel maximum ?
2. Taille de la main de départ, et compensation pour le joueur qui commence en second.
3. Déplacement : diagonales ou non ? Peut-on traverser ses propres unités ?
4. Mêlée : une case en diagonale compte-t-elle comme adjacente ?
5. Portée des unités à distance : illimitée, ou bloquée par les obstacles ?
6. Riposte : confirmes-tu qu'elle existe en mêlée et pas à distance ?
7. Où se déploient les unités : autour de la pierre, ou sur toute la colonne de départ ?
