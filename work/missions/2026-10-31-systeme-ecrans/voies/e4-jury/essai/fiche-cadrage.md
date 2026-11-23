# Cadrage de l'étape « Identité 1/7 » — fiche du jury (31.10, niveau rapide)

Méthode : `.claude/skills/jury/SKILL.md`. Dossier, avis bruts et coût :
`work/missions/2026-10-31-systeme-ecrans/voies/e4-jury/essai/` (`dossier.md`, `avis-jury.md`). Détail de chaque bloc
de l'écran : `inventaire-identite.md` (voie e2). Cette fiche est l'entrée du lot de mini maquettes. Ses paroles restent
dans SPEC-BRASSEUR ; ici, seulement leur ligne et quelques mots.

## Hypothèse
- **Avant le jury** (pilote, 60 %) : il pose nom, style, volume, ébullition, NOLO et matériel, et vérifie que son
  installation tient ; le reste se replie.
- **Après** (75 %) : téléphone en main, il pose ce qui fixe la recette :
  - coller une recette, ou partir d'un style ;
  - le volume ;
  - la durée d'ébullition, et NOLO ou non.
  Il voit d'un coup d'œil si ça tient dans son fermenteur, et où il se situe dans le style. Le reste se replie. En-tête,
  fil d'étapes, bandeau, pied et lanceur + sont communs aux 7 étapes : ils ne se décident pas depuis cet écran.

## Tranché
| n° | Question | Réponse | Source |
|---|---|---|---|
| J1 | Scène | Téléphone, une main, attention hachée. La lecture « bureau » du pilote n'avait pas de source ; les deux regards la corrigent. | `PRODUCT.md` l. 25–30 (« Téléphone, une main » ; « Assistant de recette » en Cuverie) |
| J2 | Le geste | « Quelle bière, combien, comment » : coller une recette ou choisir un style ; le volume ; l'ébullition et NOLO, qui fixent aussi la recette. Le nom peut venir après. | `src/pages/BrewWizard.tsx` l. 2337–2341 (« Le chemin le plus rapide vers une recette complète : la coller ») ; `cerveau/produit/import-recette.md` |
| J3 | Pourquoi maintenant | L'écran est un formulaire très textuel. « Comme houblons » veut dire dans la langue de l'étape Houblons (pastilles, couleurs, contrôles), pas seulement par sa méthode. | SPEC-BRASSEUR l. 822 et 823 (« Oublie pas de bien mettre en avant les UX UI booster ! », 31.10) ; C094 « très textuel » ; C091 |
| J4 | Réussite, mesurable | À 390 px, clavier fermé, le premier écran montre nom, style, volume, ébullition, NOLO et l'état du fermenteur. Pas plus de 80 mots, aucune phrase explicative au repos, chaque chiffre écrit une fois. Mêmes mesures sur une recette neuve et avec le clavier ouvert sur le nom. | SPEC § 0 (« 80 mots au plus ») ; C081, C084 ; `cerveau/produit/saisie-mobile.md` (densité pilotée par le clavier) |
| J5 | Acquis à garder | L'en-tête actuel de l'assistant : ‹, « Identité 1/7 », Abandonner, import, thème. Le vrai fil des 7 étapes, le bandeau commun et l'icône d'import dans l'en-tête. Le hors ligne et la saisie sans `type="number"`. L'alerte « fermenteur plein » là où se saisit le volume. L'activation de NOLO, dont c'est le seul point d'entrée. **Pas** l'en-tête de `consolide-390.png`, refusé. | SPEC l. 412 (« le vrai Stepper »), l. 556 (« à côté de l'import »), l. 557 (« seul houblons a une variation.... Changé ça »), l. 571 (« Text header inutile ») ; D116, D129 ; `BrewWizard.tsx` l. 2390 (`allowEnable`, seule occurrence) |
| J6 | Déjà refusé | Le cockpit, le texte et la légende au premier plan, l'en-tête qui change (D119), le badge « 16D hypothèse » (D116), le bouton imposant (C089), la superposition (D164). L'écran actuel en rejoue plusieurs. | `work/refonte-frontend/v4/DEFAUTS-COURT.md` D2, D119, D129 ; SPEC l. 557 (« Pas super la superposition ici, à corriger ») |
| J7 | Contrainte, valeur qui gagne | Ne rien inventer. L'évaporation de repli (10 % du volume par heure, non dite) et le « Repère provisoire : 20 % » se montrent comme des estimations, jamais comme des mesures. La densité utile gagne sur l'explication. Aucun calcul ne change. | PRODUCT.md (« refuse d'inventer un chiffre plausible » ; « Une modification d'écran ne doit jamais forcer une modification de calcul ») ; `BrewWizard.tsx` l. 1790 ; inventaire § 11 |
| J8 | Les mots | « Objectif NOLO » n'est pas attesté comme son mot : il a dit « NOLO compris ». « Choix pour ce brassin », « Repère provisoire » et « Matériel du plan » ne viennent pas de lui. Les libellés sont libres dans les variantes. | `cerveau/metier/chimie-eau.md` l. 39 ; `cerveau/brasseur/glossaire.md` (aucune entrée) |
| J9 | Le code contre le récit | (1) L'import est en double dans le corps : l'icône de l'en-tête est celle qu'il a acceptée, le bouton du corps fait la même chose. (2) L'espace libre conseillé vient de la levure, choisie à l'étape 4. (3) Le + recouvre le coin de la carte « Choix pour ce brassin », pas une valeur. (4) « Remplissage conseillé 24 L » est un conseil (30 × 0,8), égal au volume par hasard. (5) « Adapter… » recalcule ingrédients et eau sans confirmation. | `BrewWizard.tsx` l. 2140–2147 et 2342–2350 ; SPEC l. 556 ; `src/ui/RecipeInstallationChoice.tsx` l. 25–26 ; inventaire § 14 et § 16 ; sa capture |
| J10 | Premier plan | Au premier plan : nom, style, volume, ébullition, NOLO, et l'état du fermenteur, avec son alerte. Repliés : le réglage fin de l'espace libre, le rinçage à chaud, le détail du matériel. Les repères du style : un goût (axe A3). | `RecipeInstallationChoice.tsx` l. 27 ; PRODUCT.md l. 51 (« Ni une alerte utile ni une information nécessaire à la décision ne disparaît ») ; PORTRAIT § 1.4 |
| J11 | Scénarios limites | Les variantes doivent tenir dans tous ces cas : <br>• recette neuve (bandeau vide) ; <br>• recette collée ; <br>• style hors liste, créé, ou à plusieurs référentiels ; <br>• fermenteur ou cuve inconnus (« Volume à renseigner ») ; <br>• volume égal ou supérieur au fermenteur ; <br>• rinçage au-delà de l'habituel ; <br>• NOLO coché, décoché, recoché ; <br>• matériel non figé ; <br>• brouillon en lecture seule ; <br>• hors ligne ; <br>• clavier ouvert. | `RecipeInstallationChoice.tsx` l. 22 et 27 ; `BrewWizard.tsx` l. 2250, 2380 et 2389 ; inventaire |
| J12 | Hors périmètre | Hors périmètre : <br>• les six autres étapes ; <br>• l'atelier NOLO une fois ouvert ; <br>• le moteur et les calculs ; <br>• le schéma des données ; <br>• les éléments communs aux 7 étapes : en-tête, fil, bandeau, pied « Retour · Suivant », lanceur +. <br>Seul le chevauchement du + sur cet écran est dans le périmètre. | D129 (« même en-tête […] même pied ») ; PRODUCT.md |
| J16 | Irréversible | Rien, tant que données et calculs ne changent pas. Deux gestes attendent les accords groupés : le déploiement, et toute écriture sur ses recettes réelles (« neipa v3 »). | CLAUDE.md (« déploiement, push/PR/merge, données réelles ») |

## Hypothèses du pilote (réversibles, à recopier dans chaque VOIE.md du lot)
1. Les éléments communs restent ceux de l'app d'aujourd'hui pendant ce lot. Les variantes les montrent sans les changer
   (lecture étroite, L01). Désaccord : le Brasseur proposait des cibles du style dans le bandeau ; elles restent une
   option de l'axe A3, signalée comme transversale.
2. L'espace libre reste sur Identité, réglage replié et effet au premier plan. Il n'est pas déplacé à Levure, écran
   « ouvert » dans `ecrans.json` et hors périmètre. Désaccord : le Brasseur voulait le réglage à Levure.
3. Une estimation (évaporation de repli, repère provisoire, remplissage conseillé) porte la marque du simulé (« ~ »,
   glossaire) ou le mot « conseil ».
4. La durée d'ébullition reste libre. Des puces (60, 90) ne seraient que des raccourcis (« Rien de figé », SPEC § 0).
5. Une seule main, même quand la recette se crée au bureau.
6. Les suppositions relevées par le jury sont levées ainsi :
   - la recette collée est le cas type, autant que la recette vide ;
   - la levure peut être connue dès l'Identité, quand la recette est collée ;
   - « quatre chiffres » au bandeau n'est pas un acquis, mais un commentaire du code (mesure M2) ;
   - volume, remplissage conseillé et moût d'avant ébullition sont trois données distinctes ;
   - NOLO, replié, garde son activation visible.

## Axes de variantes (ses goûts, L24 ; ce sont les axes des séries v0)
| Axe | Options à montrer, la baseline d'abord | Ses mots |
|---|---|---|
| A1. La forme de l'identité | formulaire compacté (baseline) · carte « bière » dense, comme la carte houblon · phrase-bière éditable sur place | C091 (« plein d'outils UI à dispo autre que les boutons ou champs text ») ; SPEC l. 823 |
| A2. Le fermenteur | ligne actuelle « 24 / 30 L · 6 L libres » · badge · jauge fermenteur (et cuve), le conseil marqué dessus | PRODUCT.md (« 24 L est un repère, pas son plafond ») ; C097 (« plus de couleurs ») |
| A3. Les repères du style | repliés (actuel) · plages en mini-barres sous le style, avec la valeur de la recette · marques sur le bandeau (transversal : à montrer, décidé pour les 7 étapes) | PORTRAIT § 1.4 (« les intervalles, les vraies valeurs, la relation au style ») |
| A4. Volume et ébullition | champs en ligne (actuel) · pas à pas avec jauge · puces de durée plus valeur libre | C092 (« Je vois aussi aucun slider ou autre UX booster ») |
| A5. NOLO | case (actuel) · interrupteur · pastille sur la carte, activation toujours visible | aucun mot sur la forme |
| A6. L'import dans le corps | bouton tel quel · seulement sur une recette vide · retiré, l'icône d'en-tête suffit · grande entrée « coller ou partir d'un style » sur recette neuve | C084 (« pas d'info surplus en doublon ») ; code l. 2337–2341 |

Écarté, car refusé : porter le style par une puce d'en-tête « 16D hypothèse » (option du Brasseur, D116). Le nombre de
concepts reste celui de l'entonnoir (48 v0 au moins en 6 séries, M13) ; six axes ne sont pas six variantes.

## Accords groupés
- Déployer l'écran porté.
- Écrire sur ses recettes réelles ; les essais se font sur fixtures.

## À mesurer
- M1. Le taux d'évaporation du profil : mesuré (`boilOffLPerHour`), ou repli de 10 % ? À lire dans le code et les
  fixtures, et sur l'app en ligne en lecture seule plus tard.
- M2. Le bandeau a-t-il trois chiffres (choix Houblons) ou quatre (app) ? `controle-stepper.mjs` sur la base v4.10 et
  sur l'app. Question transversale.
- M3. La baseline chiffrée de l'écran actuel : mots au premier écran et défilement à 390 px, clavier fermé et ouvert
  (voie e1).

## Au conseil
Aucun pour ce lot. Deux points sont transversaux et se décideront pour les 7 étapes à la fois, dans un lot à part
(avis croisé à son ouverture) :
- « Text header inutile », qui vaut encore pour « Identité 1/7 » ;
- les trois ou quatre chiffres du bandeau.

## Désaccords du jury
- J1 : bureau (pilote) contre cuverie (PRODUCT.md). Tranché par la source.
- J5 et J13 : le Brasseur partait de l'en-tête de `consolide-390.png` et de sa puce. Le Contradicteur rappelle qu'ils
  ont été refusés (D116). Tranché par la source ; c'est le défaut fatal du dossier, évité.
- J10 : le réglage de l'espace libre à Levure (Brasseur) ou sur Identité (Contradicteur). Hypothèse 2.
- J18 : mesure (Brasseur) ou conseil (Contradicteur) pour les éléments communs. Hors périmètre, mesure M2, avis croisé
  plus tard.

## Coût
- 2 appels `conseiller`, en parallèle :
  - Brasseur (fable) : 64 677 jetons, 13 outils, 119 s ;
  - Contradicteur (opus) : 55 934 jetons, 20 outils, 139 s.
- Total : 120 611 jetons de sous-agents, environ 2 min 20 s de bout en bout.
- La préparation du pilote (dossier) n'est pas comptée : `get_usage` n'a pas été relevé.
- Le niveau normal n'a pas été déclenché. J2 est tranché, et il ne reste qu'un désaccord en `PILOTE` (J10), sous le
  seuil de trois (skill, § 3).
