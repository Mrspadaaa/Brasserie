# Brief v0 — Stocks › Matériel en mini maquettes (14.11)

Dossier de conception commun aux séries r, z et u. Lis-le à la place des sources ; n'ouvre une source que pour vérifier.
Fable est interdit : tout tourne en Opus. M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Ses mots (SPEC-BRASSEUR, 14.11)
« Lance des autres sous session pour les autres écrans important(sauf clients) pour des mini maquettes. » ; « J'ai l'impression
que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Sa capture, en ligne, 390 : `M/brasseur/14-11-stocks-materiel.jpg`
— une carte haute (~80 px) par équipement : nom, « Catégorie · EQ-008 », pastille d'état (Neuf, Bon). Sept lignes au premier
écran, rien d'utile au-delà du nom : pas d'échéance, pas de valeur, pas de dernier entretien. « À traiter · 0 » alors qu'un
pH-mètre s'étalonne et qu'une cuve a un joint à changer.

## Obligatoire

### 1. La baseline : l'app en ligne, plancher à enrichir (règle n° 1, L03, L07)
- Captures de l'actuel : `M/banc/*.png` et `M/banc/INDEX.md` (version en ligne). Analyse : `M/analyse/ANALYSE.md` (problèmes
  numérotés et parcours manquants) : chaque variante en résout la plus grande part et dit lesquels dans sa NOTE.
- Chaque maquette garde, identiques : l'en-tête (logo L'Affinée, lune, loupe, ⋮), la sous-navigation Stocks (Articles · Courses ·
  Fûts · Matériel · Houblons, Matériel actif), la barre du bas (Bord · Finances · Brassins · Stocks avec sa pastille · Clients) et
  le « + » noir. Jetons et polices : `src/theme/themes.css`, `DESIGN.md` (Colors, Typography, Layout § budget vertical et
  dimensions compactes). Deux thèmes : clair et cave.
- Même langue que Stocks › Articles (choisi par lui et en ligne : `M/banc/ref-articles-*.png`) : même famille de ligne, de
  pastille, de rayon pliable, de fiche. Matériel ne doit pas ressembler à un autre produit.
- Acquis à garder (fonction, pas forme) : « Enregistrer un achat » (ouvre la Dépense, intent matériel) ; « Matériel déjà possédé »
  (créer sans dépense) ; « Projets d'équipement » (vers Atelier › Matériel, autre mission : un lien, ne pas le redessiner) ;
  recherche ; filtre « À traiter » ; tri À réparer, puis À entretenir, puis le reste ; fiche : nom, catégorie (Brassage, Mesure,
  Embouteillage, Stockage, Atelier), état (Neuf, Bon, À entretenir, À réparer), entretien, achat (date, prix), notes, supprimer
  avec confirmation journalisée ; la référence automatique d'un matériel né d'un achat (EQ-<uuid>) n'est jamais montrée.
- On s'écarte d'un acquis seulement si l'idée le vaut, un à la fois, la raison écrite dans la NOTE.

### 2. Ce que l'app sait déjà (à montrer sans champ neuf)
- Les dépenses reliées : une ligne de Dépense « Matériel » crée ou relie la fiche (`equipmentRef`), une ligne « Entretien » relie le
  matériel entretenu. Donc l'historique des achats et entretiens payés, avec dates et montants, existe.
- L'immobilisation (Finances) : un matériel peut avoir un actif (`FinancialAsset.equipmentRef`) amorti, dégressif ou linéaire
  (taux), d'où une valeur comptable à date. Pas tous : un petit outil passe en charge.
- Les champs neufs possibles (écrire « champ neuf » dans la NOTE) : dernier entretien fait (date), intervalle (en jours, en
  brassins ou en mois), prochaine échéance calculée, étalonnage des instruments de mesure (pH-mètre : pH 4 et 7 ; densimètre :
  eau à 20 °C = 1,000 ; réfractomètre : eau = 0 °Bx), panne en cours avec depuis quand, utilisé dans N brassins.

### 3. L'honnêteté des données
Ses douze lignes, fictives mais plausibles : EQ-001 Cuve d'ébullition 100L (Brassage, Neuf, 1 450 CHF, mars 2026, joint du robinet
chaque année) ; EQ-002 Cuve fermentation 100L (Brassage, Neuf) ; EQ-003 Pompe de recirculation (Brassage, À réparer : fuit au
raccord) ; EQ-004 Refroidisseur à plaques (Brassage, À entretenir : détartrer après 5 brassins) ; EQ-005 pH-mètre (Mesure, Bon,
étalonner chaque mois) ; EQ-006 Densimètre + éprouvette (Mesure) ; EQ-007 Réfractomètre (Mesure) ; EQ-008 Capsuleuse manuelle
(Embouteillage) ; EQ-009 Balance 0,1 g (Mesure) ; EQ-010 Frigo levures & houblons (Stockage) ; EQ-011 Déshumidificateur (Atelier) ;
EQ-012 Hotte recyclage (Atelier) ; plus « Moulin à malt » né d'un achat (20.10.2026, 289 CHF). Montants d'entretien « Démo ».
- L'inconnu n'est jamais 0 : « prix inconnu », « jamais étalonné », en badge court, pas en phrase répétée. Aucun total inventé :
  un total ne somme que les prix connus et le dit (« sur 4 prix connus »). Une valeur comptable n'existe que pour un matériel
  immobilisé ; sinon rien (pas « 0 CHF »).
- Date du jour : 14.11.2026. Toute échéance se calcule depuis là et se vérifie.
- Chaque zone d'une figure dit ce qu'elle représente (D259 : « et la partie maron ? »).

### 4. L'usage au doigt, à 390 px
- Premier écran : 60 mots au plus hors noms des lignes (marqués `data-mots="lignes"`) ; aucune phrase d'aide au repos ; pas de
  cockpit ; chaque puce mène quelque part. Plus de matériel visible au premier écran que les 7 de sa capture, sans perdre la lisibilité.
- Texte ≥ 12 px ; cibles ≥ 44 px pour un geste principal, ≥ 24 px sinon, sans chevauchement ; jamais `type="number"`.
- Les gestes fréquents tiennent d'une main, en un toucher depuis la liste : « fait » (entretien, étalonnage), « en panne », ouvrir.

### 5. Les interdits techniques
- Une variante = `M/v0/<série>/<id>/etat.html`, un seul fichier autonome (CSS et SVG en ligne, aucune ressource distante), états
  par `?etat=` et thème par `&theme=cave`. Classes et globales préfixées par l'id (`rq1-…`, L26), script dans une fonction immédiate.
- **Mini maquettes non jouables** : ce sont des images. Aucun geste à coder ; chaque état est dessiné tel quel.
- Captures : `node M/socle/capt.mjs v0/<série> repos,geste <id> [id…]` (390 × 844, DPR 2, tactile ; écrit aussi `repos-cave`).
  Ouvre chaque image (L12) ; corrige ce qui déborde, se chevauche ou se coupe.
- Rien dans `src/`, aucun serveur de l'app, aucun commit, aucune installation, pas de `git stash`. Fichiers par l'outil Write.
  Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`.
- Avant de dessiner : charge les skills `boosters-ux`, `impeccable` et `ui-design-system`. Marque chaque booster `data-booster`.
- `NOTE.md` par variante : idée en une ligne, problèmes de l'analyse résolus (numéros), champs neufs, acquis écartés et pourquoi.

### 6. La question et les états
Question : « Qu'est-ce qui demande mon attention dans mon matériel, et où en est chaque appareil ? »
États v0 (images à 390) : `repos` (la liste, ses douze lignes et le moulin) ; `geste` (la fiche du pH-mètre ouverte, avec son
étalonnage et ses dépenses) ; `repos` en cave. En passe 2 viendront : « À traiter », « Actions », nouveau matériel, entretien noté,
panne signalée, vide, recherche sans résultat, 1280.

## Indicatif : les axes (chaque série en couvre au moins deux)
- Forme de la liste : lignes denses d'une ligne ; rayons pliables par catégorie (comme Articles) ; « d'abord » (dû, en panne) en
  tête puis l'inventaire ; tableau ; grille de tuiles à picto.
- Signal : pastille d'état seule ; échéance (« dans 12 j », « en retard 3 j ») ; jauge d'intervalle (temps écoulé sur l'intervalle) ;
  frise des échéances des 30 prochains jours.
- Argent : rien en liste ; valeur totale du parc (prix connus) ; valeur comptable par appareil ; dépenses d'entretien de l'année.
- Fiche : sections repliées ; frise d'historique (achat, entretiens, pannes) ; étalonnage en geste dédié (valeur lue contre
  attendue) ; dépenses reliées ; amortissement.
- Actions : « Actions du matériel » replié ; boutons visibles ; geste sur la ligne (glisser, bouton « fait ») ; « + » contextuel.
- Mesure : instruments à part (étalonnage) ou mêlés.

## Séries et chaleurs
- r (langue de l'app en ligne, enrichie) : rq1 froide, rq2 et rq3 tièdes, rq4 chaude.
- z (créative à fond) : zq1 tiède, zq2 à zq4 chaudes.
- u (libre au brief minimal : ne lis que §1 à §6) : uq1 froide, uq2 tiède, uq3 et uq4 chaudes.
Chaude = un genre de solution différent, pas une décoration.
