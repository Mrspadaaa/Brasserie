# Voie r3-fiche — la fiche g1 et la fiche courte de Citra cryo, tous leurs états

- Mission : 2026-10-23-maquette-parcours ; contrat commun : `../REPRISE-D124.md` (à lire d'abord, en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : p21a, p24
- Décideur en cas de doute : pilote ; aucune question bloquante

## Sa maquette choisie
g1 : « la v1 est la meilleure » ; la fiche courte de Citra cryo : « Ça c'est très bien » (19.10). Page
`work/refonte-frontend/v4/ecran-1/base/consolide/fiche.html` ; registre `choix/ecrans.json`, écran `fiche` ; inventaire
`work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-fiche.json` ; relevé `work/refonte-frontend/v4/choix/etats/fiche.json`
(16 états). Voulu par lui depuis : le radar avant la liste (D115 : « Mettre le radargraph avant, cette vue est vraiment
pas terribles. À revoir... ») et la croix de 44 px (D109).

## Ce qui est perdu (p21a, à rendre)
- Le pied de g1 : **Styles › · Huiles › · Sources › · Substituts ›**, repliés, chacun qui se déplie comme dans g1
  (`etat-fiche-bas`, `-styles`, `-huiles`, `-sources`, `-substituts`) : styles où se range le houblon ; table des huiles
  (totale, myrcène, humulène…) avec leur source ; table des sources (α Beer Maverick 2023 9,5–16 %, α Hopsteiner 2025
  11–14 %, α mon lot 13 %…), d'où vient chaque valeur. Le titre « α » reprend la plage de g1 (11–14 % et le lot), pas la
  seule source la plus large.
- « Substituts › » ouvrait les remplaçants à 60′ dans g1 ; rends le bouton et sa liste telle que g1 la montrait (le
  geste « Remplacer » vers l'outil Substituer reste un pont, sans rien changer à cet outil).
- La fiche courte de Citra cryo : ses notes d'honnêteté (« α : plages de Citra en pellets ; la fiche du cryo manque. »,
  « 1 seule fiche : Beer Maverick », « − Résineux inconnu ») et sa longueur (103 mots, contre 187) (`-appui-long-citra`).
- Le toucher d'un sommet du radar : la bulle (« Melon : ses fiches ne le décrivent pas, inconnu (ce n'est pas zéro),
  posé au centre ») (`-radar-sommet`).
- D115 reste : radar d'abord, puis la liste. Les variantes de la liste viendront en fils de fer (D125) : ne la réinvente
  pas ici, rends-la comme g1.

## Possède
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/**` sauf `gestes.ts` (employé par l'étape : r1)
- `prototypes/houblons-v4/maquettes/parcours-fiche/**`
- `work/missions/2026-10-23-maquette-parcours/voies/r3-fiche/RESULTAT.md`
Le survol à 1280 px sur toute la carte (`etat-fiche-survol-1280`) est à r1 (la carte de l'étape).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
RESULTAT.md (états rendus, captures, décisions) ; réponse finale au pilote : une ligne.
