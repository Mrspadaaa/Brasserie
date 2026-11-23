OK — données et IA simulée corrigées : P4, P7, P8, P10/P23, P11, P15, P19, P20, P22, P40, P44

# corr4-A-donnees-ia — résultat (18.11)

Worktree `port-carnet` (branche `claude/port-carnet-1711`), aucun commit, aucun build, aucun Gemini (IA simulée seulement), aucune donnée
réelle. Vite (dev) lancé sur 60471 avec les variables fictives du banc, captures prises, serveur arrêté (port vérifié libre).

## Fichiers écrits (tous dans Possède)

- `src/domain/carnets/analyseLocale.ts` : lookbehind `(?<!\p{L})` + drapeau `u` sur la devise avant le nombre (P40) ;
  `sansPrefixeBanc`, `mettreEnForme` (préfixe ôté, infinitif en tête : « faut appeler » → « Appeler »), `critereDe` (partie mesurable
  seule) ; `genreLocal` ignore le préfixe et reconnaît un achat par « N pièces / x2 / Ø » (après le verbe en tête) ; `LigneLocale`
  gagne `phrase` (la ligne tapée), `texte` devient la ligne mise en forme ; `analyserTexte` met les achats en tête (R35, tri stable).
- `src/domain/carnets/modele.ts` : `prixLus` délègue à `prixTousDe` (rustine DEVISE_COLLEE/DEVISE_SUIVANTE retirée) ; `titreDePhrase`
  rend « ZZ TEST — Moulin à malt » quand la suite du « : » est un critère ; `EffetMessage.fusion` (critère d'avant) ;
  `DonneesMessage.propositions` (`PropositionCritere`) ; `lireMessage` relit les deux.
- `src/domain/carnets/operations.ts` : un critère qui précise une caractéristique déjà là (même nom + unité, ou même unité lue) se fond
  dans le critère existant sauf s'il est de ses mots (`origine: 'vous'`), effet `fusion` ; `remplacerRangement` remet le critère d'avant
  au lieu de le retirer ; une ligne `propose` n'est pas écrite, elle va dans `message.propositions` ; `accepterProposition(etat,
  { messageId, index })` la range (annulable).
- `src/domain/carnets/ia.ts` : `LigneCarnet.propose?: true` ; `lireReponse` la garde seulement sur un critère d'un carnet connu avec
  caractéristique, sinon retire la ligne (jamais écrite comme acceptée).
- `src/domain/carnets/iaSimulee.ts` : critère « Moins de condensation au plafond : capter la buée » (débit, plus) ; « Capter les buées au-dessus
  de la cuve : 1 200 m³/h au moins » ; G9 « Un fût de 30 L couché entre dans le bac (38 cm) » ; une phrase « titre : critère » rend
  l'idée et le critère seul ; note en vrac mise en forme (préfixe et libellé de carnet ôtés, infinitif, majuscule), genre par ligne
  (objets nommés en tête = achat), achats en tête ; proposition de la caractéristique commune au 2e article lu (`communeLue`) ; pages
  du banc complètes (vendeur, valeurs et unités) ; `caracteristiquesLues` (valeur non vide, un nom une fois).
- `src/domain/carnets/fixture.ts` : K1 = `CRITERE_CONDENSATION` ; ZZ-MSG-V1 garde « … plus de condensation au plafond » ; note ZZ-V-N3
  `NOTE_COMME_CRITERE` + ZZ-MSG-V4 (P19) ; carnet `ZZ-CARNET-EXTRACTION` « Extracteur pour la salle de fermentation » + ZZ-MSG-X1 (P20) ;
  `NOTE_VRAC_BANC` (g5:v01-16). Aucun ID existant changé ; préfixe « ZZ TEST — » partout.
- `functions/src/carnetIA.ts` : schéma `propose` (BOOLEAN), gardé par `assainirRangerCarnet` ; consigne : genre de chaque ligne
  (« note » en dernier), libellé et préfixe ôtés, infinitif, critère sans titre et avec ses nombres, « plus de X » qui gêne → « Moins de /
  Pas de X », règle `propose`. Écrit et typé, **non déployé** (§ Accords, lot G).
- Tests : `carnetsCritique4Donnees.test.ts` (neuf, 25 cas) ; mis à jour : `carnetsModele` (6 idées, 13 messages), `carnetsOperations`
  (texte de K1), `carnetsIA` (P15), `carnetsBanc` (raison d'écarté au contrat P41 du lot qui tient `comparer.ts`).
- Voie : `captures.cjs`, `journal.txt`, `05-390-clair.png`, `05-1280-clair.png`, `10-390-clair.png`, `vite.log`.

## Problème → fait → preuve

| n° | Fait | Preuve |
|---|---|---|
| P40 | devise avant le nombre détachée d'une lettre ; `prixLus` délègue | test : `moteur 189,90 CHF` → `{18990, CHF, « 189,90 CHF »}` ; `CHF 690.-`, `EUR 120`, `120 €`, `Fr. 45.50`, `prix:CHF 690` lus ; `prixLus ≡ prixTousDe` |
| P4 | critère sans titre ni préfixe (local, simulé), titre « Moulin à malt » | test + captures 05 (390, 1280) : « Ce qui compte · **2 cylindres, 150 kg/h minimum** » |
| P7 | « Capter les buées au-dessus de la cuve : 1 200 m³/h au moins », fondu dans « le débit » (K3), local « Buées … : 1 200 m³/h » | test : 3 critères avant/après, effet `fusion`, remplacement IA, retour à « le débit » |
| P15 | K1, iaSimulee, consigne serveur | test : aucun critère ne commence par « plus de condensation » ; capture 10 : bulle « Le critère « Moins de condensation au plafond : capter la buée » peut trancher… » ; journal : « cite plus de condensation : non » |
| P11 | genre par ligne, reformulée, achats d'abord (simulé et local) | test NOTE_VRAC_BANC → `a-acheter, a-faire, question` ; note du rejeu 22 → 3 achats sans « évier : » |
| P22 | repli : « filtre à air G4, 2 pièces » = à acheter | test `genreLocal`, `analyserTexte`, simulé |
| P44 | « Un fût de 30 L couché entre dans le bac (38 cm) » | test |
| P8 | pages simulées : vendeur, CHF, valeur + unité, un nom une fois | test sur `PAGES_BANC` + `caracteristiquesLues` |
| P10, P23 | `propose: true` au 2e article lu (Débit L/min, plus), non écrite par `ranger`, gardée sur le message, `accepterProposition` | tests simulé, garde, ranger/accepter/annuler, schéma serveur |
| P19 | note ZZ-V-N3 « il faudrait au moins 1 500 m³/h » (sorte critère au local) | test |
| P20 | carnet proche de Ventilation (1 article en veille) | test : `carnetProche(Ventilation)` = `ZZ-CARNET-EXTRACTION` |

## Critères

- (a) `npx vitest run tests/unit/carnetsCritique4Donnees.test.ts` : **25 passed (25)**.
- (b) mes 10 fichiers de test : **189 passed (189)**. `tests/unit/carnets` + `tests/integration/carnetsParcours` : 3 failed | 419 passed,
  aucun de mon fait :
  - `carnetsCorrection1Integration` « libellé d'écarté » : `libelleEcarte` changé par le lot qui tient `comparer.ts` (P41) ;
  - `carnetsParcours` « note en vrac de 3 lignes » : `NoteEnVrac.tsx` (lot des écrans) met la cible dans un `label`, le test lit
    `.cn-sp > p.cn-mut` → `null` ;
  - (`carnetsBanc` P6, mien, aligné sur ce même contrat P41.)
- (c) `tsc --noEmit` app et `functions` : 0 erreur.
- (d) captures ouvertes : 05 à 390 et 1280 clair, « Ce qui compte · 2 cylindres, 150 kg/h minimum », sans titre ; 10 à 390 clair, la
  bulle G8 ne cite plus « plus de condensation ».

Essais : 3 passes de tests (2 corrections) ; captures au 3e lancement (variables du banc manquantes aux deux premiers).

## Doutes et limites

- **K1 sans caractéristique** (écart au brief, qui disait « débit, sens plus ») : `critereQuiTranche` (G8) ne propose qu'un critère sans
  caractéristique ; avec « débit », la bulle G8 disparaissait de Ventilation (retenu R44 perdu). Les lignes neuves de l'IA simulée
  portent bien débit / plus.
- « 30 L » de G9 vient de la maquette, pas de sa phrase (« fond de bac 38 cm minimum ») : texte imposé par le brief, simulé.
- Le bandeau « Nouveau carnet » de 05 montre encore la phrase entière : le cadre « pendant » (lot C) affiche le texte tapé, pas
  `titreDePhrase` ; après l'envoi, le titre sera « ZZ TEST — Moulin à malt ».
- 6e carnet : la liste dit « Carnets 6 », « Aucun de vos 6 carnets ».
- La note de l'état 22 du rejeu n'a pas de question : `NOTE_VRAC_BANC` (g5:v01-16) la montre ; le rejeu doit la coller.
- P8 côté écran (« lu sur la page : débit » sans valeur, « tient 80 °C » deux fois) et P22 côté écran (« IA éteinte ») restent aux lots C/D :
  les données sont complètes.

## Contrats pour B et D

1. `depuisIA` (`CarnetsVue.tsx`) doit recopier `propose: true` sur le critère. Sinon une proposition est écrite comme un critère accepté.
   Accepter = `accepterProposition(etat, { messageId, index })` (ou ranger la même ligne sans `propose`). Les propositions à montrer sont
   dans `lireMessage(m).carnetMessage.propositions`.
2. `LigneLocale.texte` est la ligne mise en forme ; `LigneLocale.phrase` est la ligne tapée. Un titre « votre phrase » ou un rattachement
   doit lire `phrase ?? texte`.
3. `EffetMessage.fusion` : l'effet vise un critère qui existait avant. Ne pas le retirer, et dire « précisé » plutôt que « ajouté ».
4. `caracteristiquesLues(page)` : la liste à afficher sous « lu sur la page : … », avec la valeur et l'unité.

DÉCISION À PRENDRE : K1 de Ventilation, avec ou sans caractéristique « débit » ?
- A. Sans caractéristique (fait) : G8 garde sa bulle.
- B. Avec « débit » : `critereQuiTranche` doit alors proposer aussi un critère dont la caractéristique ne départage pas les façons.

Recommandation : A, réversible.

DEMANDE EXECUTANT : rejeu vision-4, état 22 : coller `NOTE_VRAC_BANC` de `fixture.ts` au lieu de la note « évier / ventilation / évier ».
Puis, sur 23, capturer et ouvrir 390 et 1280 clair. Attendu : « Gaine alu Ø 150 mm, 2 pièces » à acheter en tête, une question,
un à faire.

CONNAISSANCE : `?preview=carnets` ne démarre qu'avec les variables fictives du banc (`VITE_FIREBASE_API_KEY=banc-fictif`, `PROJECT_ID`,
`AUTH_DOMAIN=localhost`, `APP_ID`, `VITE_USE_FIREBASE_EMULATORS=true`), sinon « Impossible de charger la brasserie » (auth/invalid-api-key).

LEÇON PROPOSÉE : avant de donner une caractéristique à un critère de la fixture, chercher qui choisit un critère sans caractéristique
(`critereQuiTranche`, G8) : la donnée « juste » peut éteindre un retenu.
