OK — jouable passe 4 : 20/20 Organisé ≤ 30 mots, gestes 19/19, 60 captures ouvertes

Fichiers (tous dans work/missions/2026-11-25-carnet-passe4/jouable/) :
- p4.html (assemblé par fragments/build.mjs ; les fragments vivent désormais dans fragments/, plus dans le scratchpad)
- fragments/organise.js, fragments/liste.js, fragments/css.txt (reprise : passe « mots »)
- reponses/ecrire.mjs → 19 réponses JSON + index.json (textes raccourcis : chiffres et icônes à la place des mots)
- cap.mjs (sélecteurs par aria-label pour ✓, 👍, Retenir), cap/ (60 captures 390 × 844), cap/resultats.json
- CAS.md (cas → avant / après / problème → corrigé / capture)

Sorties décisives (dernier passage de cap.mjs) :
- GESTES 19/19 · ERREURS PAGE 0 · build : collision 0, doublons 0
- Mots au premier écran d'Organisé : max 30 (règle ORGANISE-TROP-TEXTUEL ≤ 30) ; avant la reprise : 12 cas au-dessus, jusqu'à 81
- Liste : 14 lignes entières, 82 % de la hauteur
- Chaudière : 1 fausse (« technicien appelé ») = l'erreur voulue de l'IA, coupée dans « Changé par l'IA »

| Cas | Mots | Première info utile (px sous la barre) |
|---|---:|---:|
| assurance à renouveler | 28 | 52 |
| CO2 qui baisse vite dans un fût | 25 | 52 |
| écoulement qui fuit | 26 | 52 |
| fête de la bière en juin | 29 | 52 |
| frigo de garde en panne | 30 | 52 |
| inspection électrique, fusible | 26 | 52 |
| levure lente à démarrer | 30 | 52 |
| malt pilsner en rupture chez le fournisseur | 29 | 52 |
| odeur de soufre dans un lot | 29 | 52 |
| pompe qui chauffe | 24 | 52 |
| ranger la cave | 22 | 85 |
| trop de vapeur au brassage | 24 | 52 |
| Embouteillage — station complète (2027) | 16 | 52 |
| Houblons citra | 28 | 52 |
| Chaudière en panne jour de brassage | 27 | 52 |
| Idée bière au sureau | 24 | 52 |
| 600 bouteilles 33 cl | 30 | 52 |
| Bar du Centre veut nos bières | 23 | 52 |
| Levure récoltée à tester | 26 | 52 |
| IA en erreur (écoulement) | 29 | 52 |

Mécanismes de la passe « mots » (génériques, pas au cas par cas) :
- état d'achat : un mot (« comparé ») et trois points au lieu de « comparé › choisi › commandé » ;
- « ✦ n » en pastille au lieu de « ✦ n à garder » (le détail dans l'aria et la feuille Changé par l'IA) ;
- jauge d'achat « ✓ 9 ▮▮▮ ? 3 » ; « choisir » → ✓ (avec ✕) ; « à relire » → 👀 hachuré ; formules de calcul et écart à un toucher (🧮, pointillé, toast) ;
- attention posée sous l'article qu'elle concerne (« 🧽 à laver » sous Occasion) ;
- relecture : 🧠 → ✓ en icônes, « Bon choix ? » 👍 / 🤔 ; pas de rangée de jetons vide sur une relecture ;
- décider : l'échéance de la tâche vit dans le duo « Retenir · ⏳ avant décembre » (🔧 / ❄️) ; la tâche n'est plus répétée au pouce ni dans À faire ;
- sans IA : « ✏️ 5 notes gardées » (le texte reste dans Mes notes), « Lu sans IA », une case en creux.

Captures : work/missions/2026-11-25-carnet-passe4/jouable/cap/ (org-*-1.png par cas ; 01 à 63 pour les gestes). Toutes ouvertes après le dernier passage ou, pour celles qu'il n'a pas changées, au passage précédent au même code.

Prédiction : « Là je lis en 3 secondes ; les chiffres et les icônes parlent, il manque juste que le toast ne traîne pas d'un carnet à l'autre. »

DÉCISION À PRENDRE : aucune (le pilote publie ; capacités : sample, dictation, db rules journal admin/admin).

CONNAISSANCE : le plancher de mots d'Organisé est fixé par la barre du bas (Ajouter, Aide, Mes notes, Organisé = 5) et la puce d'état (1 à 2) ; il reste ~23 mots au contenu.

LEÇON PROPOSÉE : un plafond de mots se tient par des mécanismes génériques (étape en points, calcul à un toucher, attention posée sur son objet, échéance absorbée par le geste) plutôt qu'en rognant les réponses cas par cas ; vérifier ensuite que rien de ce qui est retiré ne laisse un vide (rangée de jetons « + » seule, tâche fantôme après décision).
