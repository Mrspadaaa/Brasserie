OK — parcours justificatif→revue→dépense et stock vert sur émulateurs, 390 et 1280, écran r2b ; fix114 inchangé et vert.

(Voie e-emulateur, mission 2026-10-31-ecran-depense. Aucun VOIE.md ni GATES.md n'existait dans le dossier de la voie : j'ai suivi la consigne du pilote.)

## Fichiers écrits
- `scripts/check-invoice-journey-emulator.mjs` (+128 / −16 lignes, `node --check` OK).
- `scripts/check-fix114-ui.mjs` : une seule ligne, l'option `--out=<dossier>` (défaut inchangé). Aucun sélecteur à changer : il ne touche l'écran que par le titre `Nouvelle dépense` et le bouton `Fermer`, qui existent encore. Sans `--out`, il écrasait les preuves de #114 sous `work/finalisation-tickets-2026-10-08/validations/114/<phase>`.
- Dans `work/missions/2026-10-31-ecran-depense/voies/e-emulateur/` : `temoin/`, `essai1` à `essai5`, `final/`, `final2/`, `final3/` (journaux, `report.json`, captures), `rejouer.sh`, `rejouer-fin.sh` (rejeu par groupes, voir plus bas), ce fichier.
- `git check-ignore -v` : le dossier est ignoré (règle `.gitignore:104 /work/missions/**`). `git status --short scripts` : seuls les deux scripts ci-dessus sont modifiés par cette voie (les `scripts/eval-hop/k1-*` viennent d'une autre voie).
- Rien touché hors périmètre : pas de `src/`, `functions/`, règles, tests, `.codex/`, `source4-…json`, `functions/.env` (non lu).

## Manifeste `--replay` retrouvé
`work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu.json` (hors Git). Les six images `doc1` à `doc6` et les sorties `runs/H13R/final.json` et `runs/H13R-2/final.json` existent toutes. Trouvé par `git log` du script (5f72638a, JUS-1) puis `grep replay` dans `work/finalisation-tickets-2026-10-08/`.

## Commande exacte (celle qu'attend le critère)
```
node scripts/check-invoice-journey-emulator.mjs --replay work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu.json --out work/missions/2026-10-31-ecran-depense/voies/e-emulateur/<dossier>
```
(défauts : largeurs 390,1280 ; les douze cas ; port 5175). Sortie verte : `EMU-INVOICE-JOURNEY-OK`, code 0, `N/N contrôles du banc OK`.

La commande en un seul bloc a été jouée une fois jusqu'au bout (`essai3` : 43/43 contrôles, mais le cas `doc1` s'arrêtait, voir plus bas). Ensuite, la garde mémoire du banc (< 3 Go libres, machine partagée avec d'autres voies) a arrêté cinq lancers sur huit. Je n'ai pas touché à cette garde. J'ai donc rejoué le script FINAL par groupes de cas, chacun aux deux largeurs (les cas sont indépendants entre groupes) :

| Groupe | Cas | Dossier | Résultat |
|---|---|---|---|
| A | etats, doc5, finances, doc6 | `final2/A` | `45/45 contrôles OK`, `EMU-INVOICE-JOURNEY-OK`, exit 0 |
| B | autre-numero, rattacher, minuscules, doc1 | `final3/B` | `11/11 contrôles OK`, `EMU-INVOICE-JOURNEY-OK`, exit 0 |
| C | doc4, hors-ligne, doc3, doc2 | `final3/C` | exit 0, 14 OK, 0 KO (essai 2 ; l'essai 1 a été arrêté par la garde mémoire) |
| fix114 | `check-fix114-ui.mjs --phase=apres --base=http://127.0.0.1:5184 --out=…/final3/fix114` | `final3/fix114` | `erreurs page : 0 · origines bloquées : aucune`, `critères #114 : tous tenus`, exit 0 |

Limite : le script final n'a pas été joué en un seul bloc de douze cas ; sa dernière modification (`slice(0, 500)` → `3000` dans `confirmSheet`) ne précède que le groupe A (rejoué) et n'affecte ni B ni C (leurs messages font moins de 500 caractères) mais B et C de `final2` datent d'avant ; `final3/B` et `final3/C` sont, eux, sur la version finale. Un rejeu unique complet reste à faire par un exécutant si le pilote le veut (voir DEMANDE EXECUTANT).

## Témoin avant adaptation (script d'origine, arbre de travail actuel)
Lancé tel quel avec `--cases etats,doc5 --widths 390` (dossier `temoin/`). L'arbre contient la voie S6 non commitée, donc ce n'est pas un `checkout` de HEAD pur (je n'ai pas touché au dépôt).
- `etats` : 4/4 contrôles OK, puis ARRÊT : `Délai dépassé : bouton pour choisir un justificatif` (le bouton « Changer » est devenu une icône d'en-tête, texte vide, nom accessible `Changer`).
- `doc5` : ARRÊT sur `failed to find element matching selector "[role="dialog"] section[aria-label="Vérification du justificatif"] details"` (la région n'a plus de `<details>` : preuve repliable par le bouton `Détails de la lecture`).
- Le cas `doc3` aurait cassé sur `[data-purchase-payment] summary` (plus de `<details>`, le règlement est une tuile).

## Attentes changées (avant → après, pourquoi)
1. Choix d'un justificatif après lecture : texte du bouton `Changer` → nom accessible (`aria-label`) `Changer`. Même geste, l'icône n'a plus de texte.
2. Revue, détails de la lecture : ouvrir `section[…] details` → bouton `aria-label="Détails de la lecture"` (`aria-expanded`), puis `section[data-dp="preuve"]`. Sur téléphone la preuve est repliée ; sur ordinateur elle est déjà ouverte. Lecture des puces `li` par `textContent` (lit aussi le replié). Capture de la preuve centrée (`block: 'center'`) : en `start`, le haut passait sous la bande collante.
3. Règlement : `[data-purchase-payment] summary` → tuile `[data-dp="tuile-paye"]` ; ouverture du panneau par un geste sur la tuile (`openPayment`). Les boutons `État du règlement` et les champs date restent ceux d'avant. C5 (doc3) : « Ajouter une échéance » → « Règlement À payer » (même information : le règlement proposé est « À payer »).
4. Lignes de la facture : toujours `article[data-purchase-line]`, un seul `summary` direct ; les champs sont dans le plateau, ouvert par le script quand il faut (`toggleLine`, déjà là ; ajouté pour la correction d'unité). Le marqueur « proposé » est lu dans le texte lecteur d'écran (`sr-only`) de la ligne ; les 3 propositions justes sont encore vues (`semisProposesJustes: 3`).
5. Confirmer : une dépense avec justificatif ne ferme plus la feuille toute seule, elle montre le reçu Drive jusqu'à « Terminé ». `confirmSheet` détecte ce reçu (capture `recu-drive`), le consigne (`doc5-recu-drive`), clique « Terminé », et rend `fermée` comme avant. Les alertes sont lues sur 3000 caractères au lieu de 500 : le message de doublon vient maintenant après d'autres erreurs dans la liste « À corriger » et le refus du doublon n'était plus lisible.
6. Réouverture du justificatif depuis Finances : l'image n'est plus nommée comme le fichier choisi (`doc5-facture….jpg`) mais comme Drive l'a rangé (« 2026-04-27 Brau- und Rauchshop GmbH 372765.jpg »). L'attente cherche le nom écrit sur `financeDocuments/<id>.fileName`, et elle est renforcée : les octets de l'image affichée doivent avoir la somme SHA-256 de l'original (`imageAfficheeIdentique`).
7. Écran Annuel : si l'onglet « Dossier » est revenu à « Préparer » après le téléchargement Excel (vu une fois, `essai2`), le banc rouvre « Dossier » et le consigne (`ongletDossierReinitialiseApresExcel`). Pas revu dans les jeux finaux.
8. Ordre des cas : `rattacher` laissait une dépense portant l'empreinte de doc1, que le cas `doc1` voyait à raison comme doublon (« Un achat similaire existe déjà », arrêt du cas). Elle est retirée en fin de `rattacher`, comme celle de `autre-numero`. Ce n'est pas un défaut de l'app.

## Attentes durcies (rien d'affaibli)
Les résultats qui n'étaient que des constats (`findings`, sans effet sur le code de sortie) deviennent des contrôles `c.check` (qui font échouer le script) : doc5 (une seule dépense, montant TTC = lu, toutes les lignes lues et chacune avec son montant, une réception par ligne de stock lue et aucune pour services et port, quantité reçue = quantité lue, chaque article existant semé garde nom, catégorie et unité et reçoit exactement ses mouvements, ni service stocké ni doublon, original rangé dans Drive avec même empreinte et même taille, « Confirmer » ferme la feuille) ; finances (dépense au journal, original rouvert aux mêmes octets, présente dans l'Excel et le ZIP avec l'original identique) ; doc6, autre-numero, rattacher, minuscules, doc1, doc4 (hors ligne : message en français, aucune écriture, un seul geste au retour du réseau), hors-ligne (rien au serveur pendant la coupure, exactement une dépense au retour), doc3. Total des contrôles à deux largeurs : 45 + 11 + 14 = 70 (le banc en comptait 4 avant).

## Défauts de l'app trouvés (je n'ai rien corrigé dans `src/`)
1. **Bande collante des points restée après rattachement** : à l'état « rattaché » (`attached`, page vide en dessous), la bande « 1 · Payé le · y aller » reste affichée alors que plus rien n'est à régler et que « y aller » ne mène à rien. Scénario : doc1 lu, « Même achat », « Rattacher le justificatif ». Capture : `final/B/390-04-rattacher-fait.png` (et `final3/B`). Cause probable : `BandeCollante` ne dépend que de `scan?.ok&&statut`, pas de `attached`.
2. **« Drive à connecter » affiché au début de la revue alors que Drive est disponible** (bandeau et pied) : il passe à « Drive prêt » quelques secondes après (`driveOk` recalculé après l'obtention du jeton). Captures : `final/A/390-05-doc5-revue.png` (« Drive à connecter ») puis `…/390-10-doc5-articles.png` (« Drive prêt »). Sans gravité, l'enregistrement a réussi à chaque fois ; à juger par le brasseur (un clignotement d'alerte).
3. Mineur : un `scrollIntoView({block:'start'})` sur la preuve la laisse sous la bande collante (le script contourne). 
4. Déjà présents avant r2b, hors écran : au journal Finances le libellé de la ligne ne mentionne pas le justificatif et le détail ne montre pas la TVA pour doc5 (mêmes constats dans les rapports de JUS-0/JUS-1) ; doc2 (facture hors brasserie) reste refusée à l'enregistrement par « Chaque ligne doit avoir un libellé et un montant ».
Aucun appel Gemini ni réseau réel : les requêtes de Chrome hors localhost (polices, `accounts.google.com`, `identitytoolkit`, `www.google.com`) sont bloquées et comptées ; `aiTask` et Drive restent simulés dans la page ; les Functions n'ont aucune clé.

## Captures ouvertes en image (11)
`temoin/390-04-doc5-revue.png`, `temoin/390-99-arret-etats.png` ; `essai1/390-06-doc5-revue-details.png`, `essai1/390-10-doc5-articles.png`, `essai1/390-11-recu-drive.png` ; `essai2/390-14-doc5-original.png`, `essai2/390-16-doc5-dossier-annuel.png`, `essai2/390-99-arret-finances.png` ; `essai3/1280-05-doc5-revue.png`, `essai3/1280-10-doc5-articles.png`, `essai3/1280-23-rattacher-choix.png`, `essai3/1280-38-doc3-reglement.png` ; `final/A/390-05-doc5-revue.png`, `final/B/390-01-autre-numero-revue.png`, `final/B/390-04-rattacher-fait.png` ; `final3/fix114/390-finances-ecriture.png` (la feuille « Nouvelle dépense » du menu +, état vide).
Ce que j'y ai lu : bandeau fournisseur, date, total, « 26 lignes », barre colorée par lien au stock, tuiles TVA et Règlement, puce « 2 mouture ×5 », lignes du ticket, preuve (« Lecture à confirmer », « Lectures d'accord 3/3 », liens relié, nouveau, mouture, sans stock), reçu Drive et « À revoir : date de paiement supposée gardée · 5 moutures en service », bande collante.

## Essais utilisés
Témoin 1 ; essais d'adaptation 5 (`essai1` à `essai5`, deux arrêtés par la garde mémoire, un par le cas doc1 puis corrigé) ; groupes `final*` : A 2 fois sur la version finale, B 2 fois (un échec trois fois par la garde mémoire), C 2 fois ; fix114 1 fois. Au plus trois essais par critère, sauf les arrêts mémoire, qui ne sont pas des échecs du critère.

## Doutes et limites
- Le rejeu complet en un bloc reste à faire (voir plus haut) ; la mémoire libre de ce poste (partagé) oscille entre 2 et 8 Go.
- Les contrôles ajoutés se fondent sur la lecture rejouée (H13R, H13R-2) ; le message de reçu Drive et le nom rangé viennent du Drive simulé, pas d'un vrai Drive.
- Le témoin n'est pas un HEAD pur (S6 non commitée dans l'arbre).
- Les captures de plus de 390 de large n'ont été ouvertes que pour doc5, rattacher et doc3 : les autres (doc4, hors ligne, doc2, doc1) sont dans `final*` mais ne sont pas toutes vues en image.

DEMANDE EXECUTANT : (facultative, pour la preuve en un bloc)
1. Attendre au moins 6 Go libres (`node -e "console.log(require('os').freemem()/1024**3)"`), aucun émulateur lancé.
2. `node scripts/check-invoice-journey-emulator.mjs --replay work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu.json --out work/missions/2026-10-31-ecran-depense/voies/e-emulateur/complet` ; si « GARDE MÉMOIRE » apparaît, relancer plus tard ou lancer `bash work/missions/2026-10-31-ecran-depense/voies/e-emulateur/rejouer.sh` (groupes, jusqu'à 4 essais ; écrit `final2/` : changer la ligne `OUT=` pour ne pas écraser).
3. Sortie attendue : `EMU-INVOICE-JOURNEY-OK`, `70/70 contrôles du banc OK` (ordre de grandeur), exit 0. Fichiers : `complet/report.json`, `complet/console.log`.
4. Ouvrir en image : `complet/390-05-doc5-revue.png`, `complet/1280-05-doc5-revue.png`, `complet/390-11-recu-drive.png`, `complet/1280-10-doc5-articles.png`.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un banc qui n'exprime ses constats que dans un rapport (`findings`) ne casse jamais : après un changement d'écran, la plupart de ses attentes métier avaient cessé d'être exercées sans que le code de sortie le dise ; chaque attente métier d'un banc de parcours doit être un contrôle qui fait échouer le script.

## Suite du pilote (01.11)
Défauts 1 à 3 corrigés dans `src/` par le pilote : la bande des points n'est plus rendue à l'état rattaché (`ExpenseSheet.tsx`, `!attached`) ; l'état Drive (bandeau « Drive à connecter », pied « Drive prêt / à connecter ») ne se dit qu'une fois le jeton vérifié par `ensureDriveAccessToken` (`driveVerifie`) ; la preuve a `scroll-mt-12` (`Verdict.tsx`). Rejoué : `--widths 390 --cases etats,doc5,rattacher` → `17/17 contrôles du banc OK`, `EMU-INVOICE-JOURNEY-OK` (dossier `pilote-drive/`) ; captures ouvertes : `390-05-doc5-revue` (« Drive prêt » au premier rendu), `390-14-rattacher-fait` (plus de bande). 1014 tests de la dépense et types verts. Défaut 4 (journal Finances, doc2) : hors de cet écran, non traité.
