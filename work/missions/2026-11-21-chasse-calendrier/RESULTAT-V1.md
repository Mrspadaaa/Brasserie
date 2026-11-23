OK — V1 : CHD-1, CHD-9, CHD-10, CHD-11 corrigés (port-carnet 364cf6570), contrôles rouges sur tour8, verts sur l'arbre.

Fichiers (port-carnet) : `src/domain/calendrier.ts` (dureeBrassin, evenementsBrassins, coutRestantInconnu), `src/ui/calendrier/useDonneesCalendrier.ts` (solde connu = cashComplete), `tests/unit/calendrier.test.ts`, `tests/unit/calendrierCaisse.test.ts` (fixtures : un paiement par pièce payée), `scripts/parcours/chaines-calendrier-v1.mjs` (nouveau, 4 étapes), `scripts/parcours/chaines.mjs` (3 petits hunks : import, `...etapesV1(...)`, `e.entrees`). BUGS.md : bdc692be4 (Brasserie).

Contrôles (`node scripts/parcours/chaines.mjs <dossier> [--ref en-ligne/2026-11-21-tour8] --etape CH-D1,CH-D9,CH-D10,CH-D11`) :
- tour8 : 4 KO (−6 925 CHF à dépenser ; « J34 / 34 · prête 15 nov. » ; « B-NEIPA-1 neipa v3, B-NEIPA-2… » ; aucun « coût à venir » en cuve).
- arbre : PARCOURS CHAINES OK (CH-D1 avec contre-épreuve sans la pièce : le chiffre reste ; CH-D9 « J40 · prête depuis 6 j » ; CH-D10 « 6 cette semaine : neipa v3, neipa v3… » ; CH-D11 4/5 brassins en cuve).
- Captures ouvertes : CH-D1-1, CH-D1-2, CH-D9-1, CH-D10-1, CH-D11-1 (scratchpad v1-arbre).
- Vitest : calendrier.test.ts 65/65, calendrierCaisse 25/25, six fichiers Calendrier 317/317. tsc propre.
- `controle-bugs.mjs` : mes 4 ids passent ; il sort ECHEC (3) pour WFR-2, CHV-7, CHV-9 (autres voies : « corrigé 4d14f4b20 » écrit dans la colonne état au lieu de la colonne commit).

Essais : 1 par contrôle sauf CH-D10 (2 : la carte Brassins du Bord garde l'id en second plan, légitime ; le contrôle lit seulement `#bord-cal-resume`).

Choix : CHD-9 = « J40 · prête depuis 6 j » (le « / 34 » et la date disparaissent après le jour prête ; la forme courte de la barre dit « J40 »). Ancien test « J borné » inversé (il figeait le défaut). CHD-1 : `passe` (recul de la fenêtre) passe à « tout le passé permis » quand le solde est inconnu, règle existante de `semainesPassees` ; testé égal.

Doutes :
- `EnTete.tsx:756` dit « Solde de départ inconnu : à régler dans Finances › Solde » alors que le solde est confirmé et que la cause est une pièce payée sans paiement (« Confirmer les paiements »). Libellé à nuancer (fichier d'une autre voie).
- `DetailChose.tsx:304` (attend choix fiche) dit « Coût à venir : aucun budget pour cette recette » : faux pour un brassin en cuve dont seul l'emballage manque. Je n'y ai pas touché (règle n° 1).
- calendrierPaquetE « Dédé glissé d'un jour en arrière » échoue avec ou sans ma correction (préexistant).
- Banc sans tour8 pour CHD-1 : la fixture `T-ZZ-POMPE` fait l'inconnu ; impôt (`posteBrassin 'impot'`) exclu de CHD-11 comme du budget.

CONNAISSANCE : une pièce `paymentStatus: 'paid'` sans enregistrement de paiement rend `cashComplete` faux ; les fixtures de calendrier doivent écrire un paiement par pièce payée.
LEÇON PROPOSÉE : aucune
