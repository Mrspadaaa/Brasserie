# Carnet en ligne : liste de correction unique (23.11)

Sources : M1 (exploratoire, 28), M2 (états et limites, 19), M3 (scénarios, 18), M4 (tactile et visuel, 29), suite Playwright
`port-carnet/e2e/carnet/DEFAUTS.md` (CA12-PW-1 à 4, et ses trois notes), BUGS.md « Contre-épreuve du Calendrier » (T11 moyens et mineurs
marqués « avec l'écran suivant (Carnet) »), lignes du registre rejouées KO par M1 à M4. **145 constats** (94 CA12 de M1 à M4, 4 CA12-PW et 3 notes, 20 T11, 24 lignes du registre rejouées KO) ramenés à
**72 défauts** (L-1 à L-72), **7 questions de choix** (Q-1 à Q-7) et **2 points d'environnement** (E-1, E-2).
Code lu : `port-carnet`, branche `claude/port-carnet-1711` = `origin/main` (f9b18c8fa). Lecture du code, pas d'exécution : chaque
« cause » est probable, à confirmer par le test rouge écrit d'abord.
Registre : `work/missions/BUGS.md` ; les CA12 de M1 à M4 y sont (« ouvert — présent ») ; les doublons y disent maintenant
« ouvert — doublon de CA12-… (LISTE L-n) ». CA12-PW-1 à 4 ne sont pas au registre (épreuves `test.fail` de la suite).

## 0. Ce que vaut chaque constat

| Paquet | Qui | Valeur |
|---|---|---|
| Tour 12 `index-zpcbYIem.js`, service worker contourné pour leur page | M1, M2, M3, M4 (captures ouvertes) | Classe (a) si la capture est citée et que l'auteur ne dit pas « vu une fois, non rejoué », « hypothèse », « à confirmer » |
| Tour 11 `index-Cmzen8eH.js` (contre-épreuve CDP) | T11-3 à T11-24 | Classe (b) : capture sur le tour 11. Le tour 12 n'a corrigé que T11-1 et T11-2 ; le code de ces points semble inchangé, à prouver par le test rouge |
| Fixture simulée, jour figé 23.11 | Suite Playwright (CA12-PW) | Confirmé au banc ; épreuves `test.fail` prêtes (règles, mise en page) |

Contradictions : M1 (390×544 simulé) voit la dernière note sous le clavier ; M4 (clavier simulé de 280 px à 390×660) la voit au-dessus (L-48,
classe b). M1 joue « Ranger maintenant » au retour du réseau (OK) ; M2 dit la note jamais re-rangée (PCN-144) : M2 n'a pas touché le bouton (L-8).
T11-1 est « corrigé » au registre, mais M4 le rejoue KO côté Carnet (date et prix changés après le placement) : L-11.

## 1. Table de dédoublonnage (source → L)

| Source | Vers |
|---|---|
| CA12-M1-1 à -14 | L-1 + L-3, L-23, L-10, L-13, L-24, L-9, L-17, L-48, Q-2 (+ L-35), L-40, L-8, L-29, L-6, L-19 |
| CA12-M1-15 à -28 | L-15, L-25, L-44, L-49, L-14, E-2, L-18, Q-1, L-8, L-50, L-66 + L-51, L-41, L-46, L-41 |
| CA12-M2-1 à -10 | L-36, L-10 + L-11, L-12 (+ libellé L-14), L-19 + L-15, L-4, L-4, L-13, E-2, L-50 + L-45 + L-39, L-38 |
| CA12-M2-11 à -19 | L-8, L-49, L-27, L-28, L-7, L-43, L-46, L-22, L-54 |
| CA12-M3-1 à -9 | L-2 + L-20 + E-1, L-1 + L-3 + L-4, L-30, L-65, L-37 + L-12, L-12, L-5, L-52, L-53 |
| CA12-M3-10 à -18 | L-42, L-66, L-18, L-15 + L-25, L-26, L-41, L-55 + E-2, L-12, L-37 + L-28 |
| CA12-M4-1 à -15 | L-17, L-18, L-18, L-11, L-9, L-25, L-19, L-15, L-15, L-23, L-26, L-31, L-32, L-34, L-34 |
| CA12-M4-16 à -29 | L-35, L-51, L-16, Q-4, Q-4, L-14, L-21, L-2 + E-1, L-30, L-17, L-47, L-8, L-41, L-66 |
| CA12-PW-1, -2, -3, -4 ; notes 14/12 px, EUR, Comparer en paysage | Q-5, Q-4, L-18, L-19 ; Q-3, L-19, L-17 |
| T11-3, -4, -5, -6, -7, -10, -11, -12 | L-57, L-58, L-58, L-67, L-66, Q-7, L-59, L-68 |
| T11-13 à -24 | L-56, L-60, L-69, L-61, L-70, L-51, L-62, L-71, L-63, Q-4, L-64, L-72 |
| Registre rejoué KO | CRU-NOTE-1 → L-1 ; PCN-8 → L-1 + L-23 ; PCN-13 → L-23 ; PCN-21 → L-24 ; PNC-5 → L-33 ; PNC-7, PNC-8 → L-28 ; PNC-14 → Q-2 ; CRU-3, CRN-CREATION-VUE → L-8 + L-21 ; CRW-2, CRP-1, CRU-2/CRB-2 → L-9 ; CRW-5 → Q-6 ; CRW-6 → L-37 ; CRP-2 → L-25 ; CRU-4/CRB-8 → L-19 ; CRU-5 → L-26 ; CRU-8 → L-18 ; T11-1 → L-11 ; T10-M2-1 → E-2 ; PCN-144 → L-8 |

Doublons marqués au registre (37 lignes CA12) : la ligne primaire d'un L est sa première source dans l'ordre M1, M2, M3, M4.

## 2. Classes

Gravité : B bloquant, G grave, m moyen ou mineur, d détail. Classe : (a) confirmé sur le tour 12, capture regardée ; (b) à rejouer.

| Classe | Nombre | L |
|---|---|---|
| (a) | 55 | L-1 à L-47, L-49 à L-55, L-66 |
| (b) | 17 | L-48, L-56 à L-65, L-67 à L-72 |
| (d) | 7 | Q-1 à Q-7 |
| (e) | 2 | E-1, E-2 |

Parties (b) dans une ligne (a) : L-8 (PCN-144), L-17 (zone sûre de 48 px, M4-25, hypothèse), L-19 (prix CHF sous « EUR », D419 mouvant).

## 3. Lots (ordre : B, puis G, puis moyens et mineurs)

Règle : deux lots ne touchent jamais le même fichier. Un lot qui a besoin de CSS hors de ses fichiers l'écrit dans un fichier CSS neuf à
lui (ex. `carnets-liste.css`), importé par son composant. Une cause qui se révèle dans le fichier d'un autre lot : la ligne passe à ce lot,
elle ne s'y corrige pas en parallèle. Chaque lot : test rouge d'abord (Playwright `e2e/carnet/` ou Vitest), `tsc` incrémental, tests ciblés.
`functions/` : déploiement à part (`firebase deploy --only functions`), accord du brasseur requis.

| Lot | Gravité | Thème | L | Fichiers possédés | functions/ |
|---|---|---|---|---|---|
| 1 | B | Rangement IA et lecture des liens | L-1 à L-8 | `functions/src/lireLien.ts`, `functions/src/carnetIA.ts`, `functions/src/ai.ts`, `src/ui/carnets/rangement.ts`, `src/domain/carnets/ia.ts`, `src/ui/carnets/Bandeau.tsx` | **oui** (L-3, L-4, L-7) |
| 2 | B | Carnet ↔ plan, prix d'article | L-9 à L-16 | `src/domain/carnets/operations.ts`, `src/ui/carnets/CarnetsVue.tsx`, `src/ui/carnets/FicheArticle.tsx`, `src/ui/carnets/EtatIA.tsx`, `src/ui/carnets/SupprimerCarnet.tsx` | non |
| 3 | G | Carnet ouvert : mise en page | L-17 à L-22 | `src/ui/carnets/CarnetOuvert.tsx`, `src/ui/carnets/carnets.css`, `src/ui/carnets/carnets-decider.css`, `src/ui/carnets/LigneRangee.tsx` | non |
| 4 | G | Article, Comparer, photos, CSP | L-23 à L-29 | `firebase.json`, `src/ui/carnets/CarteArticle.tsx`, `src/ui/carnets/Comparer.tsx`, `src/domain/carnets/comparer.ts`, `src/ui/carnets/pictos.tsx`, `src/ui/carnets/Photos.tsx`, `src/ui/carnets/photo.ts`, `src/domain/carnets/modele.ts` | possible (L-24 : lecture d'une photo) ; `firebase.json` = hosting |
| 5 | G | Liste des carnets | L-30 à L-35 | `src/ui/carnets/ListeCarnets.tsx`, `src/domain/carnets/rattacher.ts`, `src/ui/carnets/CadreArrivee.tsx`, CSS neuf `carnets-liste.css` | non |
| 6 | G | À venir et saisie des montants | L-36 à L-43 | `src/ui/finance/UpgradeWorkspace.tsx`, `src/ui/finance/projet/ProjetPiste.tsx`, `src/ui/finance/ChampMontant.tsx`, `src/ui/numericInput.ts`, `src/domain/finance/upgradeRing.ts` | non |
| 7 | m | Champ du carnet et Choisir | L-44 à L-48 | `src/ui/carnets/ChampCarnet.tsx`, `src/ui/carnets/RenommerCarnet.tsx`, `src/ui/carnets/Choisir.tsx` | non |
| 8 | m | App : enregistrement, rechargement, adresses | L-49 à L-56 | `src/ui/PersistenceStatus.tsx`, `src/services/firestoreRepo.ts`, `src/ui/BandeauMiseAJour.tsx`, `src/App.tsx`, `src/components/tabs/StocksTab.tsx`, `src/ui/carnets/AtelierPorte.tsx`, `src/ui/finance/ExpenseSheet.tsx` | non |
| 9 | m | Calendrier : frise et en-tête (T11) | L-57 à L-64 | `src/ui/calendrier/frise/usePointeur.ts`, `src/ui/calendrier/entete/*` (EnTete, Courbe, BandeColonnes, entete.css), `src/ui/calendrier/frise/Rangee.tsx`, `Barre.tsx`, `Fenetre.tsx`, `frise.css` | non |
| 10 | m | Calendrier : fiches, feuilles, bandeau | L-65 à L-72 | `src/components/tabs/CalendrierTab.tsx`, `src/ui/calendrier/frise/DetailChose.tsx`, `fiche.css`, `FeuilleAjout.tsx`, `MenuAppuiLong.tsx`, `DureeFenetre.tsx`, `src/ui/calendrier/message.css` | non |

Lot 6 contient deux G (L-36, L-37) : il passe avec les G. Lots 7 à 10 : moyens et mineurs, ceux d'un même fichier ensemble.

## 4. Défauts par lot

Chemins relatifs à `port-carnet/`. « M1-3 » = CA12-M1-3.

### Lot 1 — B — Rangement IA et lecture des liens (functions : oui)

- **L-1 — B — (a) — La page lue est perdue quand le rangement échoue : « lecture… » sans fin, aucun Relire** (M1-1, M3-2 ; CRU-NOTE-1, PCN-8).
  Vrai lien ggmgastro : `lireLien` rend « lue » (2 763,65 CHF, photo), le rangement échoue, l'article reste « ? ggmgastro.com · lecture… »,
  même après rechargement (M1 13, 14, 16 ; M3 30 : 14 min) ; le 1er article perd alors son nom (M3 63).
  Cause : `rangement.ts:331` et `:340` finissent en `echec` sans écrire `pages` : la lecture faite est jetée, l'article local garde son état
  de lecture ; `reprendre` (`rangement.ts` ~l. 288) n'est offert qu'au retour du réseau, jamais après un échec.
  Oracle : rangement simulé en échec après une lecture « lue » : l'article porte nom, prix et photo lus, ou « non lu · Relire » ; jamais « lecture… » après la fin.
- **L-2 — B — (a) — Une phrase tapée sur la liste est versée dans un vrai carnet sans confirmation ; « Carnet créé » est faux** (M3-1, M4-23).
  « ZZ TEST — M3 — cellule de garde 2,6 m3 » devient le critère « 2,6 m³ · de votre phrase » de Chambre froide ; toast « Carnet créé, en tête des Carnets ».
  Cause : `ia.ts:181-230` (`lireReponse`) accepte un `carnetId` connu rendu par l'IA alors que l'aperçu (`rattacher`) disait « Nouveau carnet » ;
  `contexteModele` (`ia.ts:120-128`) envoie 30 carnets ; le bandeau (`Bandeau.tsx:3`) est posé d'après l'écriture locale. Remède probable : depuis la liste,
  un carnet existant reste une proposition (`accepterProposition`, `operations.ts:372`, déjà là), jamais une écriture directe.
  Oracle : réponse simulée qui range dans un carnet existant depuis la liste → aucun document de ce carnet modifié, une proposition « Y ajouter ? ».
- **L-3 — G — (a) — `rangerCarnet` coupé au plafond de sortie après 32 s** (M1-1, M3-2). Cause : `functions/src/carnetIA.ts:107`
  (`maxOutputTokens: 4000`), appliqué par `ai.ts:459` ; contexte de 30 carnets plus la page lue. Mesurer la taille de sortie sur la vraie
  réponse avant de relever le plafond (L20). Test : Gemini simulé, réponse tronquée → avis « L'IA a mis trop de temps » et L-1 tient.
- **L-4 — G — (a) — Lien de vendeur non lu sans raison ; un domaine inexistant est dit « robots »** (M2-5, M3-2 brewtools, M2-6).
  Brouwland (page publique avec prix) et brewtools B100 : « page non lue », nom tiré de l'adresse. Cause : `lireLien.ts:276-302` (robots.txt
  en 5xx ou en panne réseau = refus, RFC 9309 ; un DNS introuvable tombe aussi en `robots`), borne de 8 s (`lireLien.ts:15`) ; l'écran ne dit
  pas le statut (`Bandeau.tsx:51`). Cause exacte de brouwland : à établir au journal des fonctions (lecture seule).
- **L-5 — G — (a) — Une note de trois lignes : une ligne disparaît, la suppression en compte trois** (M3-7). Cause probable : `ia.ts`
  (`lireReponse`) : une ligne du message que l'IA ne rend pas n'est gardée nulle part, l'écriture IA remplace les effets locaux. À confirmer.
- **L-6 — m — (a) — Critères mal attribués** (« proposé par l'IA » pour des mots de sa phrase) (M1-13). Cause : `ia.ts` (origine de chaque
  ligne), `functions/src/carnetIA.ts` (`assainirRangerCarnet`).
- **L-7 — m — (a) — Lien sans prix (Wikipédia) rangé en note « conseil » dont le texte est l'URL brute, sous le ⋯** (M2-15). Cause :
  `carnetIA.ts` / `ia.ts` (page lue sans offre → note avec l'adresse).
- **L-8 — m — (a) — Deux états à la fois** : à la création, la liste dit « À comparer · 1 article · 400 CHF » (budget lu comme prix
  d'article) puis la fiche « Idée » ; « ✓ Rangé ici » pendant « ✻ L'IA range… » ; « votre phrase en titre » qui reste ; hors ligne puis en ligne,
  deux bandeaux empilés (M1-11, M2-11, M4-27, M1-23 ; CRU-3, CRN-CREATION-VUE ; PCN-144 en (b)).
  Cause : `Bandeau.tsx:3, 16-18` (posé à l'écriture locale, jamais remplacé) ; analyse locale : `rangement.ts:220` (`prixSource: 'texte'`).

### Lot 2 — B — Carnet ↔ plan, prix d'article (functions : non)

- **L-9 — B — (a) — Prix d'article absent et aucun geste pour le poser** (M4-5, M1-6 ; CRW-2, CRP-1, CRU-2/CRB-2 rejoués KO). Ses mots
  du 21.11 : « il y a même pas le prix de la chambre froide ?? ». Les articles lus avant CRP-1 n'ont pas de prix ; tapé dans le champ, le prix
  devient une note. Cause : `operations.ts:483` (`modifierLigne` : critère, façon, note ; aucune opération sur l'article) ;
  `FicheArticle.tsx:246` (offre sans champ) ; branchement par `CarnetsVue.tsx:1313`. Relire la page : voir L-1.
- **L-10 — G — (a) — Le prix du choix ne monte pas au plan** (M1-3, M2-2). Choisi à 2 495,6 CHF : À venir 500, « prix ou devis, à
  chercher », Calendrier −500. Cause : `CarnetsVue.tsx:1446-1451` (`placer` n'écrit rien), `:1453-1459` (`envoyerAVenir` n'écrit que si le
  plan manque) ; `operations.ts:643-646` (`avecPrixEstime` ne remplace jamais un montant) ; `planDepuisChoix` `:600-611`. Le **montant**
  attend Q-1 ; l'étape (« à chercher » alors que le prix est connu) n'en dépend pas.
- **L-11 — G — (a) — Après « Au calendrier », la date et le prix changés au carnet ne suivent pas, ni l'inverse** (M4-4, M2-2 ; T11-1
  rejoué KO). Carnet « vers déc. · 200 CHF » ; À venir « Aucun prix », « Posé sur mars » ; plan à 450, carnet à 500. Cause :
  `CarnetsVue.tsx:1420-1431` (plan `deja` repris tel quel, date jamais réécrite), `operations.ts:643-646` ; le carnet lit `estimatedCost`
  (`CarnetOuvert.tsx:640`), jamais le plan.
- **L-12 — G — (a) — Le carnet dit « Dans À venir » quand son plan est réalisé sans achat, archivé, supprimé ; acheté, il dit Idée et offre
  Au calendrier** (M2-3, M3-6, M3-17, M3-5 côté carnet). Cause : `operations.ts:678-684` (`etatSortie` : plan absent ou archivé →
  `a-venir` ; « Réalisé, sans achat » n'est pas `estRealise`) ; `:693-701` ; texte `EtatIA.tsx:40`.
- **L-13 — G — (a) — Retour du téléphone quitte l'app** depuis un carnet ou Comparer (M1-4, M2-7). Cause : aucune entrée d'historique dans
  `src/ui/carnets` (0 `pushState`) ; seul le + écoute `popstate` (`App.tsx:214-229`) ; modèle : `useFullScreenRoute.ts:108-129`. Le
  correctif vit dans `CarnetsVue.tsx` (sa vue), sans toucher `App.tsx` (Lot 8).
- **L-14 — m — (a) — Supprimer un carnet lié : grisé sans dire pourquoi, détour par À venir ; « plan dans À venir » pour un plan réalisé ;
  « Il part avec 1 critère » pour une note** (M1-19, M4-21, libellé de M2-3). Cause : `SupprimerCarnet.tsx` ; `operations.ts:702-760`
  (`texteLiens`, détacher, archiver). Le libellé du menu ⋯ est L-22.
- **L-15 — m — (a) — Formats : un prix en trois formats, du texte en chasse fixe, « 1.845 mm »** (M1-15, M4-8, M4-9, mono de M3-13, point
  de M2-4). Cause : `EtatIA.tsx:66` (`montant`), `:75` (`valeurTexte`) ; `FicheArticle.tsx:172, 212, 246` (`cn-mono` sur toute valeur) ;
  la liste lit `montant` (`ListeCarnets.tsx:95-103`) et suit.
- **L-16 — d — (a) — Fiche article : balayage sans effet ; le retour perd le défilement** (M4-18). Cause : `FicheArticle.tsx` (aucun suivant),
  `CarnetsVue.tsx:1313`.

### Lot 3 — G — Carnet ouvert : mise en page (functions : non)

- **L-17 — G — (a) — Paysage 844×340 : le champ passe sous la barre ; un toucher sur une carte tombe dans le champ** (M1-7, M4-1 ; Comparer
  en paysage, note PW ; M4-25 en (b)). Cause : `carnets.css:268` (`.cn-champ-zone` collant) ; réserve basse `calc(--main-navigation-height
  + .75rem)` sans `env(safe-area-inset-bottom)` (M4, hypothèse).
- **L-18 — G — (a) — Rangée Quand : puces sous « Au calendrier » et sous le libellé, hors écran ; forme qui change trois fois ; choix fait
  invisible ; puces en 12 px** (M1-21, M3-12, M4-2, M4-3, PW-3 ; CRU-8 rejoué KO). Cause : `carnets.css:687-698` (une rangée `flex-wrap`,
  `.cn-horizons` qui défile sans place réservée, `font-size: 12px !important`). Épreuve prête : `mise-en-page.spec.ts` (`CONNUS`).
- **L-19 — G — (a) — Tableau des articles à 390 : colonnes rognées (« Exécutio. », « 2 763.6 »), deux en-têtes « CHF », colonnes qui se touchent**
  (M1-14, M2-4, M4-7, PW-4 ; CRU-4/CRB-8 ; prix CHF sous « EUR » en (b)). Cause : `CarnetOuvert.tsx:750-790` (prix en `cn-tab-etendue` et
  colonne CHF), `carnets-decider.css:119` (`nowrap`).
- **L-20 — G — (a) — Aucun geste ne retire un critère** (M3-1). Appui court, long, menu ⋯ : rien. Cause : `supprimerLigne`
  (`operations.ts:501`) n'est branché que pour les notes (`CarnetOuvert.tsx`, `LigneRangee.tsx`). Si l'opération refuse un critère, la ligne passe au Lot 2.
- **L-21 — m — (a) — La mise en page change après le rangement : la note devient critère, la section Notes disparaît** (M4-22 ; CRU-3 b).
  Cause : `CarnetOuvert.tsx:426-440` (ordre et présence des rubriques selon le contenu).
- **L-22 — d — (a) — Menu ⋯ : « Supprimer l'idée » ou « Supprimer le carnet » selon l'état** (M2-18). Cause : `CarnetOuvert.tsx:406`.

### Lot 4 — G — Article, Comparer, photos, CSP (functions : possible pour L-24 ; firebase.json = hosting)

- **L-23 — G — (a) — La CSP bloque les photos des vendeurs** (M1-2, M4-10 ; PCN-13, PCN-8). Console : « violates the following Content Security
  Policy directive ». Cause : `firebase.json:42` (`img-src 'self' data: blob: https://*.googleusercontent.com …`). Décision à écrire :
  liste d'hôtes, `https:` pour les images, ou copie des photos dans Storage.
- **L-24 — G — (a) — Une photo jointe n'est jamais lue ; la vignette « non lue » est inerte** (M1-5 ; PCN-21). Cause : `Photos.tsx:3-11`
  (lue seulement si `lue: true` ; aucun geste pour la faire lire) ; aucune tâche de lecture de photo pour le carnet (à vérifier dans `functions/`).
- **L-25 — G — (a) — « Tôle d&#039;acier » dans les articles lus avant CRP-2** (M1-16, M4-6, entité de M3-13 ; CRP-2). Cause :
  `functions/src/lireLien.ts:132-157` décode depuis CRP-2, pas les articles déjà stockés ; décoder à la lecture du document
  (`src/domain/carnets/modele.ts`). Pas de migration des données réelles sans accord.
- **L-26 — G — (a) — Comparer : 1re valeur vers 520 px sur 844 ; noms sur trois lignes** (M3-14, M4-11 ; CRU-5). Cause : `Comparer.tsx`
  (fil, titre, « 2 articles », « Classé par Prix ? », en-tête vide de 50 px).
- **L-27 — m — (a) — Comparer d'un carnet Choisi : « 1 article » mais seulement les lignes non lues** (M2-13). Cause : `comparer.ts:92`, `Comparer.tsx`.
- **L-28 — m — (a) — Pictos : lettres seules (« M », « C », « J »), picto du carnet sur un autre objet, jalons distingués par le seul titre**
  (M2-14, lettre de M3-18 ; PNC-7, PNC-8). Cause : `pictos.tsx:241-250` (initiale), `CarteArticle.tsx` (picto du carnet).
- **L-29 — m — (a) — Titre « …30 L, budget » ; le titre de l'IA n'est pas proposé** (M1-12). Cause : `modele.ts:415-457` (`titreDePhrase` : le
  prix retiré laisse « budget »).

### Lot 5 — G — Liste des carnets (functions : non)

- **L-30 — G — (a) — « Déjà un carnet proche » ou aperçu « Nouveau carnet » : Ajouter ouvre Chambre froide et la phrase disparaît** (M3-3, M4-24).
  Cause probable : `CadreArrivee.tsx` (« Y ajouter »), `rattacher.ts:124` (`carnetProche`) ; la destination est aussi calculée dans
  `CarnetsVue.tsx:217-224` et `:379-387` : si la cause y est, la ligne passe au Lot 2.
- **L-31 — m — (a) — Titres de la liste coupés à une ligne** (4 au repos, 8 en fin de liste) (M4-12). Cause : `ListeCarnets.tsx` (line-clamp).
- **L-32 — m — (a) — « Dans À venir depuis le … · Voir » sur deux lignes, 48 px, répété cinq fois** (M4-13). Cause : `ListeCarnets.tsx`.
- **L-33 — m — (a) — Cartes Idée sans coût ni date** (PNC-5 rejoué KO par M1). Cause : `ListeCarnets.tsx:95-103` (prix des articles seuls).
- **L-34 — d — (a) — Filtres : « Chercher un carnel » coupé, focus rogné ; Choisi actif sans aucun retour** (M4-14, M4-15). Cause : `ListeCarnets.tsx:269-272`.
- **L-35 — d — (a) — La recherche masque les Faits sans le dire** (M4-16 ; M1-9 en partie). Cause : `ListeCarnets.tsx:318` (`!filtre &&
  faits.length`). Ce qu'elle doit couvrir : Q-2 ; dire « N carnets Faits » n'en dépend pas.

### Lot 6 — G — À venir et saisie des montants (functions : non)

- **L-36 — G — (a) — « 12,345.67 » devient 12,34 ; le message dit « 1234,5 conservée »** (M2-1). Cause : `ChampMontant.tsx:73-75`,
  `numericInput.ts:23` (`parseDecimal`).
- **L-37 — G — (a) — Retirer l'écriture qui a soldé le plan le laisse « Acheté · achats liés : aucun » ; Réalisés montre la date prévue**
  (M3-5, date de M3-18 ; CRW-6). Cause : `upgradeRing.ts` (`estRealise`, `dateFacture` : lien plan ↔ écriture) ; l'étape `bought` n'est pas
  recalculée au retrait (geste de retrait à localiser dans Finances).
- **L-38 — m — (a) — « 12’345,50 » (apostrophe du clavier iPhone) refusé** (M2-10). Cause : `numericInput.ts:23`, `ChampMontant.tsx:74`.
- **L-39 — m — (a) — Prix du plan tapé (777) perdu au rechargement sans avertir** (M2-9, prix). Cause : `ProjetPiste.tsx` / `UpgradeWorkspace.tsx` (brouillon non gardé).
- **L-40 — m — (a) — À venir : mois sans année ; juil. avant nov.** (M1-10). Cause : `UpgradeWorkspace.tsx:154` (tri par `timing` puis date),
  `:73`, `:89` (`nomMois` sans année).
- **L-41 — m — (a) — À venir : titres rognés sous « à estimer », « 500,00 » ; « Oui, supprimer » coupé en bas ; cible de 19 px en paysage ;
  « Prévu en 11 janv. 2027 »** (M1-26, M1-28, M3-15, M4-28). Cause : `UpgradeWorkspace.tsx:73`, `ProjetPiste.tsx:55`.
- **L-42 — m — (a) — « Posé sur novembre, mais hors de tes prévisions » alors que le Calendrier compte −500** (M3-10). Cause :
  `UpgradeWorkspace.tsx:331` ; plan `draft` (`operations.ts:624-630`) compté par `useDonneesCalendrier.ts:188`.
- **L-43 — m — (a) — Le plan garde l'ancien titre du carnet renommé** (M2-16). Cause : `operations.ts:516-535` ne touche pas le plan ;
  correctif côté lecture : `UpgradeWorkspace.tsx:59-61` a le carnet (`doc`).

### Lot 7 — m — Champ du carnet et Choisir (functions : non)

- **L-44 — m — (a) — Choisir un article à 2 495,6 CHF sous « Budget max 400 CHF » : aucune alerte** (M1-17). Cause : `Choisir.tsx`.
- **L-45 — m — (a) — Brouillon du champ perdu au rechargement** (M2-9, champ). Cause : `ChampCarnet.tsx` (aucun brouillon gardé).
- **L-46 — d — (a) — Renommer : le champ du bas garde « Ajouter à… » ; titre vide refusé sans un mot** (M1-27, M2-17). Cause : `ChampCarnet.tsx:27`, `RenommerCarnet.tsx`.
- **L-47 — d — (a) — Le clavier se ferme après Ajouter** (M4-26). Cause : `ChampCarnet.tsx` (le focus part au `body`).
- **L-48 — m — (b) — Clavier : dernière note hors vue, « Va dans » sur les critères** (M1-8, 390×544 simulé ; M4 le contredit). Rejouer à 390×844 avec 300 px.

### Lot 8 — m — App : enregistrement, rechargement, adresses (functions : non)

- **L-49 — m — (a) — « Enregistrement sur le serveur… » reste des minutes et cache ‹ Nov. ›** (M1-18, M2-12). Cause : `PersistenceStatus.tsx:11-13` ;
  `firestoreRepo.ts:327` (`pending` tant qu'un document garde `hasPendingWrites`, l. 168). Cause exacte à établir.
- **L-50 — m — (a) — Au rechargement, l'app rouvre un autre écran (Stocks ou Calendrier) et une autre mise en page** (M1-24, M2-9 écran).
  Cause : `App.tsx` (onglet actif non gardé), `StocksTab.tsx:191-193` (carnet ouvert non gardé).
- **L-51 — m — (a) — Deux adresses ; « Ouvrir » (fiche du Calendrier) mène à Stocks › Matériel › Carnets ; « Voir » n'amène pas à l'élément**
  (T11-18, M1-25 Ouvrir, M4-17). Cause : `StocksTab.tsx:191-193`, `App.tsx` (cible de navigation). Lecture étroite (L01) : Ouvrir rend le
  carnet lui-même, Voir désigne l'élément ; sa plainte du 21.11 (« ça renvoie même pas sur le carnet ») suffit. Fondre les deux entrées
  en une seule n'est pas dans cette ligne.
- **L-52 — m — (a) — « Nouvelle idée » depuis un carnet ouvert met le focus dans « Ajouter à Chambre… »** (M3-8). Cause : `StocksTab.tsx:347`.
- **L-53 — m — (a) — Entrée dans le titre d'une écriture l'enregistre sans toucher Payé** (M3-9). Cause probable : `ExpenseSheet.tsx:1652`.
- **L-54 — d — (a) — Bandeau « Dans À venir. » posé sur le champ du bas** (M2-19). Cause : hôte du message du Carnet (`StocksTab.tsx`, `AtelierPorte.tsx`).
- **L-55 — d — (a) — Bulle « Nouvelle version · Recharger » sur l'en-tête** (M3-16). Cause : `BandeauMiseAJour.tsx:16` (`fixed top`).
- **L-56 — m — (b) — Hors ligne : aucun signe** (T11-13). Cause : `PersistenceStatus.tsx:11` (aucun état hors ligne).

### Lot 9 — m — Calendrier : frise et en-tête (T11 ; functions : non)

- **L-57 — m — (b) — Bord droit : course entre défilement et lever, barre posée hors fenêtre** (T11-3). `usePointeur.ts:308-330` (`majDefile`).
- **L-58 — m — (b) — En-tête : « CHF à dépense » coupé, groupe ‹ Mois › qui glisse de 6 px** (T11-4, T11-5 ; « il faudrait des tailles fix »). `EnTete.tsx` (largeurs non fixées).
- **L-59 — m — (b) — Semaine dépliée : courbe et cadre restent en semaines** (T11-11). `BandeColonnes.tsx`, `EnTete.tsx`, `Courbe.tsx`.
- **L-60 — d — (b) — Butée du passé sans repère** (T11-14). `Fenetre.tsx`, `Courbe.tsx`.
- **L-61 — d — (b) — Menu Période et vue : « 6 sem. » non marqué** (T11-16). `EnTete.tsx` (menu).
- **L-62 — d — (b) — Cibles : ± 22×28** (T11-19). DESIGN.md:505 admet `touch-sm` 24 px pour une commande répétée de ligne : seul ± est sous tout plancher ; les autres à juger.
- **L-63 — d — (b) — Rangées : icône et montant placés différemment** (T11-21). `Rangee.tsx`, `Barre.tsx`.
- **L-64 — m — (b) — Barre de brassin posée au lundi** (T11-23). `Barre.tsx`.

### Lot 10 — m — Calendrier : fiches, feuilles, bandeau (functions : non)

- **L-65 — G — (b) — « Annuler » du bandeau « achat prévu posé » sans effet au doigt (CDP), effet au clic** (M3-4). Cause à établir :
  `CalendrierTab.tsx:472-481` (garde de 400 ms, `montrer`) ; rejouer au doigt réel avant tout correctif.
- **L-66 — d — (a) — Titre de la fiche du Calendrier rogné** (T11-7, M1-25 titre, M3-11, M4-29). Cause : `fiche.css:16` (`.cal-fi-nom`
  `nowrap` et `ellipsis`), `DetailChose.tsx:371`.
- **L-67 — d — (b) — Modifier : « vers févr. · S6 » sans 2027 ; Durée la dit deux fois** (T11-6). `DureeFenetre.tsx`, `DetailChose.tsx`.
- **L-68 — m — (b) — Modifier : × jette la saisie sans un mot** (T11-12). `DetailChose.tsx`.
- **L-69 — d — (b) — Poser une fête : brouillon perdu au rechargement** (T11-15). `FeuilleAjout.tsx`.
- **L-70 — d — (b) — Feuilles du + : « Durée 1 j » pour un achat, trois écritures de la même semaine** (T11-17). `FeuilleAjout.tsx`.
- **L-71 — d — (b) — Appui long : « Ranger sans date » en rouge, pas de Supprimer** (T11-20). `MenuAppuiLong.tsx`, `DetailChose.tsx`.
- **L-72 — d — (b) — + après une semaine dépliée : propose S48 au lieu de la semaine touchée** (T11-24). `CalendrierTab.tsx`.

## 5. Classe (d) : choix du brasseur (7)

Règle n° 1 : un choix ouvert se montre en mini maquettes, dans un artefact neuf (CLAUDE.md, L24). Rien de ce qui en dépend n'est codé avant sa réponse.

- **Q-1 — Le prix d'un projet : estimé ou choisi ?** (M1-3, M2-2 montant ; M1-22). Quand un article est choisi, le plan prend-il son prix
  (A), garde-t-il l'estimé avec le choisi à côté, « estimé 500 · choisi 2 495,6 » (B), ou le plus récent des deux gestes (C) ? Et le « Prix
  estimé » du carnet : cinq pastilles fixes (100 à 5 000, sa maquette) ou une pastille de plus avec le budget lu ou le prix lu (« 400 ») ?
  Maquettes : la ligne À venir, la fiche du Calendrier et la pastille du carnet, dans les trois options.
- **Q-2 — La recherche des carnets couvre-t-elle les Faits, les articles et les notes ?** (M1-9 ; PNC-14 rejoué KO : « évier » 1 sur 4).
  A : titres des carnets en cours (aujourd'hui) ; B : plus les Faits, en groupe à part ; C : plus le texte des articles et notes, la ligne
  trouvée citée sous la carte. Maquettes : « évier » et « froide » dans les trois.
- **Q-3 — CARNET-LIS : aucun texte sous 14 px, ou 12 px comme DESIGN.md pour un libellé compact ?** (note PW). Liste à 13 et 12 px aujourd'hui.
  Maquettes : la liste et le carnet ouvert à 12 px et à 14 px côte à côte.
- **Q-4 — Le choix de date hors de la frise partagée** (PW-2, M4-20, M4-19, T11-22). Quand du carnet (Aujourd'hui · 1 mois … Plus tard), Posé
  sur d'À venir (grille de mois), jours « L 8 … D 14 » de Modifier, pastille de date inerte de la fiche. Son choix A1/B1 les garde-t-il ?
  Maquettes : chaque lieu avec ses puces actuelles et avec la frise partagée (`.cal-f-duree`).
- **Q-5 — CARNET-LIS « au plus 40 mots visibles » vaut-il pour l'app ?** (PW-1 : 70 mots au repos). A : oui, Quand et Prix estimé repliés
  derrière un toucher ; B : non, la règle valait pour les maquettes. Maquettes : le carnet Frigo au repos dans A et B.
- **Q-6 — « Commander » dans un carnet choisi** (CRW-5 rejoué KO ; D421 n'en dit rien). A : rien de plus, Placer suffit ; B : un état « commandé
  le … » avec un délai attendu. Maquettes : la carte Choisi dans A et B.
- **Q-7 — T11-10 : « S44 – S49 » sur le cadre, au-dessus des graduations** : déjà posée, Calendrier Q-5, artefact publié
  (https://claude.ai/artifact/Md1VuUPY2uwCRsbrRnWJPR). Rien à refaire.

## 6. Classe (e) : environnement et données réelles (2)

- **E-1 — Données réelles touchées par un test** (M3-1, M4-23). Dans le VRAI carnet Chambre froide (`creativeItems/CARNET-a803e02f-e8c4-4119-8ef2-d3ff0ae803af`) :
  le critère `CRIT-ffa36c63-9017-419d-849a-339404309dc6` (« 2,6 m³ · de votre phrase ») dans `carnet.criteres[]`, et le message ZZ
  `MSG-06383e2a-cac2-4e55-bea5-8b0ca36994d9`. À retirer, ces deux éléments seulement, **avec son accord**. Le geste de l'app manque (L-20).
  Reste aussi l'écriture « ZZ TEST — M3 — achat B100 » annulée (une écriture ne se supprime pas) : rien à faire.
- **E-2 — Le service worker sert l'ancien paquet** (M1-20, M2-8, M3-16 ; T10-M2-1 ; D429). Chaque testeur a dû le contourner ; le
  rechargement ordinaire revient au tour 11. Cause à établir (D429 : `registerType`, précache, `skipWaiting`) avant le tour 13 : sans elle,
  le brasseur et la contre-épreuve jugent l'ancien paquet.

## 7. Ordre et limites

1. E-2 d'abord (sinon personne ne voit le tour 13) ; E-1 dans les accords groupés.
2. Lots 1 et 2 (B) en parallèle ; puis 3, 4, 5, 6 (G) ; puis 7, 8, 9, 10. Les lots d'un même rang tournent en parallèle (fichiers disjoints).
3. Lot 1 et `firebase.json` (Lot 4) : déploiements à part, accord du brasseur. L-10 (montant) attend Q-1 ; L-35 (portée) attend Q-2.
4. Contre-épreuve unique du Carnet au tour 13 : rejouer chaque (b) ; une ligne qui ne se reproduit pas sort de la liste.

Limites : causes lues au code, non exécutées ; les captures n'ont pas été rouvertes pour cette synthèse, les verdicts reposent sur les
rapports M1 à M4 (qui citent chacune leurs captures regardées). Les lignes T11 viennent du tour 11. Le découpage « un fichier, un lot » a
fixé où se fait chaque correctif (ex. L-13 dans `CarnetsVue.tsx`, L-43 côté lecture) ; un correctif qui exige un autre fichier change de lot.
