OK partiel — C38-1 et C38-3 faits et testés ; T29-6/C38-2 : pose bornée au cadre, mais la frise GRANDIT encore au bord (voir DÉCISION)

## Fait

- **C38-1 (année de l'axe)** : `src/ui/calendrier/entete/BandeSemaines.tsx`, `periodesBande` (pas « mois »).
  Cause : à 14 et 16 mois (un nom par mois), janvier ne disait son année que si elle tenait dans son mois (18 px) : jamais. À 19 mois, janvier 2026 (10 jours après le début de l'axe) était écarté (son centre sortait du bord), puis la règle du bord gauche (T29-7) posait « 2025 » au bord, sur des pixels de 2026 : une année fausse, et 2026 nulle part.
  Correctif : l'année de janvier est toujours posée (entière si elle tient, sinon « ’27 »), elle déborde son mois, se décale vers l'intérieur au bord (centre toujours sur son année) et l'emporte sur les initiales qu'elle touche. La règle du bord gauche vaut à tout saut (pas seulement ≥ 2 mois), ne pose l'année que si son centre est sur elle, entière ou « ’25 ». Aucune année ne se pose sans passage de janvier dans l'axe (une courbe dans une seule année reste sans année).
  Test : `tests/unit/calendrierFix38c.test.ts` (ses captures 14, 16, 19 mois + propriété 3 000 cas, 20 à 156 semaines, 340 à 374 px : chaque année qui tient 26 px dans le cadre est nommée, aucun nom sur une autre année). **Rouge sur HEAD** (14 mois : « 2026 sans nom », « 2027 sans nom » ; propriété : contre-exemple), **vert** avec le correctif. Anciens tests de bande (`bandeJamaisVide`, `calBandeV11`, `calendrierFix29`, `calendrierModele`) verts.
  Test par modèle : invariant **I6** ajouté à `e2e/calendrier/etat-coherent.spec.ts` (mêmes règles lues dans le DOM : noms d'année de la bande « mois », 32 px dans le cadre). Syntaxe vérifiée ; **non rejoué** (Playwright absent de cette copie : voir DEMANDE EXECUTANT).
- **C38-3 (apport)** : `Marque.tsx` (`iconeChose` : apport → tirelire, autre entrée → trois points, comme la saisie) ; `Rangee.tsx` (`pastille` : plus de « +1 201 reçu » : le texte tombe sur « n choses », le mot posé à côté devient « hors ventes S48–S8 » ; la lecture (aria) garde « +1 201 reçu, hors ventes (apport) » ; le total Ventes ne compte que les ventes). Tests ajoutés dans `calendrierFix38c.test.ts` (picto, pastille sans « reçu », total = la vente seule).
  **Fichier hors « Possède » touché** : `tests/unit/ecritures23soir.test.ts`, 2 assertions (« sans vente, la rangée dit reçu ») qui encodaient l'inverse de la décision du pilote ; remplacées par `not.toMatch(/reçu/)` et `conf = /^hors ventes /`.
- **T29-6 / C38-2 (en partie)** : `usePointeur.ts`, `plageDuDoigt` : un doigt SUR la frise vise une colonne que la fenêtre montre, jamais les colonnes de marge hors fenêtre (elles ne se visent que doigt sorti de la frise). Garantit « une pose dans le cadre visible ». Test unitaire de la fonction pure.

## Critères
- tsc : 2 erreurs connues seulement (`seedData.ts` GanttTask, `enregistrerPwa.ts` virtual:pwa-register).
- Tests calendrier : 31 fichiers, 408 tests verts (`voies/fix38c/tests.log`).
- Modèle 200 suites × 1 graine : **non rejoué** (voir DEMANDE EXECUTANT).
- Essais : C38-1, 4 essais de réglage (bornes de l'année au bord, centre sur son année, ’YY au bord, seuil de 26 px) ; une seule voie de code.

## DÉCISION À PRENDRE : la frise défile-t-elle ou grandit-elle au bord ?
Le brief dit : « la frise DÉFILE sous la barre tenue au bord, sans changer d'échelle » et cite CAL-BARRE-BORD. Or CAL-BARRE-BORD (DEFAUTS-RECURRENTS l. 472, ses mots du 21.11 : « je tire un évènement en dehors ça doit **agrandir l'échelle** ») et son contrôle (« tirer la fin de vi au bord droit : la fenêtre grandit ») disent l'inverse ; les tests e2e L-1 et L-8 (`barre-bord.spec.ts`) le codent aussi (« la fenêtre gagne au moins une semaine à droite »). Je n'ai donc **pas** supprimé la croissance (règle n° 1 : ses mots). Raison technique en plus : une barre dont la colonne d'origine sort de la fenêtre qui défile n'est plus dessinée (L-1 : « la barre tenue disparaît sous le doigt ») ; c'est pourquoi la croissance existe.
- Option A (ma recommandation) : garder la croissance, mesurée (3 colonnes par seconde, déjà en place) ; la pose est bornée au cadre visible (fait) ; C38-2 est surtout une dérive de lecture : la bulle est lue à t, le lever a lieu 0,3 s plus tard, et la fenêtre a avancé d'une colonne ; au lever, la date posée est exactement celle de la dernière bulle rendue (même `s.k`). Les tests e2e tolèrent déjà 0 à 7 jours pour cette raison.
- Option B : la frise défile sans grandir pour une barre déplacée (`defilerFenetre`, `peutGrandir = mode === 'bord' && …`), la barre tenue restant visible sur un fantôme dessiné sous le doigt (rendu à écrire dans Rangee/Barre) ; il faut alors réécrire L-1/L-8 et demander au brasseur de confirmer qu'il renonce à « agrandir l'échelle ».
- Le brasseur seul peut dire laquelle ; sans réponse, A tient.

## DEMANDE EXECUTANT
Playwright n'est pas installé dans cette copie (`../lot-cal` l'a). Copier dans `../lot-cal` (après `git merge --ff-only claude/refonte-houblons-v4` s'il est à jour) ces fichiers de cette copie : `src/ui/calendrier/entete/BandeSemaines.tsx`, `src/ui/calendrier/frise/Marque.tsx`, `src/ui/calendrier/frise/Rangee.tsx`, `src/ui/calendrier/frise/usePointeur.ts`, `e2e/calendrier/etat-coherent.spec.ts`. Puis, depuis `../lot-cal` :
1. `E2E_WORKERS=1 ETAT_RUNS=200 ETAT_SEED=1 npx playwright test e2e/calendrier/etat-coherent.spec.ts --project=android-390 --retries=0 --reporter=line > etat200.log 2>&1` (≈ 2 h) ; attendu : 1 passed (aucun « I6 »).
2. `npx playwright test e2e/calendrier/barre-bord.spec.ts e2e/calendrier/bande-jamais-vide.spec.ts e2e/calendrier/graduations.spec.ts --project=android-390 --retries=0 --reporter=line` ; attendu : tout vert.
3. Si un « I6 » échoue : donner la ligne de contexte (durée, étiquette, noms) : le seuil de 32 px et la lecture de `data-axe-du/au` sont mes hypothèses, non rejouées.

## Doutes et limites
- Rien n'est vu en vrai rendu : pas de capture (consigne : preuve en ligne par le pilote). À regarder : 14, 16, 19 mois et An à 390 px (« ’27 » remplace les initiales qu'il touche : à 14 mois, D et F autour de janvier disparaissent) ; l'apport (tirelire) et la pastille Ventes « n choses · hors ventes … » avec un apport seul.
- Le « picto » de l'apport dans la Liste (`VueListe`) suit aussi (même `iconeChose`).
- « reçu » reste dans la lecture vocale de la pastille (« +1 201 reçu, hors ventes (apport) ») : dit hors ventes, jamais dans le total.

CONNAISSANCE : une année nommée sur une bande de mois est vraie si son centre est sur un jour de cette année (invariant testable, `tests/unit/calendrierFix38c.test.ts`) ; la règle « année du bord gauche » de T29-7 posait « 2025 » sur des pixels de 2026.
LEÇON PROPOSÉE : un brief qui cite un choix du brasseur (« son choix fait foi ») doit recopier ses mots ; ici la décision du pilote (« défile ») contredit le choix cité (« agrandir l'échelle ») : relire la source avant de la résumer dans un DOSSIER.
