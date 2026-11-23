ECHEC — E1 : controle-choix.mjs rouge, registre ecrans.json fautif hors voie et sans écran carnet

Le livrable est prêt et montrable. E2 à E5 tiennent. Seul E1 est rouge, pour une cause extérieure à la voie (détail plus bas).

## Adresse de la page (E5)

`work/missions/2026-11-17-port-carnet/voies/E/choix-carnet-2026-11-17.html`, depuis la racine du worktree Brasserie.
Chemin absolu : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/voies/E/choix-carnet-2026-11-17.html`.
La page est autonome : ses références sont copiées dans `ref/` et ses planches dans `cap/`.

Où j'ai écrit : dans le worktree **Brasserie**, là où vivent MISSION.md et les maquettes de référence. Le worktree port-carnet
n'a pas `work/missions/2026-11-17-*`, et E1 se lance « depuis la racine Brasserie ». Je n'ai rien écrit dans port-carnet. Si le
pilote veut la voie dans port-carnet, il suffit de copier le dossier `voies/E/` tel quel.

## Fichiers écrits (tous dans voies/E/)

- `planches.html` : 21 écrans statiques à 390 px, avec l'habit des maquettes retenues (classes `e5-`, jetons de l'app).
- `choix-carnet-2026-11-17.html` : la page de choix, avec 4 sections, la référence à côté de chaque variante, et ce qu'on attend de lui, sans code.
- `outils.mjs` : copie des références, captures des planches, contrôle E3 avec témoins, captures de la page.
- `cap/*.webp` : 21 planches, plus 4 vues de la page à 1280 et une à 390. `ref/*.webp` : 12 références copiées.
- `RESULTAT.md`.

## Variantes, et ce qui passe derrière dans chacune (E5)

Il y a 17 variantes au total, plus les références. Voir « Doutes » sur le plafond de 16.

**1. Le fil** (référence : p2:i06-4 ; sources : g4:base-E06, g5:v07-9, p2:g05-1). Chacune garde le champ en bas et les citations
R25 : phrase citée, lien en clair, « › Texte d'origine » dans E.
- A `f1` · fil sous les rubriques (le figé intact, puis « Vos messages ») : rien ne passe derrière ; il faut descendre pour relire.
- B `f2` · fil seul, rubriques repliées en une rangée de puces (Ce qui compte, Façons, Articles, Comparer) : façons et tableau à un toucher.
- C `f3` · « Dernier dépôt » au-dessus du champ, figé intact dessous, « Tout le fil · 5 » : les messages anciens passent derrière.
- D `f4` · bandeau de v07 prolongé : 3 derniers messages → rubrique sous le titre, rubriques en une ligne : le détail des rubriques passe derrière.
- E `f5` · fil global de tous les carnets, en feuille sur la liste figée, avec la destination de chaque message : la liste passe sous la feuille.
- Défaut sans réponse : aucune variante, donc les citations sur place (R25).

**2. Comparer des idées** (référence : p2:g01-8)
- A · lecture étroite : le Comparer figé, l'image même. Il ne compare pas deux idées.
- B `c2` · deux idées pour le même besoin (Frigo de garde, Chambre froide en kit, exemple), sur leurs critères communs ;
  une valeur inconnue s'affiche « non lu », jamais 0 : les critères propres à une seule idée passent derrière.
- C `c3` · toutes les idées par prix (prix du choisi, sinon fourchette ; « pas encore d'article » sans chiffre) : les critères passent derrière.
- D `c4` · toutes les idées par avancement (Idée, À comparer, Choisi, À venir, avec « Ensuite ») : les prix passent derrière.
- Défaut : A.

**3. Le parc dans Stocks › Matériel** (référence : p2:g05-1)
- A `p1` · « Parc » en tête du segment, avec le parc za3 schématisé : un segment de plus, rien derrière. C'est le défaut (§ Points ouverts 1).
- B `p2` · le parc sous Réalisés : il demande un toucher de plus.
- C `p3` · une ligne de tête « Parc 12 appareils · 2 à traiter › » au-dessus du segment figé : la liste du parc est à un toucher.

**4. Les aides de l'IA et D-66.** Une paire « sans » (référence) / « avec » par écran. Les numéros sont ceux de la page.
- ①② `a1` · feuille ··· de la note : G25 « Ressemble à un critère · Passer en Ce qui compte », Passer (g5:v08-19) ; G33 « ✻ doublon ? » sur la note (g5:v05-25).
- ③④ `a2` · cadre « Va atterrir ici, dans Notes » : G11 « Même chose que la note du 16 nov. : elles seront fusionnées · Garder
  à part » (g5:v08-8) ; G27 « Même visite : la douchette · Regrouper » (g5:v03-18).
- ⑤ `a3` · après modification : G26 « l'évier Inox Riviera (60 cm) ne passerait plus · Passer en Ce qui compte » (g5:v08-21),
  avec un **picto local** (balance) et non le ✻ (Q19, C6 de la mission).
- ⑥ `a4` · renommer : G29, champ prérempli « Évier inox 2 bacs », « ✻ proposé d'après « 2 bacs pour laver les fûts » », « avant :
  « Évier inox » », Entrée renomme (g5:v05-23).
- D-66 : lecture 1 `d66-sans` (aucun bloc, défaut, référence) ; lecture 2 `d66` (« ✻ Façons possibles · 1 proposée · Voir › »,
  replié, jamais ouvert d'office ; la façon proposée est à un toucher).
- Ce qu'il allume passe dans `VITE_CARNET_AIDES`. Correspondance : ① noteEnCritere, ② et ③ doublon, ④ regrouper, ⑤ consequence, ⑥ renommerPropose.

## Critères, sortie décisive

- **E1** `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre` → `REGISTRE ECHEC` :
  `destinations-menu-plus`, `menu-entete` (mots absents de SPEC), `barre-plus` et `recherche` n'ont « ni inventaire ni contrôle ».
  Le registre a été commis tel quel le 15.11 (abe104ef6), hors de ma voie.
  `controle-choix.mjs voies/E --ecran=carnet` → `CHOIX ECHEC (0 écran(s) conforme(s) …)`. La seule cause est ce registre.
  Le registre n'a **aucune entrée carnet** (`grep -ci carnet ecrans.json` = 0) : même vert, E1 ne vérifierait rien sur ces planches.
  À la place, j'ai mécanisé le contrôle réel (E3, ci-dessous). Un essai.
- **E2** `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs <page> --min=3` → `PAGE-CHOIX OK (4 choix)` :
  fil 5 variantes et comparer 4 (4 à 5 par rangée à 1280, 2 à 390) ; parc 3 ; aides 5. `--min=3`, parce que le défaut de 11 vise
  une exploration et non ce lot fixé par la mission. Deux essais.
- **E3** `node work/missions/2026-11-17-port-carnet/voies/E/outils.mjs` → `témoins : 6/6 refusés, 0 faux refus` puis
  `PLANCHES OK 21/21`. Sur chaque planche, il vérifie :
  - l'en-tête L'Affinée, l'onglet Stocks actif et le champ à 66 px du bas ;
  - les signatures refusées de maquettes.json (K1 à K4, CR-AVENIR-CAL), ainsi que « quoi ? » et « Étape » ;
  - qu'aucun texte n'est sous 14 px, et que la couleur de l'app est présente (C6).
  Les témoins prouvent que le contrôle refuse « Ajouter à Ventilation : quoi ? », « Étape 2 / 4 », « ✓ choix », « ↓ 600 CHF », etc.
- **E4** : captures prises à 390 (×2) par Chrome. J'en ai **ouvert** 7 :
  - les 4 sections de la page à 1280 (`cap/page-*-1280.webp`), où chaque planche est côte à côte avec sa référence ;
  - `f2`, `f3` et `c4` en plein format.
  Ma revue a trouvé et corrigé 6 défauts :
  1. lien coupé « -10 / 0 » ;
  2. vide sous F3 ;
  3. en-tête « Com-parer » ;
  4. surlignage « meilleur » posé sur 230 V sans sens connu ;
  5. « 5 jours » inventé dans C4 ;
  6. prix en chasse fixe dans une bulle.
  Il reste 14 planches à ouvrir en plein format : voir DEMANDE EXECUTANT.
- **E5** : cette section.
- Vitest : sans objet. Le lot E n'écrit aucun code de l'app. `outils.mjs` et ses témoins tiennent le rôle de test. Aucun serveur
  n'a été lancé (fichiers statiques), aucun Gemini, rien dans port-carnet.

## Doutes et limites

- **17 variantes, pour un plafond de 16.** Le brief compte déjà 12 variantes pour 5 + 4 + 3. J'ai donc groupé les aides par écran
  (4 paires au lieu de 6, ①② et ③④ partagent un écran) et placé D-66 dans la même section. Comparer A est l'image figée même : il n'y a
  rien de neuf à dessiner. Défaire un groupement ferait 19.
- **A1** : la feuille laisse voir le champ, grisé sous le voile. La source v08-19 ne le dessine pas sous la feuille ; il est gardé
  pour l'habit (E3).
- **Clavier non dessiné** sur A2 et A4 (états « pendant ») : le champ est montré actif, à sa place au repos.
- **Données d'exemple** : la « Chambre froide en kit » (C2) et le parc za3 schématisé (P1, P2) sont marqués « exemple ». Le parc
  n'est pas une capture de l'app réelle.
- **Thème clair seulement** (D-81 : « pas thème cave encore ») ; le mode sombre viendra au lot F.
- **Les 40 mots au repos** (CARNET-LIS) ne sont pas mesurés : un fil est fait de ses messages.

DÉCISION À PRENDRE : E1 ne peut pas passer au vert depuis cette voie. Options :
(a) le pilote répare `ecrans.json` (4 écrans transversaux sans inventaire ni contrôle, mots de menu-entete absents de SPEC) et y
ajoute les écrans carnet figés, avec `controle-planches` en contrôle ;
(b) accepter E3 (`outils.mjs`, avec témoins) comme preuve de la règle n° 1 pour ces mini maquettes ;
(c) les deux. Ma recommandation : (c). D'abord (b), pour montrer la page sans attendre. Ensuite (a), car tout `controle-choix.mjs`
est rouge pour toutes les voies tant que le registre l'est.

DEMANDE EXECUTANT :
1. Depuis la racine Brasserie : `node work/missions/2026-11-17-port-carnet/voies/E/outils.mjs` → attendre `témoins : 6/6
   refusés, 0 faux refus` et `PLANCHES OK 21/21`.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-11-17-port-carnet/voies/E/choix-carnet-2026-11-17.html --min=3`
   → attendre `PAGE-CHOIX OK (4 choix)`.
3. Ouvrir en plein format, une par une, chacune à côté de sa référence de `ref/` :
   - `f1` (avec i06-4), `f4` (avec v07-9), `f5` (avec g05-1) ;
   - `c2`, `c3` (avec g01-8) ; `p1`, `p2`, `p3` (avec g05-1) ;
   - `a1` (avec a1-sans et v08-19), `a2` (avec a2-sans, v08-8 et v03-18), `a3` (avec a3-sans et v08-21), `a4` (avec a4-sans et v05-23) ;
   - `d66` (avec d66-sans) ; enfin `cap/page-390.webp` (la page entière à 390).
   Pour chacune, répondre à « combien et quels problèmes ? » : texte coupé, chevauchement, élément de l'habit absent, signature
   refusée, valeur à 0.
4. Rendre la liste numérotée ; je juge et corrige.

CONNAISSANCE : `work/refonte-frontend/v4/choix/ecrans.json` est en faute depuis le 15.11 (abe104ef6) : `controle-choix.mjs
--registre` rend REGISTRE ECHEC sur 4 écrans transversaux. Dans port-carnet, il échoue aussi, sur des captures absentes. Il n'a
aucun écran carnet : E1 de toute voie carnet est vide de sens tant qu'ils n'y sont pas inscrits.

LEÇON PROPOSÉE : un critère de voie qui s'appuie sur un contrôle partagé (ici `controle-choix.mjs`) doit être rejoué par le pilote
avant le brief. S'il est déjà rouge, ou vide pour l'écran visé, le brief nomme le contrôle de remplacement. Sinon la voie rend un
ECHEC qui ne dit rien de son travail.
