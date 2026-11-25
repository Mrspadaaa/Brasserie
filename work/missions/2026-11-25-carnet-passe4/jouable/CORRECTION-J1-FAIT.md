# Correction J1 — fait (nuit du 25.11)

Contrat : CORRECTION-J1.md. Banc : `node work/missions/2026-11-25-carnet-passe4/jouable/cap.mjs` (390 × 844, DPR 2, Chrome 9222, onglet propre, page.close() puis disconnect()).
Assemblage : `node fragments/build.mjs` (tranches de m4b.html + fragments, sans remplacement de chaîne) ; nouveaux fragments `fragments/j1.js`, `fragments/j1-css.txt`.
Réponses : `node reponses/ecrire.mjs` (19 réponses + 2 relectures « après sa note » : écoulement, levure récoltée).

## Bloquants (8)

| # | Correction (mécanisme générique) | Preuve (geste du banc) | Captures |
|---|---|---|---|
| 1 | Toast lié à son carnet et à sa vue : il meurt à `ouvrir`, `fermer`, changement d'onglet ou de vue ; son Annuler n'agit que si le carnet courant est celui où il est né. | « aucun toast du rangement sur À faire » ; « le toast « Choisi » de Citra n'a pas suivi » (assurance) | 06 → 07, 48 → 49 |
| 2 | `pouce()` : une tâche liée à une option ou un article écarté (`tache.option` de l'IA, sinon même ligne) ou la tâche « choisir/trancher » elle-même cède la place à l'option retenue ; faite → tâche à lui → manque → « ✓ Réglé » ; résolu → « ↺ Rouvrir ». Même règle dans À faire. | toi : « 🛠️ Changer le joint » ; Fait : « ✏️ prix du joint ? Noter » ; frigo : « 🔧 Réparer ≈ 1 déc. » → « ✓ Réglé » → « ↺ Rouvrir » ; citra : « 🛒 Commander · MotlerHops » | 22, 24, 41, 41b, 41c, 48, 08 |
| 3 | Lecture locale des lignes écrites depuis la dernière lecture : « <manque> : valeur » remplit le manque (« ✓ prix du joint : 6 CHF · noté · l'IA relit ») et la case de l'option qui partage son mot (« 6 CHF noté ») ; une ligne qui nomme la tâche avec un participe (« Starter lancé ») la propose faite (« ✓ noté », case pointillée). La relecture IA confirme (case 6 CHF sourcée, manque retiré ; jeton starter ✓, tâche suivante « Ensemencer »). | « tout de suite : case « 6 CHF noté », manque « ✓ prix du joint : 6 CHF noté · l'IA relit » ; après l'IA : « 6 CHF », 0 manque » | 31, 32a, 32, 62, 63 |
| 4 | Hors ligne avec une lecture : l'Organisé reste, bandeau « Hors ligne · 1 note en file · lu 25 nov. 22:51 · l'IA relira au retour du réseau » ; « Ta note a changé » masqué hors ligne. Le geste se joue sur la page où l'IA a lu (avant : page en panne, rien de lu). | « lecture gardée … starter proposé fait ; au retour : jeton starter ✓, pouce « 🧫 Ensemencer » » | 62, 63 |
| 5 | Comparaison : besoin lu dans « Pour 600 » ; une offre « ≤ 400 » ne couvre pas (cellule rouge, jamais couronnée) ; couronne seulement si le total de l'offre est sûr ; couronne du total = seul total complet plus bas que tous (410 CHF) ; « 504 CHF + 🚚 ? » ; variété (arômes, origine) une fois au-dessus (« 🧬 🍋🥭🌴 🇺🇸 ») ; prix ambigu « 3,72 € ? » en pointillé ; virgule décimale. Validation : `comparaison.variete` vérifiée sur les pages, « ? » final permis. | « couronne : « 👑 410 CHF » ; 504 CHF + 🚚 ? ; 1 offre qui ne couvre pas 600 » ; citra « 3,72 € ? », variété au-dessus | org-600, org-citra, 47, 48 |
| 6 | Une attention dont la citation colle deux phrases (`fût.EST`) n'est jamais posée en tête (ni sous un article) ; la ligne reste dans Mes notes. | « aucune carte « fût.EST » ; tête : p4-chf ; ligne gardée dans Mes notes » | org-odeur |
| 7 | Quand la vue laisse > 110 px vides, les visuels grandissent d'un facteur 1,15 à 2 (le plus grand qui tient sans défiler), sans un mot de plus ; deux mesures de même unité deviennent une courbe (CO2 1,2 → 0,4 bar). « + » devient un rond au bout de la rangée. | vide médian 94 px (avant : 35 à 60 % de l'écran, juges) ; reste > 200 px sur 3 cas courts : bar 226, cave 239, embouteillage 332 | org-* |
| 8 | Période : « auj. » sous le repère à gauche, date de début alignée sur le début de la barre, mois sous la barre quand elle est grande. | « repère auj. à 26 px, début de la barre à 269 px, date de début finit à 269 px » | org-embouteillage |

## Mineurs traités
- Cités par les trois juges : légende au toucher des icônes muettes (`data-leg` : 🧠, ✓, 👀, ?, ⊕ critères, jauge, ✦ conseillé, creux « avec l'IA ») ; À faire : graduations par mois (janv., févr.) et bulles qui ne se chevauchent plus (étage au-dessus) ; coût de l'IA : « ✦ 1 appel à l'IA » (Aide), « · ✦ 1 appel » (Relire, Question) ; tuile « + » jamais seule sur une ligne ; citation d'attention alignée à gauche (chaudière).
- Aussi : « check » → « vérifier » ; 👍 / 🤔 gardent l'état choisi ; CO2 dans l'ordre des dates ; « 10–15 % », « 0,42/bt », « 4,5 % » (liste et Organisé) ; pas de toast « Ajouté » quand sa note a déjà rempli une case ; α écrit en tête de ligne.

## Non traités (mineurs propres à un juge)
Toasts posés sur la dernière ligne de contenu (5 s) ; « 10 min » comme chiffre clé de la chaudière ; ❄️ pour « neuf » ; « Décidé » sans décision visible (CO2, soufre) ; jauge citra qui change de total quand on écarte ; feuille Ranger en vrac ; « pas trouvé » sans sujet.
