OK — Escalader passe par Neon ; l'automatique relit par Hydrogen dès qu'un champ manque ; banc mesuré, 0 invention

## Plan (écrit avant le code)
| Où | Avant | Après | Coût par lien (mesuré) |
|---|---|---|---|
| functions/src/lienIA.ts `completerParIA` | Escalader : Hydrogen direct. Auto : Flash-Lite, puis Hydrogen seulement si le prix manque, est retiré ou contredit | Escalader : Neon direct. Auto : Flash-Lite, puis Hydrogen dès qu'un champ manque après Flash-Lite : prix, devise, nom, caractéristiques < 4 mesures (et le texte en écrit plus), frais de port écrits pour la Suisse ; jamais pour la photo ; un champ trouvé n'est jamais remplacé | Flash-Lite ≈ 0,0017 ; Hydrogen ≈ 0,011 ; Neon ≈ 0,017 à 0,028 |
| lienIA.ts `iaUtile` | prix absent/douteux ou < 4 mesures | + nom absent | |
| lienIA.ts `garder` (port) | « gratuit » n'importe où dans le texte | port gratuit ou montant seulement dans un passage qui nomme la Suisse ou aucun autre pays (noms et codes DE AT…) | |
| lienIA.ts `markdownProduit` | tout `nav` retiré | un `nav` retiré seulement si c'est de la navigation (< 400 signes ou > 40 % de liens) | |
| lireLien.ts | option `escalade` | + `regleAvant` (banc seulement) | |
| models.ts / geminiCosts.ts | | `LIEN_NEON_MODEL = 'gemini-4-neon'`, liste blanche ; tarif 3 / 15 USD le million | |
| ai.ts:392 (hors Possède, 2 lignes, doute 1) | `lite` / `fort` | + `neon` | |
| LectureLien.tsx | « en cours · 8 s » | « en cours · 8 s · l’IA la plus fine prend 10 à 15 s » | |
| scripts/banc-liens.ts | | modèle neon, budget CUMULÉ de la voie, p50/p90, `--regle avant`, `--escalade`, `--comparer` | |

## Fichiers écrits
functions/src/lienIA.ts, lireLien.ts, models.ts, geminiCosts.ts, ai.ts (2 lignes) ; scripts/banc-liens.ts ; src/ui/carnets/LectureLien.tsx ; tests/unit/carnetsLiensModeles.test.ts (nouveau, 24 tests) ; tests/unit/carnetsLiensReprise.test.ts et carnetsLecturesLiens.test.ts (attentes alignées sur la règle : `fort` devient `neon` ; une mesure de plus) ; dossier de la voie ; banc-liens/mesures/lm-*.json et banc-liens/ia-reponses/ (cache, nouveaux fichiers) ; 55 lignes au journal IA (`voie: liens-modeles`).

## Critères
- Tests rouge puis vert : `tests-rouge.log` (code d'avant : 13 échecs sur 19) ; `tests.log` : 9 fichiers, 188 tests verts (carnetsLiensModeles, LiensReprise, LecturesLiens, Fix28Serveur, Fix28App, Fix30, Tour25Serveur, EtapesLecture, invoiceScanBudget). Le test du `nav` a été vu rouge au premier essai (fixture hors `<main>`), vert ensuite ; sa cause réelle a été vue sur la vraie page du n° 26 (texte sans « Malzmenge » avant, avec après).
- `npx vitest run tests/unit/proprietes` : 8 fichiers, 76 tests verts (`tests-proprietes.log`).
- tsc fonctions : 0 erreur. tsc racine : 2 erreurs déjà là, étrangères (`seedData.ts` GanttTask, `enregistrerPwa.ts` module `virtual:pwa-register`), aucune neuve.
- Banc 63 liens, règle d'avant (`lm-avant`, réel) contre règle d'après (`lm-apres-final`, réponses payées rejouées) :

| champ | avant | après |
|---|---|---|
| prix | 54/56 | 54/56 |
| nom | 58/63 | 58/63 |
| photo | 56/59 | 56/59 |
| caractéristiques | 38/48 | 41/48 (n° 21, 35, 50 : ? → =) |
| HT dit | 9/9 | 9/9 |
| devise / frais (livraison CH) | 15/23 | 15/23 |
| inventions | 0 | 0 |

  Coût et durée de l'IA par lien (liens où l'IA a parlé) : avant 33 liens, 0,091 CHF, p50 0,0017 CHF / 0,9 s, p90 0,0095 CHF / 4,7 s. Après (mesuré) 32 liens, 0,187 CHF, p50 0,0026 CHF / 1,1 s, p90 0,013 CHF / 5,2 s. Par appel : Flash-Lite p50 0,9 s ; Hydrogen 1,4 à 5,2 s (12 appels), ≈ 0,011 CHF ; Neon 6,3 s et 8,9 s (2 appels), 0,017 et 0,028 CHF.
- Neon sur des liens incomplets : n° 12 (Speidel EN) : 13 caractéristiques lues, caract ? → = (l'automatique ne l'aurait pas relu : 4 mesures déjà lues) ; n° 26 (sios) : « rien de plus à lire » sur l'ancien texte (cause plus bas). Un troisième (n° 39) refusé par le garde-budget (réservation conservatrice 0,08 CHF pour 0,06 restant à l'époque).
- Budget : 0,265 CHF au journal pour la voie (0,30 permis), chaque envoi réservé avant l'appel (garde du banc, réservation conservatrice cumulée), chaque appel au journal. Aucun appel facturé en test unitaire.

## Ce qui n'est PAS mesuré (à dire)
La règle d'après demande 24 relectures Hydrogen sur les 63 liens (comptées à sec) ; 15 ont été payées, 9 refusées faute de budget (n° 10, 11, 13, 15, 29, 53, 55, 56 et un lien dont le texte a changé avec le `nav`). Les chiffres « après » sont donc ceux d'un banc complet sur 54 liens, et pour les 9 autres la lecture reste celle de Flash-Lite. Le coût plein de la règle est ≈ 24 × 0,011 + 33 × 0,0017 = 0,32 CHF le banc complet de 63 liens (0,005 CHF le lien en moyenne, contre 0,0014 avant). Lancer les 9 manquantes : environ 0,10 CHF, voir la décision.

## Les 2 prix et les 4 caractéristiques du banc, un à un (item 4)
Prix (54/56) : les deux manquants sont les n° 24 (jumbo.ch) et 25 (bauhaus.ch) : pages bloquées (Cloudflare), la lecture s'arrête à la page ; ce chemin (url_context) est hors de cette voie et le banc ne le branche pas. Ce n'est pas une règle d'escalade.
Caractéristiques « ? » (7 sur 48 après, pas 4 : le banc d'aujourd'hui n'est pas celui d'ia-9, 44/48 ; ses textes avaient changé, le cache de l'époque ne se rejouait plus) :
- n° 26 sios.ch : vraie cause, corrigée. La description (Malzmenge, matière, volume) est dans un `<nav class="tab-navigation">` (1 081 signes, 3 % de liens) que `markdownProduit` retirait : l'IA, même Hydrogen ou Neon, répondait « rien de plus à lire ». Règle corrigée (densité de liens). Preuve payée : lm-nav, texte neuf, 26 : « Quantité max. de malt 6 kg », « Capacité de brassage 20 l », « Matière rostfreiem inox » lus. La note du banc reste « ? » : sa vérité attend « 20 l (env. 23 l de moût) » et « acier inoxydable » mot pour mot ; la valeur est recopiée telle qu'écrite (allemand).
- n° 1 gastro-held : dimensions lues en trois lignes (Largeur 700 mm, Hauteur 2030 mm, Profondeur 710 mm) contre une vérité « 710 x 700 x 2030 mm » en une ligne ; plage de température absente du tableau. Artefact de forme, pas une perte.
- n° 12 speidels EN : la page écrit deux poids, 19 kg (lu) et 24 kg (vérité) ; Neon rend 13 lignes, la note devient « = ». Ambiguïté de la page, pas une règle.
- n° 36 baldinger, n° 39 hebu : la page se contredit (Cuve 25 l contre Volume 20 l ; 13,5 kg contre 15 kg ; 52 l contre 50 l) ; l'IA copie la valeur du tableau. Pas une règle.
- n° 46 brennecke : vérité « 25 kg (1,84 €/kg) » ; lu « Taille de l'emballage 25 kg » ; le prix au kilo n'est pas une caractéristique. Artefact de la vérité.
- n° 25 : page bloquée (voir prix).

## Défauts trouvés en chemin, corrigés
1. Frais de port : l'IA forte lisait « Versandkostenfreie Lieferung nach DE AT » (n° 47) et « innerhalb DE » (n° 41, déjà vu par Flash-Lite avant) comme une livraison gratuite VERS LA SUISSE. Le banc ne le comptait pas (vérité nulle : neutre), mais c'est une fausse affirmation. `garder` n'accepte plus le port que dans un passage qui nomme la Suisse ou aucun autre pays ; le déclencheur `fraisEcrits` suit la même règle. Effet au banc : n° 41 `gratuit` retiré (étape « douteux ») ; n° 47 plus de port.
2. `nav` de texte retiré (n° 26, ci-dessus).
3. Déclencheur « caractéristiques » : sans le test « le texte écrit plus de mesures que celles lues », Hydrogen aurait relu des pages qui n'ont rien de plus à donner (coût pur).

## Doutes et limites
1. `functions/src/ai.ts` est hors « Possède » : deux lignes (import et choix du modèle `neon`). Sans elles, le bouton Escalader aurait appelé Hydrogen. À déployer avec aiTask (le pilote) ; aucun autre fichier de `ai.ts` touché.
2. Le coût de l'automatique monte : 0,0014 → ≈ 0,005 CHF le lien (×3,5) pour +3 caractéristiques sur 48 mesurées (+6 points). Le gain est réel mais modeste ; il vient d'abord de la mesure « sous 4 », pas de devise/frais (0 gain mesuré).
3. Rendu visuel du libellé « l’IA la plus fine prend 10 à 15 s » : non ouvert dans Chrome (une ligne de texte de la carte d'échec, aucun test ne l'exerce, aucun test existant ne la lit). Validation visuelle non effectuée ; à regarder à la mise en ligne (Carnet, lien mort, Escalader).
4. Neon : seulement 2 appels mesurés (6,3 s et 8,9 s ; 10,7 s au banc des outils) : p50/p90 sur 2 points n'est pas une statistique.
5. Le `nav` : seuils 400 signes et 40 % de liens choisis sur la vraie page sios et une barre de navigation ; non réglés sur un échantillon à part (L20).
6. La règle d'avant reste dans le code (`regleAvant`), pour le banc ; l'app ne la pose jamais.

DÉCISION À PRENDRE : payer les 9 relectures Hydrogen non mesurées (≈ 0,10 CHF) pour clore le banc complet de 63 liens ? Options : oui (mesure complète), ou non et se fier à l'échantillon de 15. Recommandation : oui, avec le budget de la soirée, avant de juger si la règle « caractéristiques sous 4 » vaut ses ×3,5 de coût.

CONNAISSANCE : en Neon, 3 000 jetons d'entrée, 420 à 590 de réflexion et 90 à 280 de sortie : 0,017 à 0,028 CHF l'appel, 6 à 9 s. Hydrogen : 0,011 CHF, 1,4 à 5 s. Flash-Lite : 0,0017 CHF, 0,9 s.
LEÇON PROPOSÉE : un test de règle de livraison sur la seule vérité « nulle » du banc ne voit pas une fausse affirmation (« gratuit » lu pour un autre pays) ; le banc doit compter « port gratuit lu alors que la vérité est nulle » comme suspect.
