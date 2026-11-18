# COMPRIS — voie port-total

## Objectif
Le brasseur veut que les frais de port soient « Total seulement » partout, y compris quand le port est imprimé comme un article (D249) : le port compte dans le total et dans le
contrôle « somme des lignes = imprimé », il se dit à part (l'écran, voie p3c-port), et il n'est ni un article de stock ni un mouvement. Il reste une ligne `kind === 'shipping'` de
`draft.lines`, puis une entrée `shipping` de `finance.lines` (la comptabilité exige Σ lignes = total) : cette voie ne change aucun code de `src/` ni de `functions/`. Elle épingle par des tests ce
que le code fait déjà, corrige le banc de lecture (juge qui écarte le port des deux côtés, vérités de doc5, doc8, doc9) et le rejoue hors ligne sans qu'aucune pièce perde un point.

## Écrit dans
`work/missions/2026-10-31-ecran-depense/voies/port-total/COMPRIS.md`
`work/missions/2026-10-31-ecran-depense/voies/port-total/PLAN.md`
`work/missions/2026-10-31-ecran-depense/voies/port-total/RESULTAT.md`
`tests/unit/depense/port/`
`scripts/banc-lecture-facture-juger.ts`
`scripts/banc-lecture-facture.ts`
`work/missions/2026-11-01-banc-lecture/GESTES.md`

## Fini quand
- G1 : ce fichier existe et le contrôle de compréhension rend COMPRIS OK.
- G2 : le plan a été relu par deux relecteurs neufs et la revue n'a aucun bloquant sans sort (REVUE OK) ; c'est le pilote qui l'écrit.
- G3 : les tests du port (enregistrement, contrôle de somme, juge du banc), plus les tests existants cités (dont `banc-lecture-facture` et `banc-lecture-k5`), passent.
- G4 : les fonctions se construisent. G5 : les types de l'app tiennent, hors les deux erreurs connues de `qrLecture.ts`.
- G6 : RESULTAT.md dit le témoin (les tests qui échouaient avant, les épingles qui passaient déjà), ce qui ne se perd pas, le rejeu du banc avant/après et le genre `shipping`.

## Ne fait pas
- Pas d'écran (`src/ui/**`) : l'écran est à p3c-port ; l'affichage d'une dépense enregistrée ira à p3c-finances.
- Pas de changement de `purchaseEntry.ts`, `invoiceScanCore.ts`, `ledger.ts`, `types.ts`, `storage.ts`, `invoicePoints.ts`, ni du schéma Firestore.
- Pas de code de reconnaissance d'un port lu sous un autre genre : seul `kind === 'shipping'` compte ; je compte seulement ces cas, sans valeur.
- Aucun appel Gemini, déploiement, installation, commit ni `git stash` ; aucune valeur des pièces réelles dans Git ou dans un rapport.
- Pas de code avant le feu vert du pilote.

## Doutes
- Les cellules du rejeu attendues pour doc8 et doc9 dépendent des sorties prêtées ; la sortie « avant » fait foi (précondition du plan).
- Un port lu sous un autre genre décale l'alignement du juge ; je le couvre par des tests et le compte, mais je ne sais pas encore s'il en existe sur les pièces réelles.
