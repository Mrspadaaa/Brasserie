# Voie r14-fiche-flb5b — la liste de la fiche devient flb5b, et les types hors 16D (D130)

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md`
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 90 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante
- Étape : reprise

## Ses mots (24.10, soir), mot pour mot
Sur flb5b (« La matrice nettoyée ») : « Partie sur celle ci, elle met parcontre en avant qqch qu'il faut ajouter à plusieurs
endroits. Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la comparaison !!!! ». Avant, sur flb5 :
« J'aime beaucoup le 9 car ont voit que c'est pas que du 16d, le houblon a vraiment beaucoup plus de subtilité ».
Registre : fiche = g1, et la liste sous le radar = flb5b.

## Sa maquette choisie
flb5b : `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flb5b/` (etat.html, NOTE.md), captures
`…/fils24-fiche-liste/captures/flb5b-premier-ecran.png` (Nelson Sauvin), `flb5b-motueka.png`. La fiche autour : g1
(`work/refonte-frontend/v4/ecran-1/base/captures/consolide-fiche-390.png`), déjà rendue dans la maquette.

## Ce que tu fais
Dans la fiche de la maquette (`prototypes/houblons-v4/parcours/src/ecrans/fiche/`), remplace la liste sous le radar par la
matrice de flb5b telle quelle : le bandeau « Lui seul : … » (ses mots hors des familles de la 16D), ses mots en lignes, lui puis
ses remplaçants calculés en colonnes (le calcul de u4, D35), un seul gris. Tout vient de ses fiches et du moteur, jamais écrit à
la main ; « classé » pour la ligne Hopsteiner. Le bandeau porte data-role="hors-16d" et data-houblon="<clé>". Le reste de g1
(en-tête, α, radar d'abord, pied ♡ ⊘ Comparer, notes de source) et la fiche courte ne changent pas. Écris « Reprise D130 » dans
`NOTE.md` de l'écran.

## Possède
`prototypes/houblons-v4/parcours/src/ecrans/fiche/**`, `prototypes/houblons-v4/maquettes/parcours-fiche/**`,
`work/missions/2026-10-23-maquette-parcours/voies/r14-fiche-flb5b/RESULTAT.md`. Construis avec
`--sortie=prototypes/houblons-v4/maquettes/parcours-fiche`. D'autres voies travaillent sur Comparer, Substituer, Dryhopper, le
commun et Levure : n'y touche pas.

## Critères
Dans `GATES.md`. Captures sur Nelson Sauvin et Motueka, ouvertes à côté de flb5b et de g1 (L12). Réponse finale : une ligne.
