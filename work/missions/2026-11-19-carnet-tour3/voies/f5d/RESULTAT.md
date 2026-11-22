OK — n° 4 à 11 corrigés et commités (29543e2a1, 67e82dbbf) ; carnets 705 verts, tsc vert

Code : port-carnet, branche claude/port-carnet-1711. Commits par chemins, `git show --stat HEAD` vérifié :
- 29543e2a1 (13 chemins) : code f5c n° 5 à 9 (CarnetOuvert, Comparer, Choisir, carnets.css, carnets-decider.css, UpgradeWorkspace),
  tests/unit/carnetsTour3F5c.test.tsx, anciens tests mis au nouveau texte (Critique4Decider, Critique5Decider, Critique6Decider, Critique6Figes, Ecrans, Tour3F4b).
- 67e82dbbf (5 chemins) : Comparer.tsx, ChampCarnet.tsx, LigneRangee.tsx, CarnetOuvert.tsx, tests/unit/carnetsTour3F5d.test.tsx.

| n° | verdict | commit | test | rouge→vert | état à capturer |
|---|---|---|---|---|---|
| 4 | corrige : `useChampPublie` (ChampCarnet) ne défile de la bulle que si la page n'est pas en haut et était en bas | 67e82dbbf | carnetsTour3F5d « n° 4 » | 1 rouge (scrollBy appelé page en haut) → vert ; garde « page en bas » verte | `&ouvrir=ventilation&g8=1`, page en haut, toucher le champ, 390 (titre visible sous la barre) ; puis défiler en bas, toucher le champ (dernière ligne au-dessus de la bulle) |
| 5 | corrige (f5c) : « Façons » sans compte à 1 façon ; « votre phrase en titre » ecarte (greffe5 v04-4, R11) | 29543e2a1 | carnetsTour3F5c ; Critique6Figes 9 mis à jour (pas de « 1 façon », « 2 façons » à 2) | rouge f5c → vert | moulin créé, 390/1280 |
| 6 | corrige (f5c) + f5d : source commune dite une fois (« tient 80 °C, puis le débit · proposé par l'IA ») ; sources mêlées : « (proposé par l'IA) » après le critère de l'IA, sinon les deux cas s'écrivaient pareil ; « classées par … » → « à égalité, le moins cher » | 29543e2a1 | carnetsTour3F5c ; Critique4/5/6Decider, Ecrans R06 ×2 mis à jour | rouge f5c → vert | Comparer Ventilation 390/1280 |
| 7 | corrige (f5c) : « < min. 1 500 » sur une ligne (phrase entière en title et .cn-cache), colonnes `--cn-col` | 29543e2a1 | carnetsTour3F5c ; Critique6Decider 15 mis à jour (title, court, caché) | rouge f5c → vert | Comparer Ventilation 390 clair/sombre, puis défiler à droite (CSS jamais vu au navigateur) |
| 8 | corrige (f5c) : « Critères : tient 80 °C, puis le débit, proposé par l'IA » (Choisir et choisi) | 29543e2a1 | carnetsTour3F5c ; Critique6Decider 2 et 16 mis à jour | rouge f5c → vert | Choisir carte pointillée 390/1280 ; Frigo choisi (« Critères : tenir 2 °C stable en été, puis passe la porte de 80 cm ») |
| 9 | corrige (f5c) : « Payé en entier, au montant prévu » ; noms entiers `cn-nom-entier` | 29543e2a1 | carnetsTour3F5c ; Critique6Decider 12 et Critique6Figes 1 mis à jour | rouge f5c → vert | Réalisés 390 ; Embouteillage réalisé 390 sombre |
| 10 | corrige : `moinsBienQueDe` (Comparer) rend `null` pour une ligne de `tableau()` (porte `moinsBienPartout`) : plus de second calcul | 67e82dbbf | carnetsTour3F5d « n° 10 » (+ garde à débit égal : toujours « moins bien que la 1re ») | 1 rouge (1 au lieu de null) → vert | Pompe, 2 liens collés (pompe-magnetique, pompe-inox) : ligne 2 du tableau et Comparer sans « moins bien que la 1re sur tout », 390/1280 |
| 11 | corrige : « votre lien : « https://… » » pour un lien seul (LigneRangee, CarnetOuvert), « votre phrase » sinon ; l'URL reste citée (L27) | 67e82dbbf | carnetsTour3F5d « n° 11 » (3 cas) | 2 rouges → verts | Pompe, lien collé : sous « Article rangé ici » ; carnet né d'un lien, rouvert |

Anciens tests (étape 1), mis à jour en le disant dans leur commentaire : le texte figé avant f5c (n° 5 à 9), rien d'autre affaibli.
- carnetsTour3F4b « PCN-103 » rouge : pas cassé par ChampCarnet (7160b51e8 ne touche pas carnets-fil.css) ni par f5c. Cause : f5 n° 2
  (1f243127a) a retiré exprès le `-webkit-line-clamp: 2` de la bulle (« bulle G8 entière », test carnetsTour3F5 « n° 2 » : ni line-clamp ni
  ellipsis). Les deux tests se contredisaient ; le code de f5 n° 2 est la correction la plus récente : F4b suit désormais f5 n° 2 (jamais coupée).
- carnetsCritique5Decider (7) « + volant » rouge, absent des listes de f5c : carnets-decider.css et carnets.css en CRLF dans la copie de travail
  (autocrlf), la règle cherchée avec « \n ». Fichiers repassés en LF (contenu Git inchangé), et le test lit la CSS normalisée en LF.

Preuves (ce dossier) : `tests-etape1.txt` (46 fichiers, 698 verts avant commit 1) ; `tests-rouge.txt` (F5d : 4 rouges, raisons attendues) ;
`tests-vert.txt` (F5d, F5b, F4b, F5 : 27 verts) ; `tests-final.txt` (carnets* unit + intégration : 47 fichiers, 705 verts, 1 todo) ;
`tsc.txt` et `tsc-etape1.txt` : tsc sans erreur.
Captures : non prises (VOIE : voie v5) ; états ci-dessus.

Prédiction : il ne remarquera rien de ces lignes, sauf la Pompe : la 2e pompe n'est plus dite « moins bien sur tout » alors qu'elle débite plus, ce qu'il avait vu faux.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : avec core.autocrlf=true, une CSS réécrite passe en CRLF ; un test qui cherche « \n » dans une CSS doit normaliser.
LEÇON PROPOSÉE : deux tests de deux voies qui se contredisent (F4b line-clamp 2, F5 sans line-clamp) : la voie qui change une règle fige l'ancien test le même jour (grep de la règle dans tests/).
