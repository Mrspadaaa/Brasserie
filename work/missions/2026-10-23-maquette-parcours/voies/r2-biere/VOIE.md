# Voie r2-biere — l'onglet Ma bière, tous les états de la base v4.10

- Mission : 2026-10-23-maquette-parcours ; contrat commun : `../REPRISE-D124.md` (à lire d'abord, en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : p21a, p24
- Décideur en cas de doute : pilote ; aucune question bloquante

## Sa maquette choisie
Base v4.10, onglet Ma bière : « Ça aussi » (23.10). Pages `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html`,
`biere-radar.html`, `biere-absolu.html` ; registre `choix/ecrans.json`, écran `ma-biere` ; inventaire
`work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json` ; relevé `work/refonte-frontend/v4/choix/etats/biere.json`
(17 états) ; acquis « Radar: m4 h4 très bien » (`choix/etats/acquis.json`, `etat-acquis-radars-m4-h4`).

## Ce qui est perdu (p21a, à rendre)
- Le radar de sa base : grand (≈ 358 × 332 px), sa bière pleine en bleu, zone du style ; et dessous le **tableau
  pas senti · faible · moyen · marqué** des 12 familles (m4), en relatif comme en absolu (`etat-biere-radar`,
  `-radar-absolu`).
- Le toucher d'un sommet du radar : la famille et sa valeur en mots (« Résineux : marqué, au-dessus du style »,
  `-radar-sommet`).
- Les puces d'objectifs « + floral », « + … » : elles posent la visée sur la barre et écrivent « Plus floral : 8 voies,
  2 faibles › » sous les puces, sans quitter Ma bière ; c'est cette ligne qui mène à Suggérer (`-objectif-floral`,
  `-objectif-autre`).
- En absolu, les en-têtes « faible · moyen · marqué » à la place de « zone du style » (`-absolu`).
- À recouper : « 7 au style · 4 non situées » contre « 6 · 5 » dans la base (Végétal). Si le moteur calcule Végétal,
  garde le moteur et écris-le ; sinon rends « non situé ».

## Possède
- `prototypes/houblons-v4/parcours/src/ecrans/biere/**`, `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/RadarBiere.tsx`
- `prototypes/houblons-v4/maquettes/parcours-biere/**`
- `work/missions/2026-10-23-maquette-parcours/voies/r2-biere/RESULTAT.md`
`ma-biere/Base.tsx`, `Lentille.tsx` et le reste de `ma-biere/` sont à la voie r1 (étape) : lis-les, ne les modifie pas ;
s'il faut y changer quelque chose, écris le besoin dans RESULTAT.md (`BESOIN r1 :`).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
RESULTAT.md (états rendus, captures, décisions) ; réponse finale au pilote : une ligne.
