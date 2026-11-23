ECHEC — G2/G3 : 13/15 états OK ; radar (verif « repos » injouable), comparer-n (Comparer de r5)

Suggérer reprend q2b, son choix, avec tous les états qu'il montrait. Deux états sur quinze échouent encore, et aucun
des deux ne vient d'une perte de Suggérer (détail plus bas). Sur la page construite, 13 états passent sur 15.

## Fichiers écrits (tous dans « Possède »)
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/index.tsx` : réécrit. On y trouve les trois cartes, le graphe à
  axe central, les groupes, le ♡ à trois choix, « IBU après chaque voie » et les `data-etat`.
- `…/suggerer/divergent.tsx` (nouveau) : les barres divergentes de q2b (l5b), l'axe noir et la visée en tirets.
- `…/suggerer/vue-radar.tsx` (nouveau) : le mode Radar de la base v4.10.
- `…/suggerer/voies.ts` : ajout de `DEMANDE_Q2B` (+ agrumes), du dry hop actif (levier du moteur, yeastSignals), du
  verdict de q2b (la meilleure voie qui reste au style), de `lireVoie` et `momentsChauds` (« ‹ 10′ › »).
- `…/suggerer/radar.tsx` (une voie en plein), `briques.tsx` (`etats` sur `Lecture`, `data-pour` sur l'α),
  `reprise.css` (nouveau), `jeu.mjs` (aligné), `outils/instantane.mjs` et `cas-direct.json` (régénéré : 15 voies),
  `NOTE.md` (section « Reprise D124 »).
- Captures « après » : `prototypes/houblons-v4/maquettes/parcours-suggerer/captures-r4/<état>-apres.png`.
- `git status` : aucun fichier hors de « Possède ». Mes fichiers de travail sont dans le dossier temporaire de la session.

## Sorties décisives
- G1 `construire.mjs --sortie=…/parcours-suggerer` : **CONSTRUIT OK (9 pages)**.
- G2 `controle-etats.mjs … --ecran=suggerer` : **ETATS ECHEC (2/15) ; 3 voulu(s) non rejoué(s)**. 13 OK ; échouent
  `etat-sugg-radar` et `etat-sugg-comparer-n` (voir DÉCISION). Sur 5345f6ad, 15 sur 15 échouaient faute de `data-etat`.
- G3 `controle-choix.mjs … --ecran=suggerer` : **CHOIX ECHEC**. Il échoue seulement parce qu'il reprend G2
  (« ETATS ECHEC (2/15) »).
- G4 `controle-commun.mjs … suggerer --page=etat.html --sans=mots` : **COMMUN OK**. S3 (rayons de 6 px) et S4 (trait de
  la cuve à 1,5 px) ont été corrigés en cours de route.
- G5 `controle-teinte.mjs …` : **TEINTE OK 6/6**.
- G6 `verifier-types.mjs` : **TYPES OK**. Un essai intermédiaire a donné deux erreurs, dans `ma-biere/index.tsx` (fichier
  de r1, pas à moi).
- Hors critère : `jouer-parcours.mjs --etape=suggerer --dossier=…/parcours-suggerer` donne **ETAPE OK (suggerer)** ;
  `systeme.mjs cablage` donne **CABLAGE OK**.

## États rendus, un par ligne (data-etat · capture choisie · capture 5345f6ad · ma capture)
Les captures `choisie` et `5345f6ad` sont dans `work/refonte-frontend/v4/choix/etats/captures/`. Les miennes sont dans
`prototypes/houblons-v4/maquettes/parcours-suggerer/captures-r4/`. Je les ai ouvertes en images côte à côte.
- `etat-sugg-repos` (section des cartes) · `etat-sugg-repos-choisie.png` · `-5345f6ad.png` · `etat-sugg-repos-apres.png`.
  Trois cartes : Moins résineux **Aucune** voie houblon + « Hors houblon › », Plus floral **Approche**, Plus agrumes
  **Atteint**. Chacune a sa piste (barre et visée en tirets), puis vient « = même effet sur tes objectifs 10 g 10′ ».
  **ETATS OK**.
- `etat-sugg-piste-objectif` (piste de la carte Plus agrumes) · `-choisie.png` · `-5345f6ad.png` · `-apres.png`. La
  piste est revenue dans la carte, et l'aria-label dit « …, Motueka, atteint la visée (… → …, visée …) ». **OK**.
- `etat-sugg-groupes-effet` (2ᵉ groupe) · idem. Deux groupes « = même effet » : Motueka… Citra cryo (+1 cran,
  +2 crans), puis Nelson Sauvin, Galaxy, Hallertau Blanc (+2 crans). Chacun a sa barre une fois, puis son cadre à bord
  noir. **OK**.
- `etat-sugg-assembler` · idem. « Assembler 5 + 5 g · 10′ · estimé » avec Motueka + Nelson Sauvin, et la barre l5b à
  droite de l'axe central sous la ligne. **OK**.
- `etat-sugg-remplacer` · idem. « Remplacer Nugget · 60′ » : Motueka 74 g, Hallertau Blanc 63 g, Nelson Sauvin 62 g,
  chacun avec ses barres (floral et agrumes à droite, résineux et floral en baisse à gauche). Il n'y a plus de chiffre à
  la place. **OK**.
- `etat-sugg-dry-hop` · idem. « Dry hop · actif · estimé » : Motueka 20 g, avec la pastille de biotransformation
  (floral → agrumes, tropical et baies, « creep », dépliable) et sa barre, dont l'agrumes passe à l'orangé hors style.
  **OK**.
- `etat-sugg-ibu-details` (summary) · idem. « IBU après chaque voie (ma bière 59,7 ; style 50–70) » se déplie sur
  « Motueka 10′ 62,7 · Aurum 10′ 61,4 · East Kent Goldings 10′ 61,7 … » (les nombres de q2b, venus du moteur). **OK**.
- `etat-sugg-coeur` (♡ de la 1ʳᵉ voie) · idem. Menu « aimer · neutre · exclure » près du houblon ; « exclure » retire
  ses voies, et « Exclus : … × » les rend. **OK**.
- `etat-sugg-radar` (option « Radar ») · `-choisie.png` · `-5345f6ad.png` · `-apres.png`. Le mode Radar de la base
  v4.10 :
  - les objectifs en rangées (glyphe, « ▲ Floral », Approche, « 2 → 17 ») ;
  - le radar à 12 axes, avec ma bière et la voie montrée en plein ;
  - trois voies avec « ‹ 10′ › » (par 5′), dérive d'IBU, stock, « Montrer sur le radar » et « Appliquer à la recette »
    (Annuler) ;
  - « +11 ».

  **ETATS ECHEC** : le relevé joue ce mode en « repos » (voir DÉCISION). Avec le geste « toucher », il passe : copie
  du JSON réglée ainsi, `--etats=<copie> --id=etat-sugg-radar` donne **ETATS OK (1/1)**.
- `etat-sugg-absolu` · idem. L'absolu redessine les barres et les étiquettes (+16, +16). **OK** (aucune régression).
- `etat-sugg-hors-houblon` · idem. Les 4 pistes hors houblon du résineux. **OK**.
- `etat-sugg-plus` (« + » d'Aurum) · idem. Il donne ✓ et « Comparer (3) ». **OK**.
- `etat-sugg-comparer-n` (barre « Comparer (n) ») · idem. Elle ouvre Comparer avec la liste. **ECHEC** sur « non
  établi » (voir DÉCISION).
- `etat-sugg-fiche` (nom de la 1ʳᵉ voie, appui long) · idem. Fiche de Motueka par-dessus. **OK**.
- `etat-sugg-bandeau-ibu` · idem. « IBU 60 · OG 1,066 · EBC 70 » reste collé au défilement. **OK**.
- Voulus, non rejoués mais gardés : `etat-sugg-croix` (D109), `etat-sugg-legende` (« ? », D113). Captures
  `etat-sugg-croix-apres.png` et `etat-sugg-legende-apres.png`.
- Retiré : `etat-sugg-levure`, le groupe « Changer de levure ». Suggérer ne fait varier que le houblon, et Levure est un
  écran au choix ouvert (avis croisé, **D35**, L10). Il passera en variantes à lui montrer.
- Retirée aussi : la bande « ‹ visée | visée › » de q2b et ses deux flèches d'axe (**D91** : « Ça c'est inutile »). L'axe
  central et la visée en tirets restent : ce sont les barres l5b (D92).

## Décisions prises (la lecture la plus proche de sa capture)
- DÉCISION : **trois cartes, avec « Plus agrumes ».** Sans visée posée, Suggérer prend la demande de q2b
  (`DEMANDE_Q2B` : + floral, + agrumes, − résineux). Une visée posée dans Ma bière l'emporte, famille par famille.
  - Ce que ça donne : le moteur rend alors exactement les voies, les nombres et les verdicts de q2b.
  - Écart qui reste : la puce de Ma bière (`etat/visee.ts`, pas à moi) dit encore « + floral · − résineux ».
- DÉCISION : **le verdict suit q2b** (generateur-q2b.mjs, `meilleure`). Il se lit sur la meilleure voie établie **qui
  reste au style**, d'où Plus floral : Approche, comme sa capture. Le dry hop actif sort du style et ne compte pas.
- DÉCISION : **le dry hop vient du levier du moteur.** C'est « Houblonner à froid en fermentation active : Motueka,
  20 g », comme q2b. Le groupe « Dry hop 4 g/L · après 3 j » du simulateur (Idaho 7), ajouté par 5345f6ad, est retiré :
  il n'est pas dans q2b et touche Dryhopper, qui est au choix ouvert.
- DÉCISION : **proposés au départ, Motueka et Nelson Sauvin.** La comparaison compte des houblons, pas des voies. Pour
  garder « Comparer (2) », puis (3) après Aurum, j'ai pris la meilleure voie du stock de chaque groupe « même effet » :
  c'est le couple que q2b assemble lui-même.
  - Le premier écran est celui de q2b : seul Motueka porte un ✓.
  - Plus bas, l'assemblage et les remplaçants Motueka et Nelson Sauvin portent aussi un ✓. q2b n'en mettait que sur
    deux voies.
- DÉCISION : **la liste du mode Radar ne contient que les voies à chaud de proposer**, comme la base (14 voies, d'où
  « +11 »). Le dry hop actif reste dans les barres.
- DÉCISION : quand « ‹ 10′ › » décale une voie, ses effets viennent du **même moteur que les cartes** (apports V5.5,
  `additionEffect`). L'IBU vient de la recette au moment exact. Sans apport établi, la voie n'est pas dessinée et l'écran
  le dit (jamais 0).

DÉCISION À PRENDRE :
- `etat-sugg-radar` : `verif.geste` vaut « repos », mais le Radar de son choix se montre au toucher de « Barres |
  Radar ». Au repos, q2b et la base montrent les Barres. L'état ne peut donc passer au repos qu'en affichant le Radar au
  repos, ce qui contredirait q2b. Je propose de passer `verif.geste` à « toucher » dans `choix/etats/suggerer.json`
  (`data-etat` est déjà sur l'option « Radar ») : l'état passe alors (ETATS OK 1/1, vérifié sur une copie).
- `etat-sugg-comparer-n` : « non établi » n'apparaît plus dans le Comparer actuel de l'arbre. C'est l'écran de r5, en
  cours de reprise, et aucun « non établi » n'est dans `ecrans/comparer/`. Le problème n'est pas propre à Suggérer : ni
  Motueka + Nelson Sauvin, ni Motueka + Idaho 7, Citra cryo ou Galaxy ne l'affichent, et l'état échoue aussi sur
  `parcours-5345f6ad` (`--repli`). Il est à trancher avec r5, ou le relevé est à reprendre.
- `DEMANDE_DEGUSTEE` (`etat/visee.ts`, pas à moi) : faut-il y ajouter `citrus: 1`, pour que Ma bière et Suggérer disent
  la même demande ?

## Prédiction
« Ah, là c'est ma q2b : les trois cartes, la barre sur l'axe, le dry hop actif ; par contre pourquoi tous ces ✓ en bas ? »

CONNAISSANCE : avec la direction { floral: 1, citrus: 1, resin: −1 } et `leviersLevure: true`, `proposeVoies` sur la
stout S1 rend exactement les voies et IBU du cas c1 de q2b (Motueka 10′ 62,7… ; Motueka 20 g en dry hop actif). Le cas
de son choix est donc reproductible en direct par le moteur, sans grille figée.

LEÇON PROPOSÉE : un état relevé sur une page « déjà ouverte dans cet état » (suggestions-radar.html) doit être rejoué
sur la construite avec le geste qui y mène (toucher « Radar »), pas en « repos ». p21b a gardé « repos » et rendu l'état
injouable sans trahir le repos de q2b. Contrôle proposé : `controle-etats` signale un état « repos » dont la
`page_choisie` diffère de celle de l'état de repos de l'écran.
