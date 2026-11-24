OK — étapes de lecture d'un lien portées (5 écrans D448), flux et reprise par jeton, T26-4 ; planches à faire

## Fait (commit : voir ligne RESULTAT du pilote)
- **Écrans** (`src/ui/carnets/LectureLien.tsx`, `lecture-lien.css`, branchés dans `apercuCarnet.tsx` et `CarnetsVue.tsx`), style de l'app (jetons `--c-*`, lucide), à la place du cadre « ✻ lecture de la page… » :
  Début = v05+v06 (vignette en attente, « lien collé à 19:43 », 6 étapes, Replier, « lu par le serveur, 20 à 35 s ») ; Milieu = v03 (« Lecture · 3 sur 6 · 12 s », barre par étape, détail de chaque étape, la douteuse en entier) ;
  Barre repliée = v01 plus compacte (une ligne de 32 px au-dessus du champ, comptes 2✓ 1? 1–, 3/6, temps) ; Fin = v01/v03/v05 (« Lu pendant que l'app était fermée · 34 s », l'article, chaque douteux/absent avec C'est le bon / Corriger / Compléter, « 6 étapes sur 6 · lu en 34 s » qui déplie) + barre « Lu · … ×» ;
  Échec = base+v03 (« Lien introuvable · arrêté à 1 sur 6 », « 5 étapes pas lancées : rien n'est inventé », Escalader (IA plus forte, `escalade:true`), Autre lien, Compléter, Retirer). Pas de « Garder HT / Prendre TTC ». Libellé « page bloquée, lue par Google » (via Google).
- **Flux** : `AiClient.runFlux` accepte un contrat de morceau (`estFluxLecture`) ; `appelsReels.lire` passe par le flux avec un jeton tiré par l'app (`nouveauJeton`, 22 car.), gardé sur l'appareil (`suiviLocal`, localStorage) jusqu'à la fin de l'envoi ; à l'ouverture, `reprendreLectures` rappelle chaque lecture gardée avec son jeton (finie : page gardée, sans coût ; en cours : suivie par `{jeton, reprise:true}` toutes les 2,5 s). TODO de `rangement.ts` retiré. Domaine : `src/domain/carnets/lecture.ts`.
- **Banc** : `lireLienSimule` dit les étapes une à une ; pages `exemple.invalid/hotte-douteuse`, `hotte-bloquee`, `cuve-morte` ; `&lecture=lente` (24 s) ; `&reouverture=fin|en-cours` (lecture lancée « avant la fermeture », reprise par son jeton). Serveur simulé dans localStorage.
- **T26-4** : lien seul introuvable → `retirerLien` (remplacerRangement sans ligne) : ni article, ni compte, ni retour, ni « Relire », ni suggestion ; la carte d'échec le dit ; « Compléter » rend l'article (inverse gardé).
- **Contrôle** `scripts/controles/controle-etapes-dense.mjs` (CARNET-ETAPES-DENSE).

## Preuves
- `npx tsc --noEmit -p .` : 0 erreur dans le périmètre ; 2 erreurs préexistantes hors périmètre (`src/data/seedData.ts` GanttTask, `src/services/enregistrerPwa.ts` : `vite-plugin-pwa` absent de node_modules de cette copie).
- Tests : `tests.log` → 40 fichiers, 553 tests verts (carnets*, lot11, lot3, port-q4, planning-vers-carnet), dont `tests/unit/carnetsEtapesLecture.test.ts` (11 neufs). `carnetsRangement.test.ts` : 2 attentes élargies (la lecture porte jeton et horodatage).
- T26-4 rouge d'abord : `t26-4-rouge.log` (HEAD `rangement.ts` copié, test lancé, copie neuve restaurée et vérifiée par `cmp`) : 1 failed ; puis vert.
- `controle-dense.log` : `app : barre 32 px ; lignes 24 ×6 → app OK` ; `v01 : barre 61.4 px → v01 KO` ; `CONTROLE OK (app OK, témoin v01 KO)`. Lancer : `BANC_URL=http://localhost:<port> node scripts/controles/controle-etapes-dense.mjs`.
- Aucun appel Gemini (banc simulé ; tests : passerelle simulée, `AiClient.run` jamais appelé).
- Serveur de banc : `vite-plugin-pwa` manque dans node_modules → `npx vite --config work/missions/2026-11-23-reprise-soir/voies/etapes/vite.banc.config.ts --port 5191` (config copiée, PWA neutralisée).

## Captures (390 px, ouvertes) : `captures/`
01-debut, 02-milieu, 03-barre-repliee, 04-fin-reouverture, 04a-fin-barre, 04b-reouverture-en-cours, 05-echec-t26-4 (Articles 6, lien non gardé : `lienGarde:false`), 06-page-bloquee, 00-avant-cadre (avant).
Écarts avec ses maquettes, voulus : (1) Milieu v03 : pas de vignettes de photos dans l'étape Photos (le flux ne porte qu'un compte ; rien d'inventé) ; (2) Fin hors réouverture : pas de carte article (le retour « Article rangé ici · Annuler », acquis, la nomme déjà) ; (3) Fin : prix de l'article en devise d'origine (1 690 EUR), pas « ≈ CHF » (D447 tient dans la carte d'article) ; (4) pas de ✕ pendant la lecture (absent de v03/v05/v06 ; la lecture continue côté serveur) ; (5) le toast hors Carnet de v05-5 (écran Brassins) n'est pas porté (hors OWNS).
Défaut vu, non corrigé : (6) réouverture au banc : la fin s'affiche sur la liste, pas dans Ventilation (le rangement repris part de la vue liste).

## Prédiction
« Là je vois ce qui se passe et c'est serré » ; il regardera si la barre repliée tient vraiment sur une ligne et si Escalader coûte.

DEMANDE EXECUTANT :
1. Serveur : `npx vite --config work/missions/2026-11-23-reprise-soir/voies/etapes/vite.banc.config.ts --port 5191 --strictPort` (en fond).
2. Planches côte à côte (390 px, app à gauche, maquette à droite), dans `work/missions/2026-11-23-reprise-soir/voies/etapes/captures/planches/` :
   01-debut.png + page/img/v05-2.png + v06-1.png ; 02-milieu.png + v03-2.png ; 03-barre-repliee.png + v01-repliee.png ; 04-fin-reouverture.png + v01-fin.png + v03-4.png + v05-6.png ; 05-echec-t26-4.png + base-echec.png + v03-5.png
   (images de maquette : `work/missions/maquettes-carnet/page/img/`). Outil : une page HTML locale qui pose les PNG côte à côte, capturée par puppeteer-core sur Chrome 9222 (onglet neuf, `page.close()`, `browser.disconnect()`), ou sharp si présent.
3. Rejouer `BANC_URL=http://localhost:5191 node scripts/controles/controle-etapes-dense.mjs` → attendu `CONTROLE OK`.
4. Ouvrir chaque planche (Read) et lister « écarts avec la maquette » ; me renvoyer la liste pour jugement.

CONNAISSANCE : la copie openai-clean-start n'a pas `vite-plugin-pwa` dans node_modules : `npm run dev` y échoue ; config de banc sans PWA dans le dossier de la voie.
LEÇON PROPOSÉE : aucune
