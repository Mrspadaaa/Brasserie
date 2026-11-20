OK — 4 vieux tests rouges jugés et réécrits sur la carte d'appel pm1 ; le conseil « Et donc » rendu à la carte ; yeast rouge sur HEAD

Captures faites après reprise (coupure d'usage) : 390 clair et cave (appel, touche, replie, fait, ph-du, releve, tout), 1280 clair et cave (appel, releve), dans `captures/`. Ouvertes : 390-clair-touche, 390-clair-fait, 390-cave-touche, 390-cave-fait, 1280-clair-releve, 1280-cave-releve. Aucun « KO » ni PAGEERROR au banc ; serveur 3116 arrêté.
- 390-cave-touche / 390-cave-fait : la ligne « Et donc » (13 px, muette) est lisible sur le fond cave, dans la carte warn et dans la ligne verte ; rien ne déborde ; Relever crème plein comme pm1-sombre.
- 1280-clair-releve / 1280-cave-releve : la carte d'appel tient la colonne gauche, température relevée (verte, « dans la cible », donc aucune ligne « Et donc »), pH « à relever » warn, Relever grisé, Plus tard actif ; les tuiles de relevés restent à droite. Les 1280 ne jouent pas l'état « touche » (même composant qu'au 390).

## Jugement par assertion

| Test | Assertion | Verdict | Fait |
|---|---|---|---|
| `brewOrdreM2` | « Relevés du jour » vient avant Grains (`.bm-now` avant la région Grains) | **Détail que pm1 remplace.** L'ordre (ce qui est dû avant Grains) est un choix de m2 toujours valable, et il est tenu : la carte d'appel est au même endroit du DOM. Seul le sélecteur `.bm-now` (l'ancienne carte) était périmé. | `.bm-now` → `[data-appel]`, même intention, même comparaison d'ordre. Vert. |
| `brewPageI1b` n° 1 | carte « Maintenant · relevé dû » en tête, grande valeur « ? », Enregistrer désactivé tant que rien n'est posé, pas de champ numérique | **Détail remplacé** (la grande valeur « ? » et le bouton Enregistrer n'existent plus dans pm1 : la température est proposée « à confirmer », le bouton est « Relever »). **Intention gardée** : relevé dû en tête ; rien n'est noté sans toucher ; aucun `type="number"`. | Réécrit : carte `[data-appel="ouvert"]`, température « à relever » + « proposé, à confirmer », Relever / Plus tard présents, « Plus tard » replie et n'écrit pas (aucun « ✓ Relevé »), aucun champ numérique. Vert. |
| `brewPageI1b` n° 2 | ±0,1 puis Enregistrer : « ✓ … relevé à … », « Enregistré · prochain relevé » | **Détail remplacé** (pas de ±0,1 ni d'Enregistrer ; le « prochain relevé » est dit par la carte pH « à 15′ » et la frise « pH · … · dans 15 min »). **Intention gardée** : un relevé fait entre et se lit « ✓ ». | Réécrit : curseurs posés (67,4 °C, pH 5,32), Relever, ligne `[data-appel="fait"]` « ✓ Relevé » avec les deux valeurs, plus de bouton. Vert. |
| `brewPageK2` n° 5 | les 3 bandes « sous · dans · sur » et la bande lue allumée, avant comme après Enregistrer | **Régression partielle, corrigée.** Les bandes sont un détail que pm1 remplace (pm1 n'a pas de bandes). Mais leur « Et donc » (l'eau bouillante ou froide à ajouter par °C quand le palier est hors cible, `zonesDeCible`/`infusionPourMaische`) n'était affiché NULLE PART ailleurs (la feuille Mesurer n'a pas de zones) : pm1 faisait perdre ce conseil. « Rien ne se perd » (VOIE pm1). | Code : `AppelMesure` reçoit `zones` (la page passe `bandesDe('temperature').zones`) et dit, **seulement hors cible et si la bande a une consigne**, une ligne muette « Et donc : ≈ 0,4 L d'eau froide (15 °C supposés) par °C, remuer » sous la valeur ; reprise dans la ligne verte « ✓ Relevé ». Dans la cible : rien en plus (la carte dit « dans la cible » ; l'ancienne bande « rien : l'horloge tourne » n'apporte rien, l'heure du pH est dans la carte pH). Test réécrit : dans la cible aucune ligne ; à 65 °C la ligne est dite, et reste après Relever (carte température relevée, pH encore à relever) ; + test de la ligne « ✓ Relevé » (sous la cible : conseil dit ; dans la cible, sans consigne ou `zones` absent : rien, jamais inventé). Vert. |

Aucun changement de `brewAssist.ts` (décision pilote). `BrewThermalControl`, domaine : non touchés.

## yeastPitchingExecution
Rejoué sur HEAD (`755f77d11`, worktree détaché temporaire `%TEMP%/wt-pm1`, `node_modules` en jonction, puis `git worktree remove` : fait) : **2 rouges sur 11**, les mêmes noms : « ne confirme pas la dose prévue quand le plan est nul… » et « laisse un historique sans quantité inchangé au montage… ». Donc **rouge avant nos voies** (rouge sur le code commité, indépendant de tout fichier non commité). Pas de lien avec le palier d'empâtage ; non corrigé (hors Possède). Cause non cherchée au-delà : à un auteur de l'ensemencement.

## Critères
- `tests.txt` (6 fichiers : brewOrdreM2, brewPageI1b, brewPageK2, yeastPitchingExecution, appelMesure, appelMesureVue) : 52 passés, 2 rouges = yeast seul. Les 3 fichiers réécrits : 17 + 1 passés (brewPageK2 : 7 tests).
- `npx tsc --noEmit -p tsconfig.json` : aucune erreur sur AppelMesure, BrewDayPage, les 3 tests.
- Essais : 1 par fichier de test, 0 relance.

## Fichiers écrits
`src/ui/brassage/AppelMesure.tsx` (prop `zones`, `etDoncDe`, ligne « Et donc »), `src/pages/BrewDayPage.tsx` (une prop au rendu d'`AppelMesure`), `tests/integration/brewOrdreM2.test.tsx`, `brewPageI1b.test.tsx`, `brewPageK2.test.tsx`, ce dossier (`tests.txt`, `captures/`). Les tests étaient sous `tests/integration/`, pas `tests/unit/`.

## Captures (390 clair, ouvertes)
Contre `maquette/captures/pm1-clair.png` : mêmes éléments, ordre, mots, couleurs. Écart ajouté, un seul :
- `390-clair-touche` : sous « +0,5 au-dessus » (warn), ligne muette 13 px « Et donc : ≈ 0,4 L d'eau froide (15 °C supposés) par °C, remuer », sur une seule ligne, dans la carte warn, lisible ; rien ne déborde.
- `390-clair-fait` : la ligne verte « ✓ Relevé palier 68,5 °C pH 5,34 » porte la même ligne « Et donc » en dessous ; frise « pH ✓ ».
- `appel`, `replie`, `ph-du`, `releve`, `tout` : inchangés par ma voie (banc : « BANC OK », 390 clair).

## DEMANDE EXECUTANT (caduque : captures faites moi-même sur la demande du pilote, commandes ci-dessous exécutées telles quelles)
Pour finir les captures (390 cave, 1280 clair, 1280 cave), depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` :
1. `npx vite --port 3116 --strictPort` en arrière-plan ; attendre que `http://localhost:3116/` réponde.
2. `node work/missions/2026-11-20-port-simplicite/voies/v-pm1/outils/banc.mjs 390 cave work/missions/2026-11-20-port-simplicite/voies/v-pm1-tests/captures tous`
3. `node work/missions/2026-11-20-port-simplicite/voies/v-pm1/outils/banc.mjs 1280 clair work/missions/2026-11-20-port-simplicite/voies/v-pm1-tests/captures court`
4. `node work/missions/2026-11-20-port-simplicite/voies/v-pm1/outils/banc.mjs 1280 cave work/missions/2026-11-20-port-simplicite/voies/v-pm1-tests/captures court`
5. Arrêter le serveur 3116.
Sorties attendues : « BANC OK » à chaque commande (en 390 cave, la ligne `THEME cave -> cave`).
Fichiers : `captures/390-cave-{appel,touche,replie,fait,ph-du,releve,tout}.png`, `captures/1280-clair-{appel,releve}.png`, `captures/1280-cave-{appel,releve}.png`.
Captures à ouvrir par moi (le verdict est à moi) : `390-cave-touche`, `390-cave-fait`, `1280-clair-releve`, `1280-cave-releve` (état hors cible dans la colonne gauche du 1280 : vérifier si « touche » y est joué ; sinon ajouter un état « touche » en 1280 est hors de ma demande).

## Doutes et limites
- Le « Et donc » ne concerne que la température (le code ne donne aucune consigne pour le pH : `zonesDeCible` renvoie `null` hors maische/température). Rien d'inventé.
- La température à 15 °C « supposés » de l'eau froide est l'hypothèse déjà écrite par `infusionPourMaische`, reprise telle quelle.
- La ligne « Et donc » est un ajout à pm1 justifié par une fonction existante ; le brasseur peut la retirer en gardant la perte du conseil (voir DÉCISION).

## DÉCISION À PRENDRE
Garder la ligne « Et donc » sous la valeur (recommandé : rien ne se perd, une ligne muette, hors cible seulement) ou accepter que pm1 retire le conseil d'infusion (l'eau à ajouter par °C) du palier ? Ma recommandation : la garder ; si la maquette pm1 doit rester stricte, le montrer au brasseur en mini maquette avant retrait.

CONNAISSANCE : aucune.
LEÇON PROPOSÉE : quand une maquette remplace une carte, lister les fonctions de l'ancienne carte (ici le conseil « Et donc ») et dire où chacune va, avant de réécrire ses tests ; un test rouge peut cacher une fonction perdue, pas seulement un sélecteur périmé.
