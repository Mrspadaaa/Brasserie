OK — déployable : plus aucun nom de source hors de la section Sources de la fiche, carte de Lotus allégée sans perte, une seule carte dépliée qui se referme au changement de vue, mots en français, appui long sur les grammes ; contrôle Chrome rejoué (CONTROLE OK, A à G) et 38 tests verts

Critique Fable, 26.10, calibrée sur `fils21-choisir/critique/PORTRAIT.md` (version 2). Sa capture
`voies/brasseur-sources-partout-lotus.jpg` et les 11 captures de `img/` ouvertes une à une. Code lu : `carteOuverte.tsx`,
`appuiRepete.ts`, `legende-bande.tsx` (speciauxDe), `fiche/Replis.tsx` (Huiles), `fiche/SourcesFiche.tsx`.

## Preuves rejouées par le critique
- `npx vitest run` sur `cartesOuvertes`, `appuiRepete`, `traductionMots`, `plagesSources`, `sourcesLignes` : 38/38 verts.
- `controle-sources-une-fois.mjs` (Chrome 390 × 844, fixtures) : **CONTROLE OK**, A à G, « aucune erreur de page » (3e passage).
  Les deux premiers passages se sont arrêtés à l'ouverture de la fiche (« Execution context was destroyed… navigation », puis
  fiche absente) : à 15:02:03–05 et 15:04:05–08, une autre voie écrivait `src/data/hopV4/*.json` et `src/domain/hopIndex/v4/data.ts`
  (c6), et Vite a rechargé la page en plein parcours. Aléa d'environnement, pas un défaut de s2 ; le 3e passage sans écriture
  concurrente est entièrement vert.
- `grep` des 20 noms de sources connus dans `src/ui/hopIndex` : ne restent que `SourcesFiche.tsx` (la section Sources), les
  commentaires, `fiche/sources.ts` (donnée), `complements-ui.ts` (table), et les anciens panneaux hors v4 (`HopTechnicalPanel`,
  `HopKnowledgePanel`).

## 1. Reste-t-il un nom de source au premier plan, hors de la section Sources ?
Non.
- Carte de Lotus (`lotus-carte-apres.png`) : « ◇ vanille · crème · fruité · doux », « huiles 1,5–2,5 mL/100 g » : plus de
  « Beer Maverick, Hopsteiner, Charles Faram », plus de « Hopsteiner 2025 ». Le ◇ et « autres 40 % » sont là.
- Fiche, repli Huiles (`fiche-huiles-apres.png`) : « totale », « myrcène 25–35 % », « thiols classe moyenne » : plus de lien
  « Beer Maverick 2023 ↗ » ni « Hopsteiner 2025 ↗ » sur chaque rangée, et une seule rangée « totale » (les deux fiches disent
  1,5–2,5). Contrôle D : repos, Styles, Huiles, tous sans nom.
- Section Sources (`fiche-sources-apres.png`) : identique à avant, 7 liens, Beer Maverick en tête. C'est le seul endroit, et il
  existait déjà. La sous-section « HOUBLON » (« usage Beer Maverick 2023 ↗ », « propriétaire Beer Maverick 2023 ↗ ») est
  **dans** `ContenuSources`, donc dans ce seul endroit : conforme à sa lecture étroite.
- Substituer (`substituer-apres.png`) : identique à avant à l'écran, les noms n'étaient qu'au survol ; le survol dit maintenant
  « 13–17 · 3 sources d'accord » (contrôle E vert).
- Comparer, Valeurs (`comparer-valeurs-apres.png`) : plus de sigles BM/HS à côté des valeurs, plus de légende des références ;
  « ⚗ mesuré · sources » est un simple libellé de la composition, pas une liste de noms. La rangée OSU garde ses citations
  d'études (H22 Lafontaine 2018, H77 Brülosophy) : ce sont des preuves d'essai, pas des infos de houblon, comme le VOIE.md le
  demandait. Même chose pour les feuilles de Dryhopper (« mesuré … (Maye 2016) »). Question posée au brasseur dans RESULTAT.md ;
  je ne la tranche pas à sa place.

## 2. La carte est-elle allégée sans perdre d'information utile ? Les plages qui diffèrent restent-elles visibles ?
Oui, et oui.
- Côte à côte avec sa capture : même structure (nom, usage, grammes, α 13–17 %, rôle « double », agrumes 3/3, IBU, bande des 12
  familles, mots précis, ◇, linalol / thiols / géraniol, huiles, légende, « ? », « Sans Lotus › »). Seules les mentions de
  sources partent, et la ligne de mots passe de 3 lignes à 2. Ce qu'il voit en premier n'a pas bougé : α, rôle, arômes, dose,
  IBU (L04). Ce qu'on perd : savoir, depuis la carte, laquelle des fiches dit « crème ». C'est exactement ce qu'il a demandé
  (« un endroit qui renvoie la source suffit ») et il est à un appui long (nom → fiche → Sources ›, où chaque mot porte ses fiches
  en `title`).
- « tropical fruits » ne devient pas « fruits tropicaux » : la ligne disparaît, car c'est le nom de la famille, déjà porté par
  l'ananas 2/3 de la bande juste au-dessus. Rien d'utile ne part ; la fiche garde « fruits tropicaux 2/3 ».
- Plages qui diffèrent : Substituer, test « Lotus : la rangée β garde ses deux plages (5–6 et 5,5–6), la rangée α n'a qu'un
  trait » vert ; fiche Huiles, une rangée par plage distincte (`Replis.tsx:88`, filtre sur `pl(x)`) ; Comparer, « α 13–17 % ·
  toutes fiches » garde l'enveloppe. Sa demande sur Lotus et β est tenue.

## 3. Chevauchement, texte trop petit, mot en anglais ?
- Chevauchement : aucun au repos. Sur `fiche-apres.png`, une bulle « Résineux : ses fiches ne le décrivent pas… » recouvre le
  radar : c'est l'infobulle de survol de `RadarFiche.tsx:31`, affichée parce que la souris du script est restée à l'endroit de
  l'appui long. Sur téléphone il n'y a pas de survol ; `fiche-avant.png`, même écran sans survol, n'a rien. Artefact de capture,
  non bloquant ; à signaler à la voie mécanique pour qu'elle écarte la souris avant la capture.
- Texte petit : la ligne « fiches qui la disent · en tête d'une fiche » et la légende « marquée · citée · non décrite · autres
  40 % » sont en petit gris au repos. Elles ne sont pas de cette voie : elles viennent de sa légende choisie v2a (D140, « Je veux
  qqch comme ça moi »). Pas de rejet ; à garder en tête si la carte doit encore maigrir.
- Anglais : plus aucun dans les mots de houblon (contrôle A « orange · citron », test sur les 318 houblons). « whirlpool » et
  « dry hop » sont ses propres termes (SPEC § 1) ; OG, IBU, EBC, 4MMP sont des sigles de brasseur ; « When “Juicy” Meets
  “Fruity” » est le titre d'un document Hopsteiner, dans la section Sources : on ne traduit pas un titre cité.

## 4. Déployable ?
Oui. Rien de ce qu'il a refusé ne revient ; aucune règle de SPEC ou de DEFAUTS enfreinte ; D168, D169, D170 et D173 ont chacun
leur contrôle rouge sur HEAD puis vert, rejoué ici. Réserves, non bloquantes pour l'app :
- `construire.mjs` / `controle-etats` non lancés (ordre du pilote) : les états de la maquette qui montrent « vanille Beer
  Maverick… » ou les sigles de Comparer/Valeurs sont à mettre à jour par la voie mécanique, avec preuve.
- `tests/integration/comparerValeurs.chrome.mjs` est déjà aligné sur D168 (ligne 174) : rien à faire.
- Les captures ne montrent pas la fiche en largeur ordinateur, ni l'appui long en geste (une capture fixe n'en montre qu'une
  partie) : le contrôle G le mesure (10 → 12 → 22 → 0 g).
- Les 7 tests rouges de `hopIndexV4` (`departage`, `apportMinoritaire`) sont d'une autre voie (domaine g2) : à régler avant le
  déploiement, mais pas par s2.

## Phrase prédite du brasseur
Sur la carte : « Voilà, là c'est propre. » Sur la fiche Huiles : « ok ». Sur la fermeture et l'appui long : il pose le doigt ;
si ça répète et accélère, « très bien ». Pas de « ??? » attendu : rien ne sort de nulle part et rien de refusé ne revient.

## Verdict par écran
- **lotus-carte** (Ma bière, carte dépliée) — ACCEPTÉ : « Voilà, là ça surcharge plus. »
- **fiche** (repos, Styles, Huiles) — ACCEPTÉ : rangées sans noms, une par plage qui diffère ; infobulle de survol dans la capture = artefact.
- **fiche-sources** — ACCEPTÉ : l'unique endroit, inchangé, Beer Maverick en tête.
- **substituer** — ACCEPTÉ : traits par plage conservés, survol sans noms.
- **comparer-valeurs** — ACCEPTÉ : plus de sigles ni de légende des références ; citations d'études laissées (question ouverte).
- **D169 fermeture / D173 appui long** — ACCEPTÉ sur preuve de contrôle (B, C, G), pas sur capture.

LEÇON PROPOSÉE : un contrôle Chrome rejoué pendant qu'une autre voie écrit des fichiers de données importés par l'app échoue par
rechargement Vite, avec une erreur qui ressemble à un vrai défaut (« Execution context was destroyed ») ; avant de conclure à un
défaut, comparer l'heure de l'arrêt aux mtimes de `src/` (`find src -newermt`), et rejouer hors écriture concurrente.
