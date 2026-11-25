# Jouable M4 b (25.11 soir)

Ses mots : « On continue les mini maquettes, on prend les meilleures et on lance les deux voies en maquettes jouable. » ;
« Est-ce que à la place de Gemini, clé IA. Tu peux faire cette intermédiaire. Tu verras aussi les problèmes du coup. »

Voie 1 sur 2 : M4 b (maquettes/m4b-note.html, cap/m4b-*.png, corrections/m4b.md, règle M4B.md). La voie 2 viendra de la passe 4.

## Ce qu'on livre
Un seul fichier `jouable/m4b.html`, publié par le pilote comme artefact claude.ai privé (le pilote publie, pas toi). Il le joue sur son téléphone.
- **Mes notes** : vraie note de téléphone, `contenteditable` sur un seul document, éditée sur place ; titre éditable ; méta discrète. Barre au-dessus
  du clavier (en bas, collée au clavier virtuel via `visualViewport`) : IA (Ranger), voix, photo, lien, case. Le texte se garde à chaque frappe.
- **Coller le lien** : au toucher de l'outil, `navigator.clipboard.readText()` ; si une URL https, insérée au curseur comme lien (refus : rien, pas d'erreur).
- **Photo** : `<input type=file accept=image/* capture>` ; miniature insérée au curseur (réduite à 1024 px, gardée en data URL dans le stockage local).
- **Voix** : capacité `dictation` (`claude.use("dictation")`), texte ajouté au curseur ; outil caché si `null`.
- **Organisé** : la vue IA de M4 b (état proposé, pistes trouvé / pas trouvé / à vérifier, options, conseillé, tâche, résoudre, relire, feuille
  « Changé par l'IA »), rendue depuis la réponse de l'IA. Toucher un bloc → Mes notes avec SA ligne surlignée.
- **L'IA = Claude via la capacité `sample`** (`const sample = await claude.use("sample")`, `await sample.json(...)`). Pas de Gemini, pas de clé.
  Consigne envoyée à chaque appel (sans mémoire) : le texte du carnet en lignes numérotées, l'Organisé précédent et ses refus, et un format JSON strict :
  `{etatPropose, pistes:[{texte, statut:"trouve"|"pas_trouve"|"a_verifier", ligne, citation}], options:[{titre, cout, source:"notes"|"ia", ligne?, citation?, conseille}],
  tache:{titre, quand?, ligne?, citation?}|null, conseil?, resolu?:{question}, lectures:[{ligne, mot, type:"montant"|"pas_trouve"|"contacte"|"piste"|"devis"|"date"}], genre:"probleme"|"achat"|"memo"|"idee"}`.
  Règles dans la consigne : ne jamais réécrire son texte ; une citation est un extrait EXACT de la ligne ; ce qui ne vient pas de ses notes porte `source:"ia"` ;
  rien de tranché sans preuve dans les notes ; aucune date inventée ; français.
- **Contrôle côté page** : chaque citation est vérifiée contre la ligne ; une citation absente est retirée de l'affichage et comptée comme problème.
- **Journal** : capacité `db`. Collection `journal`, un document par appel : `{quand, carnetTitre, lignes (texte envoyé), reponse (JSON brut), msTemps,
  erreurs:[...], citationsFausses:n, refus:[...] }`, plus chaque geste dans Organisé (garder, refuser, retenir une option) en `{quand, geste, quoi}`.
  Règles : `db:{rules:[{path:"journal",read:"admin",write:"interact"}]}` (lui = owner ; le pilote relit avec ArtifactData).
- **Carnets** : une petite liste (titre, état), « + Nouveau carnet » ; au premier lancement, un carnet « ZZ TEST — Écoulement qui fuit » chargé depuis
  tests/fixtures/c79/zz-ecoulement-qui-fuit.json (ses 6 lignes, rien d'inventé). Stockage : `localStorage` dans try/catch (par appareil, c'est un jouable).
- **Sans IA** : si `sample` est `null`, refusé ou en erreur → état « IA indisponible » de M4 b (ses notes gardées, Réessayer) ; jamais de réponse inventée.
- **Mode démo local** (`?demo`) : une réponse JSON fixe, pour les captures hors claude.ai uniquement ; jamais servie sans `?demo`.

## Contraintes artefact
HTML seul, styles et scripts en ligne ; tokens de couleur sur `:root` (thème sombre de M4 b, et un clair dans `@media (prefers-color-scheme: light)`) ;
textes de l'IA posés par `textContent` ; pas de lien sauf https. Lire avant le code : les types dans
C:/Users/mrspa/AppData/Local/Temp/claude/bundled-skills/2.1.330/1e43201d3549360c17554d636e8de6af/artifact-capabilities/0.2.99/ (claude.d.ts, sample.d.ts, db.d.ts, dictation.d.ts).
`claude.use()` se résout plus tard : la page s'affiche sans, puis allume l'IA.

## Preuve
Captures 390 × 844 avec `?demo` et un `window.claude` simulé injecté par puppeteer (Chrome de débug 9222, ton onglet, page.close(), browser.disconnect()) :
ouverture et frappe, lien collé, photo, Ranger (attente), Organisé, toucher d'un bloc, garder / refuser, IA indisponible, nouveau carnet vide.
Ouvre chaque capture. Écris jouable/RESULTAT-m4b.md : gestes joués, captures, ce qui n'a pas pu être testé hors claude.ai.
