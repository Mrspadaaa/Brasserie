N2-EXEC OK — build vert, 0 KO sur les trois groupes (pages2 compris), 0 hmr ; entrée non capturée, sonde E0 non jouée (décision du pilote)

Voie n2-exec, exécutant Haiku. Base : HEAD d21ae437 (code de n2-pages tel quel, aucun changement de code par cette voie). Aucun commit, aucun déploiement, Gemini simulé. Pas de changement dans `src/`, `scripts/`, `functions/`, `tests/`.

## Fichiers écrits
- `work/missions/2026-10-31-ecran-depense/voies/n2-exec/build.log` (sortie du build)
- `work/missions/2026-10-31-ecran-depense/voies/n2-exec/RESULTAT.md` (ce fichier)
- `work/missions/2026-10-31-ecran-depense/voies/n2-pages/bout/` : `pages/`, `pages.run`, `doc14-nomb/`, `doc14-nomb.run`, `doc1-6/`, `doc1-6.run`, `bilan.txt` (sorties des banc lancés par moi). `pages2/` vient du pilote, non rejoué.
- Scratchpad : un dossier d'essai de la sonde E0 (voir plus bas), supprimé.
Contrôle `git status` : `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `functions/.env`, `functions/.secret.local` inchangés.

## 1. Build
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npm run build"` : **exit 0**, aucune ligne « error » dans `n2-exec/build.log`, `built in 13.63s`.

## 2. Sonde E0 : non jouée — décision du pilote, limite vérifiée en ligne après déploiement
Précision honnête : la sonde a été jouée **une fois avant** le message du pilote, et j'ai écrit une configuration d'émulateur avec un `functions/.env` (dans le scratchpad, hors dépôt). Résultat observé, à titre d'information seulement et non retenu, car l'émulateur n'applique pas la limite Cloud Run : POST d'environ 12 Mo sans authentification sur `http://127.0.0.1:5001/demo-jus/europe-west6/aiTask` → **HTTP 401**, corps `{"error":{"message":"Connexion requise.","status":"UNAUTHENTICATED"}}`. Ensuite, émulateur arrêté, dossier d'essai et `.env` supprimés. Aucun autre fichier de configuration écrit après le message.

## 3. Bout en bout (banc, une commande à la fois, 390,1280)
Manifestes : `rejeu-d272b.json` et `banc-f5c-prod-paires/results.json`, comme demandé.

| Groupe | Dossier | Résultat | OK | KO | hmr update / page reload |
|---|---|---|---|---|---|
| `pages` (premier passage, avant correction du banc par le pilote) | `bout/pages` | exit 1 | 20 | 2 | 0 |
| `pages` (rejeu du pilote, banc corrigé) | `bout/pages2` (non rejoué par moi) | exit 0 | 22 | 0 | 0 |
| `doc14,nom-b` | `bout/doc14-nomb` | exit 0 | 72 | 0 | 0 |
| `doc1,doc2,doc3,doc4,doc5,doc6` | `bout/doc1-6` | exit 0 | 42 | 0 | 0 |

Le premier passage `pages` avait 2 KO, les deux sur « envoi ✓ une fois les pages parties », à 390 et à 1280. Cause probable (non vérifiée dans le DOM) : le contrôle lit la frise dès que « Lecture et vérification » apparaît, or `setBusy(true)` précède l'assemblage du PDF (`await assemblerPdf`), et `setEnvoye(true)` ne vient qu'après. La frise est donc encore au repos à ce moment. Le rejeu `pages2` passe avec le banc corrigé par le pilote.

Mesures (`pages2/report.json`) :
- `assemblage-pages-cpu-x4-ms` : 1250 et 1253 (deux largeurs, CPU ralenti ×4).
- `pages-lourdes-octets` : 748 944 à 751 697 (une largeur), 749 039 à 751 349 (l'autre). Les trois pages lourdes pèsent chacune moins de 4 Mo ; la qualité 0.55 n'a pas été changée.

## 4. Captures ouvertes et décrites
Référence : `choix-captures/retenue/img/` (exports à 780 px, soit 390 CSS à 2x).

**390**
- `pages-rangee-3` (390-01) face à `4-plusieurs-3` : même structure (trois cartes numérotées avec ×, carte « + page », « Lire 3 pages », « ajoute la suivante, puis Lire », frise, « Les lignes arrivent ici »). Écart voulu : frise au repos « envoi » sans ✓ (barres grises). La référence montre « envoi ✓ » avant Lire : c'est l'écart déjà signalé par n2-pages.
- `pages-lecture` (390-02) face à `5-lecture` : même frise (« envoi ✓ » plein, « lecture » en pointillés, « vérification » gris), pile 1-2-3 dans la carte « 3 pages ». Écart de fixture : « 0,1 Mo » ici contre « 2,1 Mo » dans la référence (pages légères contre pages lourdes).
- `pages-lue-repos` (390-03) face à `6-lue-repos` : pile dans l'en-tête, preuve « Lectures · 3 pages 2/2 » (écart voulu, au lieu de « ✓ 3 pages lues »). Fixture différente (« Malzhaus Fiktiv Pages », 2 lignes, contre « Malzhaus Nord », 6 lignes).
- `pages-panneau` (390-04) face à `7-lue-pages` : pile 1-2-3 avec « Changer », carte, Somme/Qté, preuve « Lectures · 3 pages 2/2 », « Catégorie / Papier » et « Confirmer » en bas. Même disposition que la référence ; mêmes écarts de fixture.

**1280**
- `pages-rangee-3` (1280-01) : rangée en pleine largeur, frise au repos « envoi » sans ✓, barres grises. Pas de référence à 1280 : rendu jugé seulement sur le fil de fer.
- `pages-lecture` (1280-02) : « 3 pages · 0,1 Mo », frise « envoi ✓ / lecture / vérification ».
- `pages-lue-repos` (1280-03) : bandeau des pages avec « Changer » à droite, carte de la dépense en deux colonnes, preuve « Lectures · 3 pages 2/2 ».
- `pages-panneau` (1280-04) : pile 3 dans l'en-tête, bandeau des pages, « Changer ».

**Entrée (`1-entree-f3`) : non capturée.** Aucune capture de l'entrée dans les sorties `pages`/`pages2`. La référence `1-entree-f3.png` montre « Un document | Plusieurs » et « Photographier le ticket » ; je ne l'ai pas comparée à une capture, faute de capture. Il faut la prendre dans `pages` avant la première page, ou la demander au pilote.

## Essais utilisés
Un passage par groupe, aucune relance. Aucun critère de code n'a été modifié.

## Ce qui reste douteux
- Entrée non capturée (voir ci-dessus).
- Le premier passage `pages` (2 KO) est remplacé par `pages2` après correction du banc par le pilote ; je n'ai pas vérifié cette correction.
- « Photographier le ticket » sur iOS et Android : non vérifié (voir n2-pages).
- Écarts de fixture (poids des pages, nom et lignes de la dépense) : je ne peux pas les départager d'un écart de dessin sans la référence rejouée sur la même fixture.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle qui lit une frise « une fois le texte apparu » peut passer avant la mise à jour de l'état, si le texte d'attente est posé avant un `await` (ici `setBusy` avant `assemblerPdf`) ; attendre le marqueur final (`envoi ✓`) par `waitForFunction`.
