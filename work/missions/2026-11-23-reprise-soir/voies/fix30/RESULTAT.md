OK — T30-1 à 6, 8 à 14 et T28-2, 3, 6, 12, 13 corrigés ; T30-7 hors de ma voie (DÉCISION) ; 668 tests verts, banc liens sans recul

PRÊT À METTRE EN LIGNE 53cf48e91 (client 1987016dc, serveur et étapes 8b8e7771c, tests de composants 53cf48e91)

## Fichiers écrits
- Domaine : `src/domain/carnets/longueurs.ts` (neuf), `prixUnitaire.ts`, `comparer.ts`, `operations.ts` (`completerLienMort`), `lecture.ts`, `modele.ts` (`valeursEnFrancais`).
- UI : `src/ui/carnets/lectureRegles.ts`, `CarnetsVue.tsx`, `apercuCarnet.tsx`, `LectureLien.tsx`, `lecture-lien.css`, `rangement.ts`, `TableauCarnet.tsx`, `Comparer.tsx`, `CarteArticle.tsx`, `carnets.css`.
- Serveur : `functions/src/lienProduit.ts`, `lireLien.ts`, `lienIA.ts`, `lienLibelles.ts`, `lienValeurs.ts`.
- Tests : `tests/unit/carnetsFix30.test.ts` (31 tests de règles), `tests/unit/carnetsFix30Ecran.test.tsx` (6 tests de composants, jsdom) ; trois anciennes assertions mises à jour (`carnetsEtapesLecture`, `carnetsLiensReprise`, `carnetsRangement` : nom de modèle retiré, étape « Rangement » ajoutée).
- Dossier de voie : `r.mjs` et `p1`…`p9.mjs` (scripts de remplacement, fichiers en CRLF), `tests.log`, `banc-apres.log`, `tsc-*.log`.

## Un constat, une ligne (fait, test, commit)
- T30-1 : fait. `lectureIci` / `carteEnBarre` (lectureRegles.ts) : la carte entière n'est que dans la vue du lien (carnet du collage, ou la liste si le lien y a été collé) ; ailleurs, et dès qu'on quitte cette vue, elle se replie en barre v01 en bas, sans toucher « Replier ». Test : 4 (règle). 1987016dc.
- T30-2 / T28-3 : fait. « Compléter » ouvre une saisie dans la carte d'échec (nom obligatoire, prix en francs facultatif, « Garder » / « Annuler »). Cause du toast « Article introuvable. » : le lien était déjà dans le carnet (collé une première fois), donc le second message n'avait aucun article ; `completerLienMort` retrouve l'article par le message, sinon par l'adresse, sinon le crée dans le carnet du lien. L'article reste « lien introuvable », provenance « vous », il se compte et se classe. Tests : 4 (règle) + 3 (composant). 1987016dc, 53cf48e91.
- T28-6 (restes) : fait. Le rang « 1er pour le prix » et la règlette de Choisir lisent le prix qui classe (`prixClasse`, CHF, au kilo ou au litre quand ≥ 2 offres disent leur quantité) ; la liste (tableau du carnet) et Comparer disent la quantité sous le prix (« 1 kg », « 100 g · 90,00 CHF/kg ») ; le rang dit « 1er pour le prix au kilo ». Tests : 3. 1987016dc.
- T30-3 : fait. Vue d'un autre carnet, la fin est la barre « Lu · nom » avec, sur une seconde ligne, « dans « carnet » » (jamais tronqué par le nom de l'article). Test : 1 (composant). 1987016dc.
- T30-4 : fait. `prixEnChf` : un prix en euros passe au cours lu avec l'article (`change`, BCE) ; sans cours il reste hors classement (jamais deviné). Brew Monk ≈ 147 CHF passe devant Kibernetik 302 CHF quel que soit l'ordre d'ajout ; le critère se dit « le prix en CHF ». Tests : 3. 1987016dc.
- T30-5 : fait. « C'est le bon » est gardé par message (état de `CarnetsVue` + `localStorage`, 60 messages) ; la question ne revient pas à la réouverture du carnet. Tests : 2 (règle) + 1 (composant). 1987016dc.
- T30-6 : fait. Une colonne de longueurs dit une seule unité : mm et m passent en cm ; une valeur SANS unité qui dépasse 1 000 dans une colonne en cm est lue en mm (« 2010 » → « 201 cm »). Test : 3. 1987016dc.
- T30-7 : NON FAIT, hors de mon périmètre (voir DÉCISION).
- T30-8 : fait. La carte rangée après un lien montre au plus 3 caractéristiques (« +5 » pour le reste) ; « lu sur la page : nom, prix, photo, 8 caractéristiques » ne répète plus les noms. Test : 2. 1987016dc.
- T30-9 : fait. « 8 caractéristiques » (la provenance ne se détaille que si elle varie). Test : 1 sur la vraie page galaxus du banc. 8b8e7771c.
- T30-10 : fait. Quand la page est lue et que l'IA range l'article, l'étape « Rangement » tourne (« Lecture · 6 sur 7 ») jusqu'à la fin. Tests : 2 (règle) + 1 (composant). 8b8e7771c.
- T30-11 : fait. Plus de nom de modèle : « rien de plus à lire », « IA plus forte », « relu par une IA plus forte ». Test : 1 (sur la source, sans Gemini). 8b8e7771c.
- T30-12 : fait. `prixTexte` dit deux décimales dès qu'il y en a : « 72,50 CHF ». Test : 1. 1987016dc.
- T30-13 : fait. « Height without extension legs » → « Hauteur sans pieds d'extension ». Test : 1. 8b8e7771c.
- T30-14 : fait. « Hopfenpellets Typ 90 » → « Pellets type 90 » (au passage : l'espace après un mot traduit n'est plus mangé, « PelletsType » ; la majuscule ne reste qu'en tête de valeur). Test : 1. 8b8e7771c.
- T28-2 (reste) : couvert par T30-1 et T30-3 (barre en bas, nom du carnet, un toucher mène au carnet du lien : `deplier` de fix28).
- T28-12 / T28-13 (restes) : fait. Cause : les articles déjà rangés gardaient les noms anglais et les valeurs allemandes de leur lecture. `valeursEnFrancais` (modele.ts) les dit en français à la lecture, par la même table que le serveur ; rien n'est réécrit, ce que le brasseur a écrit, les nombres et les oui-non ne sont jamais touchés. Tests : 3. 8b8e7771c.

## Sorties décisives
- `npx tsc --noEmit -p .` : les 2 erreurs connues seulement (seedData, pwa-register) — `tsc-racine.log`.
- `cd functions && npx tsc --noEmit` : exit 0.
- `npx vitest run tests/unit/carnets* tests/unit/lien* tests/unit/lot* tests/unit/port-q4* tests/unit/planning-vers-carnet*` : 48 fichiers, 668 tests verts (`tests.log`).
- Banc liens sans IA (`npx tsx scripts/banc-liens.ts`, `banc-apres.log`) : nom 58/63, prix 52/56, photo 56/59, caractéristiques 35/48, 0 invention, comme avant.
- Gemini réel : 0. Aucune capture locale (la preuve est en ligne, par le pilote).
- Essais : aucun critère au-delà de 2 ; deux corrections de ma part en cours de route (heredoc qui perdait les barres inverses : scripts écrits avec Write ; la table de mots qui mangeait l'espace).

## À regarder en ligne (doutes)
1. T30-1 : quitter le carnet replie la carte ; revenir dans le carnet par ‹ la laisse en barre (un toucher la déplie). Si le brasseur la veut dépliée au retour, retirer l'effet `useEffect(… setLectureRepliee(true))` de `CarnetsVue.tsx` : la règle `lectureIci` suffit alors à la replier ailleurs.
2. T30-1 : la carte d'ÉCHEC (lien mort) n'est montrée que dans la vue du lien, aucune barre ailleurs (ses gestes mènent à ce carnet) ; un lien mort collé dans ZZ puis un autre carnet ouvert ne montre rien.
3. T30-6 : « sans unité et plus de 1 000 dans une colonne en cm = mm » est une déduction (seuil 10 m) ; elle est la seule devinette de la voie. Sous 1 000, rien n'est converti.
4. T30-4 : un prix en euros sans cours (`change` absent) n'est pas classé ; un seul article avec cours + un seul en francs suffisent à classer.
5. T30-2 : après « Garder » on reste dans le carnet (aucune fiche ouverte) ; l'article compte aussitôt dans « articles à comparer » s'il a un prix, sinon il est « à relire » dans le tableau.
6. T28-6 : la règlette de Choisir pour le prix dit « CHF/kg » en unité quand le classement est au kilo ; elle affiche des francs arrondis (centimes/100).
7. Preuve : aucun écran local ouvert (consigne de la voie). Les 6 tests jsdom prouvent la saisie, la barre à deux lignes, la réponse gardée et l'étape ; l'habillage (hauteur de la barre à 40 px, champs de la saisie) reste à voir à 390 px en ligne.

DÉCISION À PRENDRE : T30-7 (toast « Enregistrement sur le serveur… » pendant plus de 10 min dans Stocks › Matériel). Le toast est `PersistenceStatus.tsx` / `FirestoreRepo.syncStatus()` (hors de mon périmètre, et l'en-tête L-49 dit « cause non établie hors réseau réel »). Options : (a) en ligne, quand il reste affiché, lire l'attribut `data-attente` de `[data-bandeau-persistance]` (il nomme ce qui retient : `file`, `envoi`, `documents`, `collection:<nom>`, `ecritures`) et me rendre cette valeur ; (b) confier au propriétaire de `src/services/firestoreRepo.ts` une voie « écriture qui ne s'acquitte jamais » avec ce diagnostic. Recommandation : (a) puis (b) ; je n'ai touché ni au toast ni au dépôt Firestore.

CONNAISSANCE : un lien déjà présent dans un carnet n'y crée plus d'article au second collage (l'écriture locale renvoie `existant`) : toute action sur « l'article du message » d'un lien mort doit retomber sur l'article de la même adresse (`lienCanonique`), pas sur `messageId` seul. Les fichiers de `src/ui/carnets` et `src/domain/carnets` sont en fins de ligne mêlées (CRLF et LF) : un remplacement multi-lignes doit normaliser avant (`work/missions/2026-11-23-reprise-soir/voies/fix30/r.mjs` le fait, avec split/join).
LEÇON PROPOSÉE : aucune
