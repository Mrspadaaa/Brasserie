OK — liste en arbre, coup d'œil, saisie rapide, Relecture, À faire, À ranger branchés ; R54 et R51 NON faits.

## Inventaire (maquettes3/v01 `liste`, `saisie`, `epreuve` ; composant ; sort de l'ancien)
| Élément de la maquette | Composant | Ancien |
|---|---|---|
| Coup d'œil 4 cases (je cherche, décidés, notés, résolus <année>), chaque case filtre | `CoupDOeil.tsx`, `coupDOeil` (domaine) | puces Tous / Local / Brasserie : disparaît (PLAN n° 2) |
| Rangée « Arbre · À faire n · cloche n » + loupe | `ArbreCarnets.tsx` (`ListeArbre`) | `RangeeDomaines` (garde la loupe, seule) |
| Domaine › sous-domaine, ordre Brasserie, Local, Meuble, Outils, Papiers | `ListeArbre`, `arbreDe` | groupes par état (À comparer, Idée, Choisi, En veille) : disparaît (n° 2) |
| Ligne de problème : picto, titre, jauge 4 pastilles, état coloré, dernier pas | `LigneProbleme`, `listeRegles.dernierPas` | « dès » et prix à droite : disparaît (n° 3) |
| Sous-domaine replié « ▸ Froid 2 · titres » ; déplié : lignes avec valeur utile | `resumeReplie`, `valeurUtile` | « votre lien : … » sur la ligne : disparaît (n° 5), la barre de lecture reste |
| « Résolus 2026 n » replié, ligne des deux derniers ; un toucher ouvre Relecture | route `relecture` (`RelectureResolus`, voie probleme) | groupe « Faits » : remplacé par les résolus |
| « À ranger » ambre + carte « Rattacher à … ? » d'une photo seule (Oui · Nouveau problème · Laisser) | `CarteARanger` (voie afaire), `rattacherContenu` | — |
| À faire (onglet) : cocher + Annuler, échéance par appui long, plan d'À venir | `AFaire` (voie afaire), `cocherALaListe`, `echeanceALaListe` | — |
| Cloche : carnets avec une veille demandée, « pas encore relevée » | `corpsVeille`, `carnetsAvecVeille` | section « En veille » : remplacée |
| Champ « Une idée, un problème… » + photo + micro ; + volant | `ChampCarnet` (texte du champ changé) | « Une idée, un besoin… » |
| Saisie rapide : feuille « rangé pour toi » (note + photo en bulle, titre, Domaine › …, jeton nouveau problème / rattaché : « citation », état, tâche proposée ; OK · Changer · Rattacher à… ; Annuler ; « Ajouter à … ») | `FeuilleRangement.tsx` | le carnet créé s'ouvrait aussitôt |
| Carnet ouvert recomposé | `CarnetOuvert` (voie probleme) reçoit `messages`, `carnetsDocs`, `rappels`, `onRelecture` | — |
| `?carnet=v0` | `ListeCarnets` (inchangée) rendue par `ecransCarnet` | ancienne liste, joignable |

## Fichiers
Neufs : `src/ui/carnets/{ArbreCarnets,CoupDOeil,FeuilleRangement}.tsx`, `listeRegles.ts` ; `tests/unit/carnetsListeRegles.test.ts` (14). Modifiés : CarnetsVue, ecransCarnet, apercuCarnet, actionsCarnet (`rappelsDe`, `geste`, `cocherALaListe`, `echeanceALaListe`, `rattacherA`, `nouveauProbleme`), carnetsTypes (Vue `relecture`), useNavigationCarnet, Bandeau (bandeau `geste` : « ✓ … · Annuler »), ChampCarnet (invite hors carnet), ListeCarnets (`ListeVide` exportée), carnets-liste.css. Banc : `voies/liste/banc/` (CarnetsVue réel, fixture du suivi, port 3062), `cap/`.

## Branchement tenu
- Route `relecture` (Vue, historique du téléphone, retour ‹, champ du bas « Chercher dans les résolus… », `onRelu` → `repondreRelu` + Annuler).
- Rappels du carnet ouvert : `onEtat`, `onRouvrir`, `onOption`, `onFermerParAchat`, `onRelu`, `onAvantApres`, `onGenre`, `onRetirerEtiquette`, `onCocherTache`, `onEcrire`, `onProposition` (ok / non / plus-tard) : chacun par l'intention du domaine, un Annuler (`enchainer`).
- Carte « Rattacher à … ? » (proposition `deplacer`, C65) : le OK DÉPLACE les lignes de CE message vers `versCarnetId` (`deplacerLesLignesDuMessage`), la carte part, un Annuler ; jamais sans le geste. « Plus tard » : tâche sans échéance + carte retirée, un seul Annuler (la décision 1 de la voie probleme est tenue ici, sans toucher le domaine).
- À ranger : « Oui » déplace le contenu du carnet photo dans le problème proposé (`rattacherContenu`, carnet vide supprimé, un Annuler) ; « Nouveau problème » pose le genre par lui et ouvre ; « Laisser » : rien.
- À faire n'est un onglet de la liste, pas une route (le champ et le rangement ne changent pas de vue) : écart au mot « route afaire ».

## Critères (sorties)
- `npx tsc --noEmit` : 2 erreurs connues (seedData GanttTask, virtual:pwa-register), aucune neuve.
- `carnetsListeRegles` : 14 verts (tests.log).
- Rejeu large (carnets*, c48 à c66, lot3CarnetOuvert, lot11Carnet, virgule-transversale, proprietes, port-q4-carnet) : tests-large.log : 4 rouges (c58Regles R31, classe `cn-carnet-titre` du titre : reprise sur la ligne) ; tests-large2.log : 1838 verts, 0 rouge ; tests-large3.log (état final) : 84 fichiers, 1852 verts, 3 ignorés, 0 rouge. Aucune assertion d'un ancien test modifiée.
- `npm run build` : non rejoué (vite-plugin-pwa absent de ce poste, déjà dit par les voies précédentes).
- Banc `?preview=carnets` : non utilisé (CarnetsPreview n'est pas à moi et n'a pas la fixture du suivi) ; banc propre de la voie, mêmes composants (CarnetsVue réel).

## Vision (captures OUVERTES, 390 clair) : cap/b-liste, b-deplie, b-afaire, b-cloche (non ouverte), b-relecture, b-oeil, c-liste, c-saisie, c-saisieTexte, c-relecture
Comparées à v01-liste, v01-saisie, v01-epreuve, v01-relecture. Défauts vus et corrigés : page élargie à 505 px par la ligne des résolus (contain: inline-size), classe `cnl-resume` en collision avec lecture-lien.css (renommée), ordre des domaines (Brasserie d'abord), picto « étiquette d'article » pour un problème (un outil à la place), « Je cherche » coupé en deux (nowrap), filtre du coup d'œil qui ne comptait pas comme la case (4 cherche, 2 lignes : corrigé, même règle que `coupDOeil`), champ de Relecture qui disait « Une idée… » (corrigé, à revoir en capture). NON ouvertes : 1280 (d-*), sombre, 844×340, la feuille « Changer » et « Rattacher à… » jouées au doigt, hors ligne, `?carnet=v0`, photo seule (carte). À jouer par le pilote en ligne (ZZ TEST).

## Écarts à la maquette (règle n° 1, à juger)
1. La maquette montre l'app entière (en-tête, onglets, barre du bas) ; le banc ne montre que CarnetsVue.
2. « Ajouter à <court>… » de la feuille est un bouton qui ouvre le carnet, champ pris (le message suivant reste dans ce carnet) : un vrai champ y répéterait tout le rangement.
3. Annuler (lien dans la carte) : ajout de moi, exigence « tout s'annule d'un toucher ». Sans IA, la carte dit « rangé ici, sans IA » (pas « pour toi »).
4. « Changer » = Domaine (5 puces) et Genre (problème, mémo, récolte, idée), appliqués aussitôt ; la maquette ne le dessine pas.
5. Photo + texte envoyés ensemble : parcours d'avant (la photo crée son carnet) ; non refait. Photo seule : crée « Photo », ouvre encore le carnet (non refait en « reste dans À ranger »).
6. Le jeton « nouveau carnet · idée » dit le genre que l'IA simulée a posé ; un problème neuf dit « nouveau problème ».

## NON fait (honnête)
- **R54** (Choisir depuis la fiche garde 1 kg → 62,20 jusqu'à À venir) : demande `Choix.prixCentimes` dans modele.ts / operations.choisir / prixChoisi.ts et un `onChoisir(quantité)` de FicheArticle.tsx, tous hors de mon Possède et du budget de contexte restant.
- **R51** (Annuler d'un Retirer reste visible) : le correctif de c66-fix (la feuille se ferme avant d'écrire) tient en jsdom ; non rejoué au navigateur.

DÉCISION À PRENDRE : R54 et R51 : les confier à une voie dédiée (domaine + greffe-p2 : `choisir` accepte quantité et prix, `onChoisir` de la fiche les porte ; R51 : bandeau rejoué en capture). Recommandation : une voie c67 courte, R54 d'abord.
DÉCISION À PRENDRE : « Changer » (domaine, genre) : à valider par le brasseur en mini maquette.

CONNAISSANCE : une classe CSS `cnl-*` existe déjà dans lecture-lien.css (`cnl-resume`, `cnl-segments`) : préfixer chaque voie d'un suffixe propre. Un bouton flex dont l'enfant est en `white-space: nowrap` élargit la fenêtre mobile (505 px) même avec `overflow: hidden` : `contain: inline-size`.
LEÇON PROPOSÉE : aucune
