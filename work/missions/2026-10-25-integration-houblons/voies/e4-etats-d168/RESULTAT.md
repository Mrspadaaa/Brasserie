OK — 9 états mis à jour (noms de sources, D168), 0 SUSPECT ; controle-etats 138/138 sur la copie propre

Attention au mot « OK » : le classement repose sur une comparaison de textes lus, faite par moi ; les points douteux sont listés plus bas (réécritures de phrases, sigles d'études).

## Fichiers écrits
- `work/refonte-frontend/v4/choix/etats/fiche.json` (3 états : ouverte, appui-long-citra, styles)
- `work/refonte-frontend/v4/choix/etats/acquis.json` (3 états : fiche-g1, fiche-citra-cryo, vraies-valeurs-v1)
- `work/refonte-frontend/v4/choix/etats/comparer.json` (1 état : comp-chimie)
- `work/refonte-frontend/v4/choix/etats/substituer.json` (2 états : subst-huiles, subst-lire)
- `work/missions/2026-10-25-integration-houblons/voies/e4-etats-d168/RESULTAT.md` (ce fichier)
- Rien commité. Copie propre `C:/Users/mrspa/AppData/Local/Temp/deploy-63130965` : JSON restaurés par `git checkout`, `status` vide, HEAD 6e368cbd ; fichier temporaire `controle-etats-dump.mjs` retiré.

## Méthode (preuve)
1. Rejeu sur 6e368cbd (copie propre) : `ETATS ECHEC (9/138)`, mêmes 9 états que le journal (sortie : `…/scratchpad/ctl-avant.txt`).
2. Base de comparaison : 6e3eda3e, parent de s2 (5c973070), archivé hors dépôt et construit à part (`construire.mjs --sortie=…parcours-base`). Avec les JSON courants : `ETATS OK (138/138)` (`…/scratchpad/ctl-base.txt`). Les 15 fichiers de `src/` qui diffèrent entre 6e3eda3e et 6e368cbd sont ceux de s2 : les 9 échecs viennent de s2 seul.
3. Texte lu après le geste, pour chacun des 9 états, avant (6e3eda3e) et après (6e368cbd) : `…/scratchpad/dump-base/<id>.txt` et `…/scratchpad/dump/<id>.txt`. Diff ligne à ligne, les valeurs (nombres, unités) comparées une à une.
- Ne pas comparer aux `textes/` de la voie e3 : ils datent d'avant s1/t1 et donnent de faux écarts (« grapefruit zest », « 48–59 », « fresh crushed herbs »).

## Tableau des 9 états
| État | Ce qui diffère (pré-s2 → 6e368cbd) | Décision | Attendu neuf (ancien gardé en `choisie`) |
|---|---|---|---|
| etat-fiche-ouverte | « Acides alpha 11–14 % (Hopsteiner 2025) » → « Acides alpha 11–14 % » ; listes de noms (« Beer Maverick, Hopsteiner, Yakima Valley Hops ») → « dit par 3 fiches » (même nombre de noms) ; « Hopsteiner le range » → « une fiche le range ». 20 lignes, aucune valeur changée. | Mis à jour (conséquence D168) | « Hopsteiner 2025 » → « 11–14 % » |
| etat-fiche-appui-long-citra | Mêmes 20 lignes que ci-dessus, plus « fournisseur : Crosby Hops, Citra — Crosby Hops » → « attesté par un fournisseur » (choix de s2) ; « (Beer Maverick 2023) » retiré de l'α (« 10–15 % »). | Mis à jour | « Beer Maverick » → « 10–15 % » |
| etat-fiche-styles | Ligne « Crosby Hops, Nugget — Crosby Hops » (source du style) retirée, avec sa ligne vide ; plus les mêmes 20 lignes que ci-dessus. | Mis à jour | « Crosby Hops » → « Session IPA » (style déjà listé) |
| etat-comp-chimie | Sigles et légende des sources retirés : rangées « BM HS BH… » sous les valeurs, « H11 · à confirmer » → « à confirmer », « E03 · … », « H12 · … », légende « BH BarthHaas… » retirée, « (Beer Maverick) » retiré des valeurs, noms retirés des listes (« pamplemousse : Beer Maverick, … ; aussi chez… » → « pamplemousse ; aussi chez… »). Chiffres identiques. | Mis à jour | « BM » → « mL/100 g » |
| etat-acquis-fiche-g1 | Identique à etat-fiche-ouverte (texte lu identique, vérifié). | Mis à jour | « Hopsteiner 2025 » → « 11–14 % » |
| etat-acquis-fiche-citra-cryo | Identique à etat-fiche-appui-long-citra (texte lu identique, vérifié). | Mis à jour | « Beer Maverick » → « 10–15 % » |
| etat-acquis-vraies-valeurs-v1 | Identique à etat-comp-chimie (texte lu identique, vérifié). | Mis à jour | « BM » → « mL/100 g » |
| etat-subst-huiles | Chaque « Beer Maverick, Hopsteiner : 9,5–16 » → « 9,5–16 · 2 sources d'accord » (ou valeur seule si une source) ; « Farnésène publié par Beer Maverick, non importé » → « Farnésène publié, non importé » ; « (Beer Maverick, Hopsteiner, dépôt) » et « (Crosby Hops) » retirés ; « leurs noms au survol » → « leurs noms sont dans la section Sources de la fiche ». Les 152 lignes de diff ont été lues : toutes les valeurs (α, β, huiles, dose) sont identiques, seul le compte de sources change. | Mis à jour | « Farnésène publié par Beer Maverick, non importé » → « Farnésène publié, non importé » |
| etat-subst-lire | Même diff que etat-subst-huiles (152 lignes, identique), plus « pas les scores de substitution de Beer Maverick (non importés) » → « pas des scores de substitution déjà publiés (non importés) ». | Mis à jour, à lire (réécriture) | « pas les scores de substitution de Beer Maverick » → « pas des scores de substitution déjà publiés » |

Aucun état SUSPECT : pour les 9, aucune valeur, aucun bloc perdu hors sources, aucun mot de sens sans lien direct avec un nom retiré.

## Sortie finale de controle-etats (copie propre, JSON modifiés copiés puis restaurés)
- Construite (6e368cbd + JSON modifiés) : `ETATS OK (138/138) ; 15 voulu(s) non rejoué(s) ; 1 en attente de son choix : etat-dryh-avant-inconnu (…)`. Sortie : `…/scratchpad/ctl-apres.txt`.
- Témoin `--choisie` sur les 4 écrans modifiés, dans le dépôt de travail (la copie propre n'a pas les pages choisies, voir plus bas) : fiche `ETATS OK (16/16)`, acquis `ETATS OK (24/24) ; 2 voulu(s)`, comparer `ETATS OK (16/16) ; 3 voulu(s)`, substituer `ETATS OK (14/14) ; 1 voulu(s)`.

## Ce qui reste douteux
- Réécritures de phrase, sens voisin : « pas des scores de substitution déjà publiés » (subst-lire), « une fiche le range » (fiche), « attesté par un fournisseur » (s2), « leurs noms sont dans la section Sources de la fiche » (subst-huiles). Le pilote doit les lire.
- Comparer : s2 retire aussi les études H11 (Schmidt 2024), H12 (Kishimoto 2008) et E03 (McCabe 2023) à côté des valeurs, alors que H22 et H77 restent dans la rangée OSU. Cohérence à trancher par le pilote ; je n'ai pas tranché.
- Les remplacements d'attendu (« 11–14 % », « 10–15 % », « mL/100 g », « Session IPA », « déjà publiés ») sont mes choix : ce sont des mots présents dans le texte actuel qui gardent le sens du contrôle. « mL/100 g » est le plus faible (c'était un sigle de source).
- Copie propre : `--choisie` y échoue (81/138 « page choisie absente ») parce que les pages des maquettes choisies ne sont pas suivies par git. Ce n'est pas une régression liée aux JSON ; le témoin a été lancé dans le dépôt de travail.
- Rappel du hook cerveau avant tout commit : `node scripts/agents/systeme.mjs appels <fichier> --rejouer` (comparer.json, substituer.json). Non lancé : rien commité.

CONNAISSANCE : `controle-etats --choisie` exige les pages choisies (`work/refonte-frontend/v4/ecran-1/…`), absentes de la copie propre de déploiement : le témoin se lance dans le dépôt de travail.
LEÇON PROPOSÉE : pour dire ce qu'une voie a changé dans un texte lu, comparer au commit juste avant la voie (construit à part), pas à une archive de textes d'une date antérieure à d'autres voies : les textes e3 (avant s1/t1) donnaient 3 faux écarts de plus (traduction, valeurs) sur les 9 états.
