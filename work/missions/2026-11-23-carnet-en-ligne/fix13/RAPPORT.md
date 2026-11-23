# fix13 : Calendrier point 1, puis CA13-2 et CA13-3 (23.11)

App : https://brasserie-l-affinee.web.app/. Testeur : Opus. Outil : playwright-core `connectOverCDP('http://127.0.0.1:9222')`, MA page
(onglet neuf), 390×844, DPR 3, UA Android, toucher CDP (`Input.dispatchTouchEvent`, comme `e2e/outils/doigt.ts`) ; Retour du téléphone =
entrée précédente de l'historique (`Page.navigateToHistoryEntry`). Captures dans ce dossier, chacune citée ouverte et regardée.
Paquets servis : **index-DYzpupN8.js** (tour 14) pour A et B ; **index-D_kYmaY0.js** (mis en ligne pendant la session, pas par moi) pour C.

## A. Calendrier point 1 (CAL-LACHER-OU-DESSINE), en ligne, tour 14

Barre : fête « ZZ TEST — fix13 — fête » créée par moi. Doigt posé 60 ms sur l'icône, mené sous l'axe, levé.

| Échelle | Doigt sous | Annoncé (« lâcher ici ») | Écrit | Verdict | Captures |
|---|---|---|---|---|---|
| An (fenêtre nov. 2026 – nov. 2027, ≈ 51 sem.) | « S » (sept.) | 14 sept. | 14 sept., S37, icône sous « S » | **OK** | A-51-sept-pendant, A-51-sept-apres |
| An | « D » (déc.) | — | 14 déc., S51 | **OK** | A-51-dec-apres |
| 3 mois (≈ 14 sem., axe en semaines) | début de S3 (x 299) | — | 18 janv., S3 | **OK** | A-14-x299-apres |
| 3 mois | milieu de S3 (étiquette, x 308) | S4 · 25 janv. | 25 janv., S4 | **KO partiel** | A-14-S3-pendant, A-14-S3-apres |
| 3 mois | 2e moitié de S3 (x 316) | S4 · 25 janv. | 25 janv., S4 | **KO partiel** | A-14-x316-pendant |

Verdict A : **OK à 51 sem.** (le « 18 avr. » sous « sept. » ne revient pas). **KO partiel à 14 sem.** : une fête d'un jour se cale sur le
lundi le plus proche ; doigt dans la 2e moitié d'une semaine, la date écrite est la semaine suivante (S4 sous l'étiquette S3). Annonce et
écriture concordent (« S4 · 25 janv. · lâcher ici » avant de lever), à ± 1 colonne comme l'e2e le tolère, mais ce n'est pas la semaine
sous le doigt. Non corrigé ici (hors périmètre) ; proposé au registre : arrondi au lundi précédent (semaine sous le doigt), pas au plus proche.
Vu en route : un appui de 500 ms sur l'icône à l'échelle An fait passer le Calendrier à 6 sem. (le geste se joue alors à 6 sem.).

## B. CA13-2 : Retour du téléphone (reproduit en ligne, tour 14)

- **Depuis le Calendrier** : carnet ZZ → « Au calendrier » → fiche « Ouvrir » → carnet. Retour 1 : Calendrier ; **Retours 2 et 3 : sans
  effet** (Calendrier, fiche ouverte) ; Retour 4 : **hors de l'app** (about:blank). Captures B-11-carnet-depuis-cal, B-cal-retour-1 à 4.
  Historique relevé : l'entrée du renvoi portait `{"laffinee-carnet":true,"laffinee-retour":"stocks"}` (marque du carnet recopiée).
- **Depuis À venir** (vrai carnet « Achat brasserie : moulin à malt », lecture seule) : Retour 1 → liste des Carnets (pas À venir) ;
  Retour 2 → hors de l'app. Captures B-01-carnet-depuis-a-venir, B-av-retour-1, B-av-retour-2.

Cause : la marque d'historique du carnet (`true`) était recopiée par le renvoi du Calendrier (`useRetour`) ; un Carnet démonté (onglet
changé) laissait son entrée ; au retour, ces entrées passaient pour « Plus refermé » ou n'avaient plus de maître : retour sans effet.

## C. CA13-3 : plan archivé (reproduit en ligne, paquet D_kYmaY0)

Carnet « ZZ TEST — fix13 — cuve de garde 500 litres pour la cave » (créé par moi, 1 appel IA `rangerCarnet`) : 3 mois, 500 CHF,
« Au calendrier » (S8, 22 févr. 2027, −500). À venir : Prix estimé 12 345,67, Enregistrer, puis Archiver ce projet › Oui, archiver.
Rouvert : **« Quand · vers févr. · 500 CHF estimé »**, **aucun « Au calendrier »** (0). Captures C-05-au-calendrier, C-07-prix-12345,
C-10-apres-archiver, C-11-carnet-apres-archive.

## Correctif (copie fix13, branche claude/fix13, commit 7ea7a4b2d)

- B : `src/ui/carnets/histoireCarnet.ts` (neuf) : la marque porte le carnet et le jeton du Carnet monté ; `useRetour` ne la recopie plus ;
  démonté, le Carnet retire son entrée si elle est au sommet ; une entrée orpheline rouvre son carnet (`App.tsx`), que le Carnet adopte
  (`useNavigationCarnet.ts`). Ouvert depuis À venir, Retour ramène à À venir (`StocksTab.tsx`, `onRetourOrigine`).
- C : `planSuiviDuCarnet` et `planRepris` (`operations.ts`) : archivé, le carnet dit la date et le prix de son plan (Quand, Prix et dater
  suivent ce plan) ; « Au calendrier » et Placer reprennent le plan (brouillon, date et prix gardés), le plan lié par la sortie plutôt qu'un
  second achat prévu ; un plan lié sans date se pose à la date du carnet. Réalisé : toujours sans « Au calendrier » (L-12).
- Tests : `e2e/carnet/fix13.spec.ts` (3) rouges avant (retour 2 resté au Calendrier ; retour → « liste » au lieu d'À venir ;
  « vers mars · 500 CHF estimé »), verts après ; lot-2 et lot-11-date verts (16, android-390) ; `tests/unit/carnetsFix13.test.ts` et
  carnetsLot2 (17) verts ; `tsc` 0 ; `vite build` vert. `npm run build` : contrôle DRAPEAUX en échec sur `VITE_CARNET_IA` (absent du
  `.env` de la copie, comme de port-carnet et Brasserie) : environnement du déploiement, pas ce correctif.

## Après mise en ligne

(à remplir : même geste, même carnet ZZ, captures regardées)

## Données

- Créés : fête « ZZ TEST — fix13 — fête » ; carnet « ZZ TEST — fix13 — cuve de garde 500 litres pour la cave » et son plan (archivé).
  Retrait à la fin, après la preuve en ligne.
- Vraies données : lecture seule (carnet « Achat brasserie : moulin à malt » ouvert puis Retour).
- IA : 1 appel `rangerCarnet` (création du carnet ZZ).
