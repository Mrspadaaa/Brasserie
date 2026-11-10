OK — PDF de facture 12,3 Mo → 199 Ko, QR relu par zxing ; 8 constats : 8 corrigés (2 en partie), 0 refusé

## Le bloquant (constat 1)
Problème type : image raster non compressée dans jsPDF. `addImage` range le PNG en pixels bruts par défaut (`'NONE'`) : 2 480 × 1 240 × 3 = 9,2 Mo, soit 12,3 Mo en base64 (mesuré : 12 307 847 caractères). Le PNG du QR ne pesait que 390 Ko.
Méthode standard retenue : compression Flate par jsPDF (`addImage(..., 'FAST')`). Aucune dépendance neuve ; le QR reste à 300 ppp (module de 9,5 px), sans perte. Variante vectorielle écartée : la section SIX contient aussi du texte (rendu par le navigateur), il faudrait réécrire sa mise en page à la main.
`compress: true` (flux de page) essayé puis retiré : il casse les tests qui lisent le texte du PDF (`financeInvoice`), et la page pèse 1 Ko.

## Un constat, une ligne
1. **Corrigé** — `swissQrBill.ts` : image compressée. Chrome réel : PDF **199 498 octets** (266 051 caractères en dataUrl, plafond 5 600 000). « Facturer 180,00 CHF » enregistre : « Facture FAC-2026-0001 enregistrée 180,00 CHF » aux 4 configurations (`captures/*-e-emission-*`, `*-f-nouvelle`).
2. **Corrigé** — `enregistrerVente.ts` : tout échec du PDF dit « La facture (ou la quittance) n’a pas pu être produite (PDF trop lourd ou illisible). Rien n’est enregistré : réessaie… ». Plus le mot « justificatif ».
3. **Corrigé en partie** — `Caisse.tsx` : sans vente notée par la caisse, la jauge n’affiche plus « 0,0/27 » mais « 27 L nets », barre hachurée (le style « inconnu » de la maquette), infobulle « les ventes d’avant ne sont pas comptées ». Dès qu’une vente est notée : « 12,4/27 L nets » comme la maquette. Le vrai restant d’un brassin déjà vendu avant la caisse n’existe dans aucune donnée (voir DÉCISION).
4. **Corrigé** — Échap ou × avec un panier plein : bande « Le panier (2 lignes) sera perdu. Ferme encore pour l’abandonner. » collée en haut de la caisse (visible depuis le ×) ; le second appui ferme ; un changement du panier réarme ; panier vide : ferme sans avertir.
5. **Corrigé** — l’annexe « quittance » ne dit plus « une ligne » : « 24 × Pale Ale · 33 cl · 6 × Pale Ale · 75 cl » + total. Elle reste fidèle au PDF réellement imprimé (qui porte un résumé : `ReceiptService`, hors Possède).
6. **Corrigé** — `initiales()` ignore les particules (du, de, la, d’, l’…) : Café du Bourg → **CB**, Martin Rey → MR.
7. **Corrigé** — `caisse.css` : l’en-tête de l’annexe passe à la ligne sans couper « n° … · date » (bloc de gauche insécable, nom de la brasserie à droite, ou dessous si trop long). Vu à 390 : « n° FAC-2026-0001 · 9 nov. 2026 » sur une ligne, « Brasserie · Démonstration » sur la sienne.
8. **Corrigé** — la caisse seule (Clients › Facturer) a l’en-tête de `+ › Vendre` : étincelle, « Vendre », × plat, mêmes classes ; le test compare les deux.

Aucun constat « refusé : maquette » : les 8 touchent des détails que sa maquette ne montre pas ou montre comme je l’ai repris (CB, jauge 12,4/27).

## Fichiers écrits
`src/services/swissQrBill.ts`, `src/ui/vente/Caisse.tsx`, `caisse.css`, `enregistrerVente.ts` ; `tests/unit/factureQr.test.ts` (+ test 20b), `tests/integration/caisseVente.test.tsx` (+ 8 tests « Constats du test d’écran ») ; `voies/vx/` : `mesure-pdf.mjs`, `mesure-pdf.txt`, `facture-chrome.pdf` (IBAN d’exemple SIX), `capturer-vx.mjs`, `captures/` (36 captures + journaux), `tests*.txt`, `tsc.txt`.

## Sorties décisives
- **Poids et lecture du QR** (`mesure-pdf.txt`, Chrome réel, vrai rasteriseur) : `POIDS pdfOctets 199498` ; l’image extraite du PDF (Flate, prédicteur PNG) décodée par zxing-wasm (présent dans node_modules, utilisé hors app) : `DECODE n 1, valide true`, `SPC / 0200 / CH44…`, montant `180.00`, référence `000000000000000000202600013` = celle attendue.
- **Test 20b** (Node, sans canvas) : un rasteriseur de test (rectangles du SVG de swissqrbill + bruit en guise de texte) à 300 ppp ; PDF 219 Ko < 300 Ko ; pixels extraits du PDF **identiques** au PNG envoyé ; **chaque module du QR** (≈ 3 170 cellules hors croix) noir ou blanc comme la matrice. **Rouge sans compression** : `tests-rouge.txt` → 9 230 916 octets. Rouge des 7 autres tests sur le code de HEAD : `tests-rouge-constats.txt` → 7 échecs (4b passe, c’est un garde-fou).
- **Tests** (`tests.txt`, 4 fichiers) : 85 verts, 1 échec : `caisseVente › Clients › fiche › Facturer`, « Failed to resolve import ./prix/prix.css from src/ui/TarifSheet.tsx » : fichier d’une autre voie (Prix) pas encore écrit, sans rapport. Appelants (`tests-appelants.txt`, 23 fichiers) : tout vert sauf `financeInvoice` avec `compress: true`, corrigé en retirant cette option (rejoué : 65 verts sur `financeInvoice`, `factureQr`, `caisseVente`).
- `npx tsc --noEmit` : 2 erreurs `firebase-admin` (environnement) + `src/ui/prix/PrixEcran.tsx(48)` (autre voie). Aucune dans mes fichiers.
- **Captures** (clair, cave × 390 tactile ×2, 1280 ; `?dev-local&finance-demo` ; `{"manques":[],"erreurs":[],"n":9/27}`) ouvertes : clair-390 a-panier-haut, d-echap-avertissement, g-clients-facturer, c-quittance-bas ; cave-390 a-panier-bas ; cave-1280 e-emission-haut. Vu : CB, jauge hachurée, en-tête étincelle, bande d’avertissement, annexe sur une ligne, facture enregistrée, QR réel. Les autres (clair-1280, cave-390 reste) sont prises sans erreur, non toutes ouvertes.

## Essais utilisés
Poids : 1 correctif (retrait de `compress: true`). Test 20b : 3 réglages du « bruit » (trop lourd) puis du seuil de cellules. Aucun critère à 3 essais.

## Doutes et limites
- La bande d’avertissement du panier (sticky) recouvre un peu les tuiles quand la caisse est défilée (capture c-quittance) : lisible, mais à juger.
- Lecture par l’application bancaire d’un téléphone : non testée (geste du pilote). Décodage zxing du PNG du PDF : fait.
- Rendu PDF sur iOS non vu ; `Facture enregistrée → Envoyer le PDF` non rejoué (partage Web Share).
- Un brassin conditionné après sa vente hors caisse garde une jauge partielle dès la première vente notée ; seule la mention « notés depuis la caisse » (infobulle) l’explique.
- Besoin hors Possède (ClientsTab, autre voie) : aucun.

## DÉCISION À PRENDRE
- **Jauge = litres vendus ou litres restants ?** Aujourd’hui (maquette) : vendus notés / nets. Pour un restant exact il faudrait la source de vérité des ventes d’avant la caisse (stock de bouteilles/fûts du brassin). Reco : garder la maquette ; décision du pilote si le brasseur veut le restant.
- **Quittance détaillée** (reprise de uv) : `ReceiptService` ne porte pas les lignes ; reco : l’adapter plus tard, puis détailler l’annexe.

CONNAISSANCE : jsPDF `addImage` sans compression stocke les pixels bruts (`'NONE'`) : un PNG de 2 480 × 1 240 pèse 9,2 Mo dans le PDF ; `'FAST'` le ramène à ~200 Ko sans perte. `zxing-wasm` est dans node_modules sans être une dépendance de l’app : utilisable pour un contrôle manuel, pas dans un test.
LEÇON PROPOSÉE : un test de poids d’un document généré doit tourner avec le vrai rasteriseur (Chrome) au moins une fois : jsdom/Node avec un PNG factice (1 500 caractères) laissait passer un PDF de 12 Mo ; mesurer le livrable, pas seulement son format.
