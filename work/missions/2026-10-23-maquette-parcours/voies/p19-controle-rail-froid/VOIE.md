# Voie p19-controle-rail-froid — le contrôle D123 : le rail de l'étape, côté froid, comme sa base

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md`, section « Suite (24.10, matin) »)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle joué, ses témoins)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, avec une capture de la maquette 24.10 (Nugget glissé vers la post-fermentation), mot pour mot : « Le rail
c'est toujours n'importe quoi. Il y a un vrai historique dessus, pourquoi tu es revenu sur un choix que je n'ai pas
fait ? » (SPEC-BRASSEUR § 1, « Le rail, côté froid » ; DEFAUTS-RECURRENTS, D123, à lire en entier).

Le rail de l'étape a pris côté froid l'échelle et les mots de Dryhopper, dont le choix est ouvert. Sa base v4.10
fait autrement : `work/refonte-frontend/v4/ecran-1/base/BRIEF-RAIL.md`, captures
`work/refonte-frontend/v4/ecran-1/base/captures/v4-geste-fermentation-1-avant.png`, `…-2-pendant.png`, `…-3-apres.png`,
`consolide-nugget-p14-620-pendant.png`, `consolide-nugget-wp75-pendant.png`. Base jouable :
`work/refonte-frontend/v4/ecran-1/base/consolide/index.html` (ouvre-la dans Chrome et joue le geste d'abord).

## Le contrôle
Étendre `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs` d'un mode `--froid` (le mode par défaut ne
change pas ; M15 : `node scripts/agents/systeme.mjs appels controle-geste-etape.mjs --rejouer` reste vert). À 390 × 844
tactile, sur l'étape, Nugget glissé depuis sa poignée `[data-role="glisser-moment"]` vers le whirlpool, puis (page
rechargée) vers la fermentation, puis vers la post-fermentation :
- **pendant le geste**, doigt tenu : la carte se replie à 48 px au plus et garde son nom ; aucune étiquette ne chevauche
  une autre ; aucune étiquette ni graduation ne déborde sur le contenu sous le rail (le champ « Ajouter », les ajouts
  rapides : leurs boîtes ne croisent aucune graduation) ; sur le côté froid, les jours sont réguliers (J+0 à J+14, pas
  de 1, comme sa base), écrits « J+n » ;
- **après le lâcher** : la carte est posée à son moment sur le rail (entre les repères de son segment), ses mots sont
  ceux de sa base (« à froid » ou « whirlpool », jamais « dry hop » ; « aucun IBU » à froid, jamais « ? IBU » ; le jour
  en « J+n » avec son réglage − / +) ; aucun mot propre à Dryhopper sur l'étape ;
- sortie `GESTE-ETAPE OK (froid, 3 segments)` ou `GESTE-ETAPE ECHEC` et des lignes `- D123 …`.
Si la base nomme un mot autrement que ce contrat (par exemple « J+5 » en bulle et « J+5 » au réglage), la base fait foi :
écris l'écart dans RESULTAT.md.

## Témoins
- sa base v4.10 (`work/refonte-frontend/v4/ecran-1/base/consolide`, `--page=index.html`) → OK ;
- la construction publiée 5345f6ad → ECHEC. Rassemble-la d'abord dans `prototypes/houblons-v4/maquettes/parcours-5345f6ad/` :
  les pages de route de `prototypes/houblons-v4/maquettes/parcours/` et les assets figés de
  `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/assets/`, comme `parcours-d332792c/` (son LISEZ-MOI.txt) ;
- une page statique `temoins/geste-froid-deborde/` (graduations qui débordent sur un ajout) → ECHEC.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs` (mode `--froid`)
- `work/refonte-frontend/v4/tournoi/outils/temoins/geste-froid-*/**`
- `prototypes/houblons-v4/maquettes/parcours-5345f6ad/**` (ignoré par git)
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D123 seulement (portée `["ma-biere"]`, garde)
- `work/missions/2026-10-23-maquette-parcours/voies/p19-controle-rail-froid/RESULTAT.md`

## Exigences transversales (recopiées, L05)
- Règle n° 1 : sa base fait foi ; rien d'un écran au choix ouvert (Dryhopper). L26 ; M10 : écrire les échappements avec
  l'outil d'édition, rejouer `node scripts/agents/systeme.mjs cablage` ; le jeton attendu ne figure pas dans la commande.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait ; les sorties sur la base, sur 5345f6ad et sur le témoin, avec les mesures ; les mots de
la base relevés ; `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
