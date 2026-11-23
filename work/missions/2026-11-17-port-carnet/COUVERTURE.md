COUVERTURE OK 145/145 — D-1 à D-144 (145 lignes avec D-47b) et greffes G1 à G37 : aucun manquant, aucun flou bloquant ; 3 mineurs à suivre.

Relecture du 17.11 (5e passe, après les corrections de la 4e : R48 pour D-40 et D-72, R49 pour D-6, D-45, D-48, D-49, R50 pour D-61 et D-81). Les trois manques et flous de la 4e passe sont vérifiés dans le texte et fermés.
Lus : DEMANDES.md (145 lignes + 7 doutes), ASSEMBLAGE.md (gestes 1 à 15, G1 à G37, DÉCISION À PRENDRE 1 à 5), MISSION.md (§ Retenu R01 à R50, tableau des manques, § Couverture, § Lots A à G, § Voies, § Vérification, § Points ouverts 1 à 20, § Décisions, § Accords), SPEC-BRASSEUR.md (lignes 2020 à 2094 en entier, soit les 20 dernières lignes sur le carnet et au-delà), code du worktree port-carnet (HEAD 40d11da1f).

## Comptes rejoués par script

- Identifiants : DEMANDES 145, MISSION § Couverture 145, aucun écart dans les deux sens.
- Statuts DEMANDES : 104 retenus, 12 refusés, 24 remplacés, 5 idées = 145. MISSION : 91 retenus avec lot + 13 retenus sans lot (6 hors port : D-6, D-44, D-45, D-48, D-49, D-93 ; 7 de méthode : D-82, D-84, D-87, D-88, D-90, D-94, D-95) = 104. Exact.
- Aucun non-retenu porté, sauf les trois refus tenus par un contrôle ou une forme réduite (D-55, D-83, D-92).
- G1 à G37 : chacun cité dans MISSION § Retenu avec sa source d'ASSEMBLAGE (grep sur chaque numéro : 0 absent). Toutes les sources `g4:` / `g5:` des lignes « Greffes » et toutes les bases d'ASSEMBLAGE sont citées dans MISSION (0 absente).
- ASSEMBLAGE « DÉCISION À PRENDRE » 1 à 5 : suivies en § Points ouverts 2 (fil), 3 et 4, 5 et 17, 6.
- Doutes 1 à 7 de DEMANDES : 1 tuiles « quoi ? » = R03 sans rangée ; 2 et 3 comparer, fil = R25, R26, R39, lots E puis F ; 4 L17 prime = point 19 et Accords ; 5 supprimer = R23 ; 6 modifier et supprimer = g4 en référence ; 7 D-66 = Refusé et voie E.

## Vérification des trois corrections de la 4e passe

- **D-40, D-72 (L1) : couverts.** R48 donne un propriétaire (ce port). `enregistrementIdee` existe bien à `src/domain/calendrierAjout.ts:310` et écrit encore `type: 'recipe-idea'` (ligne 315) ; `CalendrierTab.tsx:316` et `:637` portent bien « dans le carnet » et « Elle arrive dans le carnet ». Lot A : `carnetDepuisPhrase`, `iconesIdees`, `CibleOuverture` (critère A15, 3 volets testés). Lot D : `calendrierAjout.ts`, `CalendrierTab.tsx`, `App.tsx`, `tests/unit/calendrierAjout.test.ts` dans Possède (tableau des Voies aussi) ; critère D9 (L1 a, L1 b, icône, Annuler, `grep` vide sur `'recipe-idea'`). Captures 56 et 57, étapes 4 et 5 en ligne. Point ouvert 10 réglé, plus un renvoi.
- **D-6, D-45, D-48, D-49 : couverts par un suivi écrit à produire, contrôlé.** R49 + V-suivi : ligne `CARNET-SUIVI-Dn` par demande dans BUGS.md, avec ses mots, son lien, l'élément de code manquant, le port ; contrôle `grep -cE "CARNET-SUIVI-D(6|45|48|49)[^0-9]"` = 4.
- **D-61, D-81 : couverts.** R50 + V-regards : trois sections titrées (« Besoin du brasseur », « UX/UI expert », « Critique »), chacune notée sur 10, cible 9 ; contrôle `grep -c` = 3 ; § Vérification, § Boucle de retour, étape 5 en ligne.

## MANQUANTS

Aucun.

## FLOUS

Aucun.

## Mineurs (acceptés, à surveiller)

1. **BUGS.md est encore vide pour ce suivi.** `grep -c "CARNET-SUIVI\|Demandes retenues, port à ouvrir" work/missions/BUGS.md` rend 0 ; V-idées (D-31, D-32, D-125) et V-suivi (D-6, D-45, D-48, D-49) sont des gestes du pilote, avec contrôle, « avant la clôture ». Honnête et vérifiable, mais à faire : un D-n retenu dont le suivi n'est qu'écrit dans MISSION n'est pas encore suivi. Prévoir ces deux versements avant le lot G, pas seulement avant la clôture.
2. **D-142 n'est portée en entier que par F** (fil visible, comparer deux idées). Ce n'est pas un manque : R25 (messages cités sur place) et R26 (tableau au 2e article) sont portés dès A à D, le lot E dessine le reste, et la condition de clôture est écrite (§ Lots F, § Vérification « Clôture »). Risque à garder en tête : le carnet mis en ligne au lot G est un carnet structuré aux messages cités, pas encore un fil visible ; à dire au brasseur à la présentation de la page E.
3. **Fonctions non classées éteintes en ligne** (G11, G25 à G27, G29, G33 : `VITE_CARNET_AIDES` absent, R43, point 17). Choix du pilote, réversible, écrit ; D-122 (« pas assez d'aide de l'ai ») est donc servie en ligne par G8, G9, G30, G32, G35 à G37 et le rangement IA seulement, jusqu'à la page E section 4. Rien d'oublié.

## Non portés avec raison valable

- Refusés : D-4, D-9, D-12, D-14, D-51, D-55 (contrôle d'absence), D-70, D-83 (petit micro seul, R37), D-92 (contrôle d'absence), D-108, D-114, D-117.
- Remplacés : les 24 pointent chacun vers un D-n qui existe.
- Idées à dessiner : D-31, D-32, D-125 (suivi V-idées), D-34 (port du calendrier), D-66 (voie E, section 4).
- Retenus hors port, avec module nommé : D-44 et D-93 (port du calendrier, E36 et E40) ; D-6, D-45 (L11), D-48 (L15, L16), D-49 (L9, L19) : suivi R49.
- Méthode, sans objet dans l'app : D-82, D-84, D-87, D-88, D-90, D-94, D-95.

## SPEC-BRASSEUR.md : rien d'oublié dans DEMANDES.md

Les lignes 2020 à 2094 (17.11) se retrouvent toutes : déploiement du calendrier (hors carnet), « Sol local » = D-123, deux autres notes = D-124 à D-126, « brouillon et achats » = D-127, « le focus » = D-128, « juste un champs text » = D-129, classement de greffe 5 = D-130 à D-140, « tell » = D-141, « un chat » = D-142, « en ligne puis testé » = D-143, « tout mettre en ligne » = D-144. Aucune parole sur le carnet n'est absente de l'inventaire.

## Couvert, élément et lot nommés (échantillon vérifié à la lettre)

D-13, D-21, D-23, D-52 (`comparer.ts`, A9, captures 19, 27, 52) ; D-28 (R31, A11, C6, captures 18, 26) ; D-35 (B7, C) ; D-36 (`&taches=1`, D8, capture 54) ; D-46 (`liensDe`, A14, C6, capture 55) ; D-47 et D-47b (A3 sur `sortie`, C6, D7, captures 36, 38, 49, 50) ; D-54 (C4, capture 39) ; D-119 (R46, B7, C6, capture 34) ; D-133 (R44, A13, C6, capture 10) ; D-134 (R45, A13, C6, capture 11) ; D-142 (R25, R26, E puis F, clôture) ; D-143 et D-144 (lot G, G1 à G6, R42, R43).

LEÇON PROPOSÉE : aucune
