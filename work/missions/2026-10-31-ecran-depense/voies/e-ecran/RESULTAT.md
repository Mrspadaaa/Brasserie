OK — Écran lenteur D : provisoire, fusion « sa saisie l'emporte », lignes ajoutées et pas retrouvées, Tout valider B

Voie e-ecran, 02.11, agent auteur (Sonnet). Aucun commit, aucun déploiement, aucun appel Gemini (lectures fictives, flux simulé dans `apercuDev` et les tests).
Précisions du pilote reçues pendant la voie, appliquées : « Tout valider » = sa forme B (D316), reprise de `choix-valider/maquettes/b-arrivee`, `b-garder`, `tout` ; `ajouterCoupure` / `phraseCoupure` ne tirent plus le serveur dans le client ; `geminiScanner.ts` et `purchasePrefill.ts` (n3-ht) non touchés, suites rejouées avec.

## Inventaire de ses maquettes (L03, règle n° 1) — repris tels quels
- `choix-lenteur/d-06` (et `d-15`, identique) : fil de 22 px sous l'en-tête (deux barres pleines, une en cours, « vérification »), « Lectures ●●◌ » (deux points pleins, un pointillé, sans coche), Confirmer gris avec sa roue. Le cadre bleu épais n'en fait pas partie (marque de la page de choix) : non dessiné.
- `d-lue` : le fil part, « Lectures 3/3 », puce « ↻ N corrigées » au geste de filtre des autres puces, valeur corrigée sur fond bleu, ancienne valeur barrée sous le nom (« 10 Kg × 1,45 », « 30 ? »), Confirmer noir.
- `choix-lignes-38/q1-b` (son 1 B) : toute la rangée sur le bleu, ↻ devant le nom, valeurs bleues, aucune ancienne valeur, comptée.
- `q2-d-arrivee`, `q2-d-garder`, `q2-d-retirer` (son 2 D) : rangée barrée, grise, hors des sommes et de la barre ; bandeau au pouce au-dessus du pied (« Avoine maltée 1,70 · pas retrouvée », Garder, Retirer) ; Confirmer sans trancher : elle part.
- `choix-valider/b-arrivee`, `b-garder`, `tout` (son B, D316) : à plusieurs lignes, le bandeau défile (« pas retrouvée · 1/2 », « 2/2 ») ; « ↻ Tout valider » à droite du nom, Garder et Retirer dessous ; Tout valider fait partir toutes les lignes ; après un Garder, Malts 4 · 25,80, « Somme ≠ imprimé 48,10 ».
- `choix-cas-38/q1-a` (défaut A) : le total corrigé : 48,00 sur le bleu, « 46,40 » barré à côté ; le montant corrigé de Munich s'écrit « 4 Kg × 1,80 · 7,20 » barré. `q2-a` : la 3.8 qui n'arrive jamais = la forme d'une 3.8 coupée (« 2 lectures », chip « Lecture coupée »).

## Fichiers écrits (tous dans « Possède »)
- `src/ui/depense/finale.ts` (neuf, pur) : `lignesDeLecture`, `enteteDeLecture`, `brouillonDeLecture` (extraits d'`applyOutcome`, même calcul), `baseDeBrouillon` (B1), `tableDeRangs` (B3), `appliquerFinale`, `libelleAvant`, `rangerLaPerdue`, `provisoireCoupe`, et la copie pure de `ajouterCoupure` / `phraseCoupure` / `pointLectureCoupee` (R1).
- `src/ui/finance/ExpenseSheet.tsx` : états `verif` (`aucune|attente|finie|echec`) et `verifRef`, `surProvisoire`, `surFinal`, `finDePartie`, `finLecture`, `optionsFlux` (signal levé à la fermeture), `traduire` (R5, M6), bandeau, puce, rangées barrées, gestes Garder / Retirer / Tout valider ; `applyOutcome` garde son comportement.
- `Recap.tsx` (total/date/vendeur corrigés, « Lectures ●●◌ », puce `corrigee`), `Ligne.tsx` (`corrigee`, `neuve`, `LignePerdue`), `Liste.tsx` (rangées barrées par bande), `Pied.tsx` (`BandeauPerdues`, un seul composant : la forme se remplace sans toucher la logique), `Pages.tsx` (`FilVerification`), `types.ts` (`provisoire`, `final`, `delaiMs`), `apercuDev.ts` (états `lenteur-*`, `lecturesLenteur`).
- Tests : `tests/unit/depense/lecture-d/finale.test.ts` (19), `ecran.test.tsx` (16). Script : `voies/e-ecran/capturer-lenteur.mjs`.
- Non touchés : `confiance.ts`, `functions/**`, `src/services/**`, `groupes.ts`, `Entete.tsx`, `etat.ts`, `Verdict.tsx` (inutiles : la puce est un `CompteItem`).

## Critère 1 — témoins rouges avant, verts après
- Rouge de `finale.test.ts` sur l'arbre d'avant : `rouge-finale.txt` (« Failed to load url …/depense/finale », le module n'existait pas).
- Rouge de `ecran.test.tsx` : `rouge-ecran.txt` — l'ancien `ExpenseSheet.tsx` (HEAD, dans la copie) avec les nouveaux tests : **15 échecs sur 16** (seul « pièce sans 3.8 », qui est le comportement d'aujourd'hui, passe).
- Vert après : `Test Files 145 passed · Tests 2277 passed | 3 skipped` (voir 2).
- Témoins : E1 (unité déduite non touchée corrigée), E2 (date tapée, et cellule tapée), E3 (`skippedIds`, points, items remappés), E4 (repli par la position ; longueurs différentes → `echec` + `lecture-coupee`), 5 (écran, Confirmer gris aria « Vérification en cours », Fermer actif), 6 (clic sans effet), 7 (puce, N par cible), 8 (ligne supprimée), 9 (`line-${n+1}`), 10 (même nœud DOM : `applyOutcome` non appelé), 11 (traduction du provisoire jetée, nom changé retraduit), 12 (« 2 lectures », aucune puce), 13 (sans 3.8), 14 (fin de partie : `ok:false` et erreur levée) ; plus 1 B, 2 D (Confirmer sans trancher : la ligne n'est pas enregistrée), Tout valider à deux lignes (1/2, 2/2, Garder puis Retirer), total corrigé A, 3.8 qui n'arrive jamais A, R1 (sortie égale à celle du serveur).

## Critère 2 et 3 (copie isolée)
`copie.mjs "npx tsc --noEmit -p tsconfig.json && …"` → `TSC-OK` (0 erreur). `vitest run tests/unit/depense tests/unit/purchasePrefill.test.ts tests/unit/geminiScanner.test.ts --maxWorkers=2` → 145 fichiers, 2277 verts, 3 sautés ; aucune attente existante changée. `npm run build` → `✓ built in 13.28s`, code 0. (Dans le worktree nu, tsc dit seulement `zxing-wasm` / `pdfjs-dist` introuvables : ces modules ne sont que dans la copie.)

## Critère 4 — captures
`ECRAN-D OK` (111 mesures vertes ; `sortie-captures.txt`) : 9 états × 390 tactile et 1280, clair ; sombre pour `lenteur-lue` ; chacune « app | sa maquette » dans `captures/cote-*.png`. Ouvertes en image (L12) : 390 `provisoire`, `lue`, `lue` sombre, `echec`, `ajoutee`, `perdues-2`, `total` ; 1280 `perdues-2`. Les autres (`touchee`, `sans-38`, `perdue`, 1280 des autres états) sont prises et mesurées, non ouvertes une à une.
- Mesures : fil 22 px ; Confirmer gris, aria « Vérification en cours » ; puce dernière de la rangée des puces ; bandeau au-dessus du pied ; aucun débordement ; aucune erreur de console ; aucune requête hors localhost.
- `provisoire` (390) : le fil, « Lectures ●●◌ » et Confirmer gris à la roue sont ceux de d-06 ; les chips (« 6 proposés », « 1 nouveau ») sont celles de l'app.
- `lue` : fil parti, valeurs bleues, « 10 Kg × 1,45 » barré sous Pilsner, « 30 g » barré sous Sabro (l'app avait déduit « g » : la maquette dit « 30 ? »), Confirmer noir. Sombre : lisible.
- `total` : 48,00 sur le bleu, « 46,40 » barré, « 4 Kg × 1,80 · 7,20 » sous Munich, « 5 corrigées » : comme q1-a.
- `ajoutee` : rangée Mosaic bleue avec ↻, Houblons 3 · 100 g · 8,20, « 4 corrigées » ; « Somme ≠ imprimé » en attention.
- `perdues-2` : Avoine et Amarillo barrées, bandeau « 1/2 » avec « Tout valider », Garder / Retirer dessous : comme b-arrivee. À 1280 le bandeau s'étale sur toute la largeur de la feuille.
- `echec` : « 2 lectures », « Lecture coupée », « 7 lignes » en attention : comme q2-a.

## Écarts à ses maquettes (dits)
1. Les chips voisines (« proposés », « nouveau ») viennent de l'app : la puce passe donc sur une 2e rangée à 390 (la maquette tient quatre puces sur une rangée). Même geste et même style.
2. Le bandeau des lignes pas retrouvées est dans le flux (au-dessus du pied), non en surimpression : la liste défile dessous, rien n'est caché définitivement.
3. La puce compte les lignes pas retrouvées en attente (3 + 2 = « 5 corrigées », puis 4 après un Garder), comme ses maquettes `choix-valider` ; PLAN § 4 bis (m2) les excluait. Sa maquette l'emporte.
4. Un champ d'en-tête corrigé n'est montré en bleu que pour le total, la date et le fournisseur (bandeau). Les autres cellules d'en-tête (n° de facture, TVA, HT…) sont fusionnées et comptées, sans marque.
5. « Somme ≠ imprimé <somme des lignes> » (sa maquette) remplace « Somme = imprimé · non vérifiée » seulement quand une ligne a été ajoutée ou gardée ; les contrôles se lisent alors sur le brouillon.

## Doutes et limites
- Hors ligne pendant la 3.8 (relance au retour en ligne) : non fait. Hors de mes 14 témoins ; le fil reste, la fin de partie (150 s, côté `aiClient`) rend la main.
- `echec` par longueurs différentes : l'en-tête n'est pas fusionné (le provisoire reste tel quel, plus le point coupé). Le plan disait « l'en-tête se fusionne » : choix prudent, à relire.
- Une ligne pas retrouvée que le brasseur a retouchée reste une ligne ordinaire (rien ne se perd).
- Le champ ouvert (focus) dans une rangée rend toute la rangée « touchée ».
- La fusion se calcule sur le dernier rendu (`draftCourant`) ; une frappe dans le même tick n'est pas vue.
- 15 s d'attente réelle et réseau SSE en ligne : non vus (aucun appel réel).

DÉCISION À PRENDRE : compte de la puce (écart 3). Options : (a) maquette, lignes en attente comprises ; (b) plan m2, corrections seules. Recommandation : (a), c'est ce qu'il a choisi.

CONNAISSANCE : `functions/src/invoiceVisionReview.ts` ne doit jamais être importé par `src/` : il tire `invoiceScanCore`, `models` (`Object.hasOwn`, TS2550) et `node:*`. Le point « lecture coupée » du client est une copie pure, gardée égale au serveur par un test.
LEÇON PROPOSÉE : un tsc de l'app qui échoue sur un fichier de `functions/` est une cause de la voie, jamais un « déjà là » : relancer tsc sur HEAD avant de le déclarer ancien.

## Reprise 1 (relance du pilote : la capture `touchee` était identique à `lue`)
- Cause (dans Chrome) : le script. `ouvrirApp` recevait `lenteur-touchee` et testait `etat === 'touchee'` : le bloc de frappe ne s'est jamais exécuté. Ce n'était pas la fusion. Corrigé : condition juste, et geste réel (un toucher sur la rangée ouvre son plateau, on tape 12 dans la quantité, puis on le referme par son toucher ; plus de `setAttribute`).
- La fusion garde bien la saisie. Un défaut réel est apparu en regardant la capture : l'ancienne valeur barrée disait « 10 Kg × 1,45 » alors que la quantité 12 est la sienne. `libelleAvant` reçoit maintenant la ligne courante : une quantité non corrigée n'est jamais barrée par son ancienne valeur (« 12 Kg × 1,45 »). Test ajouté dans `finale.test.ts`.
- Mesures de `touchee` (échouaient avant la correction du script) : la frappe a pris (« 12 ») ; la quantité de Pilsner vaut 12 après le final, sans marque bleue ; le prix est corrigé (bleu, 1,45 barré) ; la rangée suivante est intacte.
- Écart à ta demande (3) : la puce ne perd PAS une correction. Pilsner reste une rangée corrigée par son prix (1,45 → 2,90) : « 3 corrigées » est juste. La mesure exige donc « 3 » et dit pourquoi. Pour voir « 2 », il faudrait une 3.8 qui ne corrige que la quantité (non fait, état d'aperçu inchangé).
- Capture ouverte : `captures/cote-tactile390-touchee-clair.png` : « 12 Kg » non bleu, « 2,90 » bleu, « 12 Kg × 1,45 » barré, puce « 3 corrigées », Confirmer noir.
- Rejoué dans la copie : `TSC-OK`, 145 fichiers, 2278 verts (3 sautés), build `✓ built in 13.24s`, `ECRAN-D OK` (121 mesures vertes). `Pages.tsx:38` de ta main gardé.
- LEÇON PROPOSÉE : un état de banc qui attend un geste doit mesurer que le geste a eu lieu (valeur lue avant l'arrivée), sinon la capture « touchée » prouve le contraire de ce qu'elle dit.
