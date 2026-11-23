# REPRISE — CAL-RETOUR-PASSE + CAL-ECHELLE-COHERENTE (22.11)

Worktree : `port-carnet`, HEAD = tag `en-ligne/2026-11-22-tour9` (3cfbf196a). Rien de modifié encore (ni code ni contrôle).
Arbre sale par les ports Carnet et Stock : commit par chemins, index temporaire, ses hunks seulement.

## Demande (pilote)
1. Contrôle d'abord (geste.mjs, nouvelle section, ex. `sectionPasseLibre` + `sectionEchelles`), rouge sur tour9 :
   - CAL-RETOUR-PASSE : depuis 30 sem., reculer ≥ 26 sem. au-delà du bord par ‹ (« Période précédente »), tirer le début du cadre
     (`[data-poignee=debut]`), glisser la frise (= corps du cadre, R5 ; glisser à gauche = plus tôt). Cadre dessiné = période de son étiquette.
   - CAL-ECHELLE-COHERENTE (captures Brasserie `work/missions/2026-11-21-calendrier-entete/31..33`) : pour chaque échelle (1 sem. à An) et
     après chaque geste : étiquette du cadre = dessin du cadre = pastille = graduations sous les rangées ; aucune étiquette de courbe empilée.
     Montrer côte à côte frise B (Brasserie `work/missions/2026-11-20-frise/frise-interactive.html`, R1–R14) et l'app à chaque échelle.
2. Cause, 3. correction, 4. captures 390/1280 deux thèmes ouvertes ; `calendrier.mjs` et `geste.mjs --endroits calendrier` OK.
5. Commit par chemins ; BUGS.md (dépôt Brasserie `work/missions/BUGS.md`) à la main ; `controle-bugs` OK.

## Cause trouvée (CAL-RETOUR-PASSE)
- Borne : `src/ui/calendrier/useDonneesCalendrier.ts:88` `semainesPassees` : avec solde connu, passé = semaines depuis
  `profile.openingCash.date` (tour9 : ouvert ~S32 → bord 03.08.26). `construireModele` l.118-119 : `semaines = semainesDe(auj, 52+passe, passe)`.
  Tous les gestes bornent à `premierLundi = modele.semaines[0].debut` (CalendrierTab.tsx l.211, 218, 589, 608, 650, 718, 1005-1008, 1024 ;
  `calendrierGestes.ts:296,463` debutHorizon).
- ‹ : `periode.ts pas()` pour `dates` glisse jusqu'à PREMIER_JOUR (2000) ; puis `Fenetre.tsx fenetreDePeriode` (CHV-4) ramène le début au
  bord en gardant la durée ; `CalendrierTab.tsx:232 periodeEnTete` garde alors la période NON ramenée → pastille ≠ cadre.
- Désaccord étiquette/dessin : `EnTete.tsx:192-193` (`nombre`, `index = premier`), `:219 vueC = vueTirage ?? vueDeFenetre(index,nombre,largeur)`
  (`vueTirage` peut rester d'un tirage), `<Cadre … index nombre vue={vueC} onVue={setVueTirage}>` l.783-786 ; `etiquetteCadre` Fenetre.tsx:116
  (fin = min(total-1, index+nombre-1)). Capture 33 : étiquette « S32 – S12 2027 » (index 0 = bord) mais dessin S10–S12 et pastille S6–S12 ;
  capture 32 : 1 sem. S35 2027, étiquette « S23 – S35 2027 », cadre plein. À lire : `premier` (EnTete l.~180-192) et le reste de vueTirage.

## Correction prévue
- `semainesPassees` : toujours `SEMAINES_PASSEES_MAX` (52, comme le futur) ; avant `openingCash.date` la courbe reste plate au solde de départ :
  filtrer `mouvementsPasses` depuis max(lundi0, date d'ouverture) (le solde du jour n'inclut pas les paiements antérieurs). Adapter
  `tests/unit/calPasse.test.ts:29-34` et `tests/unit/calendrier.test.ts:761-762`.
- ‹ au-delà de 52 sem. : la pastille suit le cadre (periodeEnTete = periodeDeFenetre quand fenetreDePeriode a ramené le début).
- Cadre : étiquette, dessin et vue issus du même (index, nombre) ; vider `vueTirage` quand la fenêtre change hors tirage.

## Contrôle (esquisse)
Fixture geste : `fixtureGeste()` (geste.mjs ~l.226) a PASSE = 14 sem. → bord = lundi(auj) − 14 sem., cible = bord − 26 sem.
Lire la pastille `[data-periode-pastille] .pr-court` (« jj.mm(.aa)–jj.mm(.aa) »), l'étiquette `[data-cadre-etiquette]`, les points
`.ent-cb [data-point-semaine]` (cx = centre de semaine) dont le centre est dans `.ent-cadre` : leurs numéros = semaines ISO de la pastille.
Graduations : `[data-bande-semaines] [data-semaine]`. Ajouter les sections au dict l.898 de geste.mjs.
Lancer : `node scripts/parcours/geste.mjs <dossier> --endroits calendrier --sections sectionPasseLibre --ref en-ligne/2026-11-22-tour9`
(rouge attendu), puis sur l'arbre.

## ÉTAT 22.11 fin de contexte (Sonnet)
Commits (port-carnet) : 73f418ec4 contrôle ; c32e6491d passé libre (semainesPassees() = 52) ; 4bfa47018 période de l'app fixe (CalendrierTab onPeriode local) + contrôle graduations visibles. BUGS.md (Brasserie) : 3 lignes ajoutées, controle-bugs OK.
Rouge tour9 / vert arbre : geste.mjs --sections sectionPasseLibre,sectionEchelles (390 clair vert ; 1280 vu vert au premier passage, à rejouer).
Reste : 1) geste.mjs --endroits calendrier COMPLET et calendrier.mjs sur l'arbre (non rejoués après les changements ; la période de l'app ne bouge plus par les gestes : d'anciens contrôles CHV-4 / E07 « barre de l'app = cadre » peuvent devenir rouges, à relire) ; 2) tests vitest calendrier complets ; 3) captures 390 et 1280 deux thèmes OUVERTES et côte à côte avec Brasserie work/missions/2026-11-20-frise/frise-interactive.html, à chaque échelle (non faites) ; 4) étiquettes de courbe empilées : le contrôle ne les a pas vues, à vérifier à l'œil ; 5) la bande de graduations n'a pas de semaines à 6 mois et An : contrôle muet à ces échelles.

## ÉTAT 22.11 (Sonnet, 2e passe, NON COMMITTÉ) — REPRISE
Modifié sur l'arbre (à committer par chemins) : scripts/agents/vision-calendrier.mjs (memePeriode = pastille fixe vs relevé de départ),
scripts/parcours/chaines-calendrier-v8.mjs (lire : graduations data-lundi ; ecart = pastille fixe + cadre = graduations ; CH-V4/N1 : du→gdu ; An sans bande = contrôle muet),
scripts/parcours/calendrier.mjs (étape 8 « Plus de détails » : › jusqu'à la chose ; CRN-20 : pose la plage app_global_time_filter dans localStorage avant lecture).
Cause des 2 KO calendrier.mjs (Marché de Noël, CRN-20) : ma voie (période de l'app fixe), corrigés dans le contrôle ; rejeu complet lancé : C:/tmp/rp/cal2.log puis C:/tmp/rp/ge.log (geste --endroits calendrier), lire PARCOURS / FINI.
Vitest calendrier : 11 KO / 7 fichiers. De MA voie (tests « le calendrier écrit la période de l'app », à réécrire en « onPeriode non appelé, pastille inchangée ») :
calendrier-onglet (E07 ET-PER 3 mois ; d3 appui long ; CRITIQUE-10 n°2), calendrierEchelle (PC-144), calendrierGestes (n°4 paysage), calendrierPeriodeFinances (×3), calendrierPaquetF (n°3 échelle Mois rechargée), calendrierMenuV12 (CHN-3 « S47 – S48 2026 » vs « S47 – S48 » : peut venir de la fiche).
Pas de ma voie (arbre sale fiche/Stock) : calendrierLotA (--cave-100 absent de feuille.css clair), un « document is not defined ».
Reste : tests ci-dessus ; étiquettes de courbe empilées à l'œil ; captures 390/1280 × 2 thèmes × 1 sem./7 sem./30 sem./An vs frise-interactive.html ; commit index temporaire ; BUGS.md ; controle-bugs.

## ÉTAT 22.11 (3e passe, Sonnet, contexte plein) — REPRISE
Bancs 2e passe sur l'arbre : calendrier.mjs = 1 KO (G5 paysage 844×390 : 6 sem. au lieu de 10, controle-base ; origine à attribuer : fiche d8a606849 ou ma voie ; rejeu tour9 à faire). geste.mjs --endroits calendrier = 8 KO :
 - « frise du haut … rechargement » ×4 (390/1280 clair/cave) : la fenêtre ne survit plus au rechargement (S50·21 → S44·6) ; de MA voie (fenêtre locale, non persistée). Décider : persister la fenêtre locale (clé UiState dédiée) ou aligner le contrôle sur « retour à la période de l'app ». Baseline tour9 lancée : C:/tmp/rp/gt9.log (sections sectionCadre,sectionBarreBord, 390 clair).
 - « annuler en bord de cadre » ×4 (période « 3 mois » → « 6 mois », place 169 → 351) : de MA voie. CalendrierTab.tsx rendreFenetre (l.~511) restaure fenetre mais pas periodeLocale ; fenetreAvant posé en defilerFenetre (l.~1002) : mémoriser aussi periodeLocale et la rendre à l'annulation.
Nouveau (CAL-FRISE-ETIQUETTES, capture 35) : section `sectionEtiquettes` ajoutée à geste.mjs (non lancée, enregistrée dans le dict) : lit [data-nom-courbe], niveau, zéro, mise, mois, [data-cadre-etiquette], poignées (i), graduations ; échoue si croisement, sortie de la courbe, ou « S47 » écrit deux fois. À lancer : node scripts/parcours/geste.mjs <dossier> --endroits calendrier --largeurs 390 --themes clair --sections sectionEtiquettes --ref en-ligne/2026-11-22-tour9 (rouge attendu), puis arbre. Corriger ensuite dans src/ui/calendrier/entete/Courbe.tsx (placement des noms l.~259-380 : exclusions = poignées (barres), étiquette du cadre, bords ; niveau l.651 ; zéro l.623 ; une étiquette de cadre à une semaine masquée quand la graduation dit la même semaine, Fenetre.tsx l.332).
Aussi non commités : vision-calendrier.mjs, chaines-calendrier-v8.mjs, calendrier.mjs, geste.mjs. Restent : tests vitest (9 à réécrire, voir 2e passe), captures 390/1280 × 2 thèmes vs frise-interactive.html, commit par chemins, BUGS.md (+ CAL-FRISE-ETIQUETTES), controle-bugs.
