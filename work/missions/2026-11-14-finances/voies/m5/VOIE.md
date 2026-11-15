# Voie m5 — ses retours du 15.11 sur les sous-vues

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : m1, m2 (passe 2)
- Décideur en cas de doute : brasseur (page de choix) ; pilote pour le reste

## Objectif
Répondre en mini maquettes statiques à ses trois retours du 15.11 : Modifier doit vraiment modifier ; Payer et l'apport reçoivent un justificatif ; la fiche m2fo-a reçoit la facture en barre de m2fo-c.

## Ses mots (mot pour mot, 15.11)
- « La feuille rangée, pièce en tête m2mo-a · tiède · La fiche rangée m2fo-a · tiède · La facture en barre m2fo-c · chaude · Les deux poches m1ap-c · chaude »
- « Pour Modifier et « + pièce » il y a pas vraiment moyen de modifier ?? »
- « 6 · Payer pas de justificatif ? Un peu étrange, pareil pour l'apport personnel SI non candidat 1 »

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` (goûts, format des images) — ne pas relire ses sources.
- Bases choisies, à reprendre telles quelles (règle n° 1) : `work/missions/2026-11-14-finances/voies/m2/m2mo-a/`, `work/missions/2026-11-14-finances/voies/m1/m1ap-c/`, `work/missions/2026-11-14-finances/voies/m2/m2fo-a/` et `work/missions/2026-11-14-finances/voies/m2/m2fo-c/` ; Payer (pas encore choisi) : `work/missions/2026-11-14-finances/voies/m2/m2pa-a/` … `m2pa-d/`. Générateurs : `voies/m2/build.mjs`, `capture.mjs`, `voies/m1/_gen` (à lire, ne pas modifier : copier dans m5).
- Code : `src/components/EditTransactionModal.tsx` (`moneyLocked` verrouille le montant d'une opération payée : c'est la cause), `src/ui/finance/FinanceForms.tsx` (`PaymentSheet`), `src/ui/finance/MovementSheet.tsx`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/m5`

## Consignes
Charger `boosters-ux`. Un dossier par id dans `work/missions/2026-11-14-finances/voies/m5/<id>/` : `etat.html` (classes `<id>-…`), `<id>.png` (390, échelle 2, clair), `NOTE.md` (10 lignes au plus).
- **m5mo-a…d** : m2mo-a telle quelle (pièce en tête, mise en page, mots), où **tout se modifie**, montant payé compris : montant en champ `inputmode="decimal"` sans cadenas (le mot « lock » ne doit plus apparaître dans etat.html). Quatre façons de traiter le paiement déjà noté quand le montant change (genres a tiède, b froide, c chaude, d libre), par exemple : le paiement suit tout seul et le dit ; une ligne « payé 42,00 · reste 3,50 à payer » qui apparaît ; un aperçu avant / après ; les lignes de la pièce éditables qui refont le total. Montrer l'état après une modification (ex. 42,00 → 45,50).
- **m5pa-a…d** : m2pa-a…d, chacune avec une place pour le **justificatif** (photo ou fichier, le mot « justificatif » écrit), à sa place dans le genre ; le reste inchangé.
- **m5ap-a** : m1ap-c telle quelle, avec un **justificatif** (relevé, quittance ; mot écrit).
- **m5fo-a** : m2fo-a telle quelle, avec la facture en barre de m2fo-c greffée à sa place naturelle.
Ouvrir chaque image et la juger comme le brasseur avant de rendre. Aucun Fable, aucun sous-agent.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les bases choisies reprises telles quelles ; on n'ajoute que ce qu'il demande. Écran derrière : v6a.
- Pas de cockpit, peu de texte, mots du métier ; inconnu ≠ 0 ; hachure = à payer ; rouge = en retard ; pointillé = sans pièce ; jamais `type="number"` ; 44 px ; montants cohérents avec v6a (CHF).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, une ligne par id (image ouverte).
- Tests : aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m5 m5mo-a,m5mo-b,m5mo-c,m5mo-d,m5pa-a,m5pa-b,m5pa-c,m5pa-d,m5ap-a,m5fo-a 'mo=^(?![\s\S]*\block\b)[\s\S]*inputmode="decimal";pa=justificatif;ap=justificatif' 'ap:1,fo:1' --reporter=dot > work/missions/2026-11-14-finances/voies/m5/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
Réponse finale au pilote : une ligne.
