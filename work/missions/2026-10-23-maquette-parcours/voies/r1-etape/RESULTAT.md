OK — rail de sa base v4.10 porté tel quel (37/37 fonctions), 15 états de l'étape rendus

Voie r1-etape (D123, D124), 24.10. Reprise de l'étape Houblons, construite dans `prototypes/houblons-v4/maquettes/parcours-etape` (comparée à 5345f6ad : FONCTIONS-RAIL ECHEC 21/37, ETATS ECHEC 15/15).

## Fichiers écrits (Possède seulement)
- `parcours/src/ecrans/ma-biere/rail.ts` (nouveau) : port ligne à ligne de `generateur/etape-consolide.js` : valeurs du rail, Dock à plateau ×3, échelle du geste (D69), loupe qui passe au segment du doigt (D67), jetons, minutes écrites, lâcher, geste interrompu (D42), clic avalé après le geste.
- `parcours/src/ecrans/ma-biere/rail.css` (nouveau) : `etape-consolide.css` aux couleurs de ses maquettes (D106), classes `pq-mb-`.
- `Frise.tsx` (réécrit) : les rangées de la base (`data-rang`), « Ébullition 60′ › » (`<a>` de renvoi), la poignée (`role=slider`, ↑ ↓ sur toutes les valeurs), l'emplacement « + » d'une recette vide ; `valeurDe`, `appliquerValeur`, `useModifier` (change un ajout en place via `etat/poser`, ordre gardé, `gestes + 1` ; aucune écriture dans `etat/`).
- `Carte.tsx` : corps de la carte. Type ébullition → whirlpool → à froid → premier moût ; dose au pas de 2 g ; « − 20 min + », « − J+3 + » ; « aucun IBU » ; biotransformation et signaux (`yeastSignals` du moteur) ; effet prévu sur un ajout neuf ; « double usage ».
- `Ajouter.tsx` : propositions du moteur comme sa base : `quickAdds` (stock d'abord, puis un houblon à acheter ; 3, 2, 1 selon la place) ; `buildFromEmpty` pour une recette vide (Pahto « ou » Marco Polo à 60′, puis trois aromatiques) ; ♡ à trois choix ; champ qui cherche dans tout le catalogue (D21) ; jauge IBU à vide.
- `Base.tsx` : props facultatives, interface gardée pour r2 et r4 : `Bandeau ecart` (« +2 », « −60 » au-dessus de l'IBU), `Alerte long` (« Boisé et résineux trop marqué »). Ajout aussi : `PisteBase` relie le point « avant » au point actuel quand `avant` est donné.
- `index.tsx` : écart d'IBU affiché 2 s, recette d'avant le dernier geste pour les points du profil, marqueurs `data-etat`.
- `fiche/gestes.ts` : à l'ordinateur, survol long sur toute la carte hors de ses commandes (D49).
- `main.tsx`, `vite.config.ts` : `cas-ebu200` (route ma-biere seule), `cas-k3` de sa base (Nugget 42,5 g à 60′, Motueka 10 g à 10′, Cascade 20 g au whirlpool 80 °C 20 min, Citra cryo 40 g à froid J+3), `cas-k2` (sans houblon).
- `NOTE.md` de ma-biere : section « Reprise D124 ».
- Captures sous `prototypes/houblons-v4/maquettes/parcours-etape/captures/` (`etats/`, `rail/`, `cote-a-cote/`). Ce dossier est ignoré par git.

## Critères (rejoués depuis la racine, après la dernière construction)
- G1 `CONSTRUIT OK (9 pages)`
- G2 `FONCTIONS-RAIL OK (37/37)`
- G3 `GESTE-ETAPE OK (froid, 3 segments)`
- G4 `GESTE-ETAPE OK`
- G5 `ETATS OK (15/15) ; 2 voulu(s) non rejoué(s)`
- G6 `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` : contrôles stepper, geste, appui, légende, profil-ouvre, états, fonctions-rail, froid et reprise.
- G7 `COMMUN OK` (`--sans=mots`)
- G8 `TYPES OK`
- G10 `TEINTE OK 6/6`
- En plus, demandé par le pilote : `controle-etats --ecran=fiche` → `ETATS OK (16/16)`. Marqueurs posés : `etat-fiche-appui-long-carte etat-fiche-appui-en-cours etat-fiche-survol-1280` sur la carte de Nugget, `etat-fiche-appui-long-citra` sur l'ajout de Citra cryo.
- Essais : G2 trois essais. 35/37 au premier : Motueka chevauchait « 0′ » de 3 à 4 px quand le doigt était au whirlpool, et sautait de 46 px. Causes : le nom du jeton était plus haut que dans la base, la carte tenue mesurait 41 px au lieu de 31, et la règle de mouvement réduit de l'app supprimait le fondu de la base. G7 deux essais : `data-houblon` posé sur la poignée, et un rayon de 10 px. G6 deux essais : l'icône « à acheter » n'était pas nommée dans la légende.

## Fonctions du rail rendues (les 18 perdues sur 5345f6ad ; captures `captures/cote-a-cote/rail-*.png`, base à gauche)
- **Loupe à plateau ×3 qui suit le doigt** et passe au segment où il est : rail-loupe-rapport, rail-loupe-suit-segment. Montage : `rail-ebullition-35-pendant.png`.
- **Graduations régulières** autour du doigt : rail-ebullition-reguliere.
- **IBU recalculé au lâcher seulement**, avec son écart écrit au-dessus du total : rail-ibu-au-lacher, rail-ibu-ecart. Montage : `rail-ebullition-35-apres.png`.
- **Geste interrompu** (touchcancel) : la carte revient à sa place, rien ne change. Montages : `rail-interrompu-*.png`.
- **Whirlpool** : échelle en °C de 100 à 60 par 5, deux lâchers possibles, « − 20 min + ». Montages : `rail-whirlpool-85-*.png`, `rail-whirlpool-duree.png`.
- **Fermentation et post-fermentation** en J+0 à J+14 : réglage « − J+n + », « à froid », « aucun IBU », lâcher à J+10 en post-fermentation. Montages : `rail-fermentation-j3-*.png`, `rail-post-fermentation-j10-*.png`.
- **Carte repliée en puce vers le froid** (32 px) : contrôle geste-etape --froid.
- **D'un seul geste**, de la durée d'ébullition à J+14, à 844 et à 620 px : rail-extremes. Montages : `rail-k3-extreme-*.png`.
- **« Ébullition 60′ › »** et son renvoi : rail-ebullition-renvoi.
- **Page cas-ebu200** : rail-ebu200. Montages : `rail-ebullition-200-*.png`.
- Les 21 fonctions déjà gardées sur 5345f6ad tiennent toujours.
- Aucun mot de Dryhopper sur l'étape (« dry hop », « ? IBU », « n j ») : vérifié par geste-etape --froid (règle g).

## États de l'étape rendus (`data-etat` ; capture après → montage côte à côte avec `capture_choisie`)
- etat-etape-repos : `captures/etats/etat-etape-repos-apres.png` → `captures/cote-a-cote/etat-etape-repos.png`
- etat-etape-dose-plus (48 g, « +2 ») : `captures/cote-a-cote/etat-etape-dose-plus.png`
- etat-etape-dose-moins (44 g, « −3 ») : `captures/cote-a-cote/etat-etape-dose-moins.png`
- etat-etape-retirer (emplacement « + », « −60 », 5 propositions) : `captures/cote-a-cote/etat-etape-retirer.png`
- etat-etape-ajout-rapide (Motueka à 10′, effet prévu, points avant/après) : `captures/cote-a-cote/etat-etape-ajout-rapide.png`
- etat-etape-type-whirlpool (80 °C, « − 20 min + », 9 IBU, « −51 ») : `captures/cote-a-cote/etat-etape-type-whirlpool.png`
- etat-etape-type-froid (J+3, « − J+3 + », aucun IBU, biotransformation et géraniol · thiols · hop creep) : `captures/cote-a-cote/etat-etape-type-froid.png`
- etat-etape-gout-coeur (aimer · neutre · exclure) : `captures/cote-a-cote/etat-etape-gout-coeur.png`
- etat-etape-champ-ajouter (« cit », stock ou catalogue) : `captures/cote-a-cote/etat-etape-champ-ajouter.png`
- etat-etape-analyse : `captures/cote-a-cote/etat-etape-analyse.png`
- etat-etape-ebullition-lien : `captures/cote-a-cote/etat-etape-ebullition-lien.png`
- etat-etape-cas-k3 (le jeu de sa base) : `captures/cote-a-cote/etat-etape-cas-k3.png`
- etat-etape-cas-k2-vide (Pahto 32,5 g « ou » Marco Polo 48,1 g, +60 IBU ; Saaz Late, Spalt, WGV) : `captures/cote-a-cote/etat-etape-cas-k2-vide.png`
- etat-etape-pied-profil (« Boisé et résineux trop marqué ») : `captures/cote-a-cote/etat-etape-pied-profil.png`
- etat-etape-repos-1280 : `captures/cote-a-cote/etat-etape-repos-1280.png`

Montages ouverts en image : repos, ajout rapide, type à froid, cas-k3, cas-k2, whirlpool-85 pendant, k3 pendant.

Gardés parce qu'il les a voulus : le fil d'étapes de l'app (D116), le « ? » par groupe (D113), « analyse › » (D121), les pictos de famille (D74), le filtre du champ, « Sans Nugget › » (Substituer est choisi : u4), le toucher sur la levure qui ouvre Levure (écart marqué voulu dans etape.json).

## Décisions
- DÉCISION : sur l'ajout rapide, l'effet prévu vient du moteur en direct. Il compare les crans de ma bière avec et sans l'ajout, et Motueka 10 g à 10′ ne change aucun cran : la carte dit « ≈ inchangé », là où sa base disait « floral +1 ». Sa base lisait l'effet d'une voie du pack. Pas de chiffre inventé (D14).
- DÉCISION : les propositions suivent la règle du moteur en direct (QUICK_ADD_RULE). Quand l'IBU tombe sous la bande du style (Nugget passé à froid, ou retiré), le moteur propose des ajouts à 60′ dosés pour la bande (Saaz Late 126,5 g par exemple). Sa base gardait des propositions figées.
- DÉCISION : sur cas-k2 et après un retrait, le profil part de la bière dégustée moins la part simulée de Nugget : on lit encore « Boisé et résineux trop marqué ». Sa base disait « 1 au style · 11 non situées », sans dégustation. C'est une question de moteur, hors de ma voie.
- DÉCISION : en mouvement réduit, je garde le fondu de 120 ms des autres houblons sous la carte tenue (opacité seule, sans mouvement), avec `!important` contre la règle globale de l'app. Sa base le gardait aussi.
- DÉCISION : sur les ajouts proposés, l'usage s'écrit en mot court, sans pilule (« double », comme les ajouts de sa base). Sur la carte, il reste « double usage » (VOIE). Avec la pilule et « double usage », les noms étaient tronqués et les textes se chevauchaient.
- Rien n'a été retiré au titre d'un refus plus récent (DEFAUTS-COURT) : aucun élément repris n'y est visé.

Prédiction : « Ça c'est le bon » pour le rail. Il demandera sans doute pourquoi Motueka ne dit plus « floral +1 ».

DÉCISION À PRENDRE : faut-il un effet prévu en points (sous le cran) quand le moteur ne voit aucun cran bouger, au lieu de « ≈ inchangé » ? Et faut-il garder les propositions d'amérisant à 60′ quand la recette passe sous la bande d'IBU ?

CONNAISSANCE : le rail de la base se porte en React sans re-rendu pendant le geste. Le DOM rendu est déplacé à la main, les styles sont rendus au lâcher, puis l'état reçoit la valeur. Le nœud de texte du libellé doit garder le même nœud (`nodeValue`), sinon React perd sa trace. La règle globale `prefers-reduced-motion` de l'app (`src/index.css`) supprime aussi les fondus d'opacité, alors que Chrome sans écran se déclare en mouvement réduit.

LEÇON PROPOSÉE : avant de porter un code calibré sur sa base, mesurer d'abord les hauteurs de texte et de carte des deux côtés, avec une sonde sur la même page. Les écarts de police (19 px contre 22 px) et la règle globale de mouvement réduit ont suffi à faire échouer deux fonctions du rail, alors que la géométrie était identique.
