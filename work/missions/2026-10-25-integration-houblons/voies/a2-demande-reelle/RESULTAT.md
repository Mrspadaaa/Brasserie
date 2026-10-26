OK — demande lue de sa visée, sinon dégustation, sinon style (« attendu en 21C ») ; trait « ta bière » au-dessus

## Ce qui est fait (par point)
| Point | Fait | Preuve |
|---|---|---|
| Module `comparer/demande.ts` : visée, sinon dégustation, sinon familles attendues du style (« attendu en <code> », sans flèche) | oui | 6 tests unitaires |
| Comparer : « Ta bière », flèches, couleurs d'écart, critère par défaut et menu, légende, Défi, Égaler, Enchaîner (2 familles), Frise (famille suivie) | oui, `VISEE` et `TROP` supprimés | test jsdom 21C + captures |
| Ma bière : puce « + floral » | seulement avec visée ou dégustation (`+ baies ›` avec visée) | test + capture |
| Dryhopper : bandeau, courbes, « Face à ta bière », ★, « contre ★ », 12 barres (ordre du style), mesure préférée | suit la demande | test + captures |
| Levure : grille de 3 familles | suit la demande | test + capture |
| Entrée « Ouvrir l'analyse de ma bière » (7) | cachée en production dans l'app ; gardée dans la maquette et en développement | test (DEV faux : absente ; DEV vrai : présente) |
| Trait « ta bière » (Comparer en Absolu, Suggérer) | `commun/RadarBase.tsx` : dessiné après les séries, 2,4 px, sommets en anneaux | `tests/integration/controle-trait-ta-biere.mjs`, rouge puis vert (ci-dessous) |

Où vivait l'entrée d'analyse, pour la rebrancher : `src/ui/hopIndex/maBiere/index.tsx` (variante B de D121, bouton « Ouvrir l'analyse de ma bière », et le toucher sur tout le profil, variantes A et C) → `aller({ ecran: 'biere' })` → `maBiere/EtapeHoublons.tsx` `coucheDe('biere')` → couche `hopBeer` → `CoucheProvisoire` de `HopToolLayer.tsx`. Pour la rebrancher : ajouter le cas `hopBeer` dans `HopToolLayer.tsx` (écran d'analyse chargé à la demande), puis mettre `analyse` à `true` dans `maBiere/index.tsx` (constante `analyse`, juste sous `useDemande`). Un commentaire le dit aux deux endroits.

## Fichiers écrits
`src/ui/hopIndex/comparer/{demande.ts (neuf), calcul.ts, cas.ts, index.tsx, Feuilles.tsx, Radar.tsx, comparer.css}` ; `dryhopper/{index.tsx, frise.ts, mesures.ts, hote.tsx}` ; `levure/index.tsx` ; `maBiere/index.tsx` ; `HopToolLayer.tsx` (commentaire) ; `commun/RadarBase.tsx` ; `tests/unit/hopIndexV4/demandeReelle.test.tsx` ; `tests/integration/controle-trait-ta-biere.mjs` ; dans la voie : `capturer.mjs`, `img/`. Build de la maquette (hors git) : `prototypes/houblons-v4/maquettes/parcours-a2/` et `parcours-a2head/`.

## Critères
- **Test rouge sur HEAD, vert après.** Sur HEAD (mes 13 fichiers remis à HEAD, `demande.ts` seul gardé) : `demandeReelle.test.tsx` 8 échecs sur 15 (Comparer, Dryhopper, Levure, Ma bière sans visée ; les quatre avec visée). Après : 15 sur 15. Le test : recette 21C sans visée ni dégustation, aucun écran ne dit « ta demande » ni « ta dégustation » ni ne montre floral/résineux/baies comme demande ; il montre les familles du style ; avec visée (baies), il montre la visée.
- **Contrôle au pixel du trait.** Sur HEAD : `TRAIT ECHEC` (Comparer : 11 sommets sur 11 sans anneau ; Suggérer : 5 côtés sur 11 recouverts à 0 %, 11 sommets sans anneau). Après : `TRAIT OK` (côtés 100 %, anneaux 100 %, trait 2,4 px). Captures : `img/comparer-absolu-avant.png`, `-apres.png`, `suggerer-avant.png`, `-apres.png` (ouvertes).
- **vitest** `tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 56 fichiers, 468 tests verts. Aucun échec dû à d4 ou e2 à ce moment (`comparerComplements.test.ts:66` est vert maintenant).
- **`npm run build`** vert. **`node scripts/audit_inputs.mjs`** : PASSED. B5 : 157,6 ko (budget 160, tenu). B1 920 ko et B2 773 ko dépassés depuis avant ma voie (a1 l'avait noté).
- **Recherche des constantes S1.** `VISEE` et `TROP` n'existent plus. Restent, maquette seulement : `TERMES_S1` (`comparer/hote.tsx`, `dryhopper/hote.tsx`, repli quand l'hôte ne passe pas de `termes` : l'app les passe toujours), `DEMANDE_S1` (`parcours/donnees.ts` et `parcours/visee.ts`, pas dans ma voie : défaut de la maquette, vide dès que l'app configure ses données), `DEMANDE_Q2B` (`suggerer/voies.ts`, lue seulement si la demande est celle de la maquette). Aucun n'est lu dans l'app avec ses données configurées.
- **Captures 390 × 844 dans l'app** (`?dev-local&etape=houblons`, `VITE_HOP_V4=on`, recette 21C ; `img/*.png` et `img/bilan-captures.json`), ouvertes et regardées : sans visée, Comparer dit « Ta bière : attendu en 21C : agrumes, tropicaux, noyau, pépins, baies, melon » (pictos en rangée, pas de flèche), critère « agrumes » ; Dryhopper « Face à ta bière » agrumes, bandeau agrumes · tropicaux · noyau ; Levure agrumes · tropicaux · noyau ; Ma bière sans puce. Avec visée baies : « plus de baies (ta demande) » avec flèche ↑ sur baies, critère « baies », Dryhopper et Levure commencent par baies, Ma bière « + baies › ».
- **Maquette reconstruite** (`construire.mjs`, 9 pages) : `controle-radar-base.mjs` RADAR-BASE OK (9 vues). `controle-etats.mjs` : ETATS ECHEC (29/139), la liste est IDENTIQUE à celle de la maquette construite depuis HEAD (29/139, même méthode, mêmes données). Ces 29 échecs ne viennent pas de ma voie : 15 sont des états de Substituer (données d4 et moteur e2 changés, mots comme « Magnat et Yeoman, 99 sans inconnue »), les autres sont des mots de données (« Motueka + Citra cryo ») et de Dryhopper (« actif · 2 j », 98 mots au premier écran pour 96) déjà rouges sur HEAD. Mon premier essai avait un échec de plus (`etat-dryh-legende`, mots de la légende de la maquette) : corrigé en gardant, pour l'hôte de la maquette (sans `termes`), ses trois familles et ses mots (floral, baies, résineux ; « ta demande du 18.10 »), comme sa maquette choisie.

## Essais utilisés
Trois fois la boucle sur le test (visée sans fusion S1, dégustation synthétique, mots de la dégustation), deux sur la capture (fermeture qui quittait le wizard, profil hors cadre), un sur `controle-etats` (légende de la maquette).

## Doutes et limites
- **Lecture d'une dégustation en demande** (à lui dire) : famille perçue au-dessus de la bande du style = « moins » ; famille attendue perçue sous la bande = « plus ». Ce n'est pas une phrase de lui. En 21C les attendues vont de 0 à 100 : aucun « plus » ne vient d'une dégustation. Cette lecture est testée sur un style fictif (bande attendue 40–80), pas sur une dégustation réelle ni dans Chrome (le banc local n'a pas de dégustation).
- **Dégustation non jouée dans Chrome** : sans dégustation dans le banc, « ta dégustation » n'est vu qu'en jsdom (module) ; la maquette (S1) le montre avec ses mots d'avant.
- **Le trait « ta bière » à 11 anneaux** est lourd sur Comparer en Absolu (capture `comparer-absolu-apres.png`) ; il suit le contour de Galaxy de a1 (anneau creux r 5,6). Si c'est trop chargé, réduire l'anneau ou ne le tracer qu'aux sommets recouverts : choix de dessin pour lui, sur la capture.
- Le style 21C compte 6 familles attendues : la ligne « Ta bière » en montre les 4 premières (place), la légende et l'aria-label disent les 6.
- `data-role="floral-moment"` de Dryhopper devient `principale-moment` (aucun contrôle source ne le lit).
- Hors voie, non touché : « Enchaîner » garde Citra/Galaxy/Idaho 7 imposés (n° 5 de a1) ; « Nugget » dans la grille Levure vient du premier ajout de la recette (donnée réelle).
- Dryhopper, Levure et Comparer dans l'app sans visée : la demande « du style » ne change pas le classement ★ (somme des familles attendues connues) ; une famille inconnue ne compte pas (jamais 0).

DÉCISION À PRENDRE : la lecture d'une dégustation en demande (au-dessus de la bande = « moins », attendue sous la bande = « plus ») doit-elle rester, ou seule la visée remplace le style ? Options : (a) garder (ma lecture) ; (b) ne lire que la visée, la dégustation ne servant qu'aux points pleins de Ma bière. Recommandation : (a) tant qu'aucun écran ne pose la visée dans l'app (aucun appel de `poserVisee` hors tests), sinon (b) est plus simple. À router : pilote.

CONNAISSANCE : en 21C (Hazy IPA), les attendues sont agrumes, tropicaux, noyau, pépins, baies, melon (bande 0–100), herbacé et végétal indésirables (0–5) ; floral, résineux, épicé, terreux neutres (0–30). Aucune visée n'est posée nulle part dans l'app aujourd'hui (seulement par tests) : les écrans disent donc le style tant que l'écran d'analyse n'existe pas.
LEÇON PROPOSÉE : une maquette partagée avec l'app garde son dessin par un discriminant d'hôte déjà existant (`termes` absent, `allerWizard` absent), pas par une constante de test : mes premiers essais ont modifié la légende de la maquette choisie, vu seulement par `controle-etats` ; le rejouer sur HEAD avant et après, état par état.
