# Les 6 variantes sur les 12 cas (25.11 soir) — au repos, sans retouche du dessin

## Comment voir
- `v<n>.html?cas=<cas>&gen=1` : rendu générique depuis `reponses/<cas>.json`. Les cas sont : ecoulement, citra, co2, pilsner, fete, assurance, cave,
  chaudiere, sureau, bouteilles, bar, levure. Un cas qui n'a pas de dessin à la main passe seul en générique, sans `&gen=1`.
- `?cas=ecoulement` et `?cas=citra` sans `&gen=1` : le dessin à la main d'origine, intact (captures `cap/`).
- Captures : `cap12/<v>-<cas>.png`, 72 captures en 390 × 844, DPR 2, au repos. Mesures : `cap12/mesures.json` (mots, débordements, chevauchements, erreurs). Aucune erreur de page sur les 72.

## Les réponses de l'IA (`reponses/`)
- Les 12 réponses sont écrites à la main par le concepteur, au format de `consigne()` (jouable/m4b.html), avant d'avoir vu le rendu. Aucun appel IA.
- 0 citation fausse : un script vérifie que chaque citation, mot, valeur, `quand` et chiffre est un extrait exact de sa ligne.
- Les lignes des 7 cas réels sont celles d'`EXEMPLES` dans m4b.html, c'est-à-dire les messages des fixtures c79 et c75. Les lignes des 5 cas fictifs viennent de `cas-fictifs.json`.
- Citra : la consigne ne reçoit que les lignes, donc deux liens et une note. Les prix et l'α lus sur les pages ne lui parviennent pas. Toute la comparaison vaut donc « ? », sans gagnant. C'est honnête, mais c'est pauvre. Le dessin à la main de `cap/` montrait, lui, les valeurs lues sur les pages.
- `adapt.js` traduit la réponse dans un modèle commun, et chaque variante place ce modèle avec son propre vocabulaire. Ce placement générique est mon choix, voici les règles :
  - pistes par statut ;
  - options avec leur coût seul, comme dans le dessin d'origine ;
  - tâche, échéance (⏳), liste et chiffres ;
  - comparaison : un article par vendeur, et un critère gagné (👑) ou inconnu (?).
- La v5 n'a aucune colonne pour un chiffre : ses chiffres ne sont pas affichés.

## Tableau (OK / limite / cassé)
| cas | v1 carte | v2 tuiles | v3 chemin | v4 feu | v5 kanban | v6 une chose |
|---|---|---|---|---|---|---|
| ecoulement | OK | OK | OK | **cassé** : sans rangée rouge, « Contacter X » (orange) est en face de la lampe rouge | OK | OK |
| citra | OK (que des « ? ») | limite : 2 tuiles « ? » et 👑0 👑0, rien à voir | OK (tableau de « ? ») | **cassé** : « Prix ? » et « Dispo ? » (rouges) en face de la lampe verte ; 2 repères superposés | **cassé** : les noms écrasent la barre du duel | OK |
| co2 | limite : « Raccord changé » devient « 🔧 ? » | limite : idem, tuile 🔧 ? | limite : idem | limite : une jauge pour une seule option inconnue | limite : « Raccord changé » (fait) rangé en À faire ; 1,2 → 0,4 bar perdu | OK |
| pilsner (résolu) | **cassé** : réglé invisible (anneau gris ✓0 ?0) ; 📅 ? 🔄 ? | **cassé** : réglé invisible ; « +4 CHF/sac » déborde de sa tuile | **cassé** : « 3 déc. » dans la station « maintenant », avec halo, alors que c'est réglé | **cassé** : « 3 déc. » (orange) en face de la lampe rouge ; réglé invisible | **cassé** : Fait vide, tout est en À faire | **cassé** : le héros dit « Autre fournisseur, maintenant » pour une chose déjà commandée |
| fete (événement) | **cassé** : 10 branches, des étiquettes se chevauchent | limite : la liste passe sous l'écran ; pas de compte à rebours | limite : chemin de problème (📞, 🛠️) imposé à un événement | **cassé** : la liste orange descend en face de la lampe rouge | **cassé** : budget 1 500 CHF perdu ; 2 colonnes vides | OK (pas de compte à rebours) |
| assurance (échéance) | **cassé** : « Chiffre d'affaires 2026 » coupé au bord | OK | limite : chemin de problème, 🛠️ vide | **cassé** : sans rangée verte, la tâche orange est en face de la lampe verte | limite : 1 colonne sur 3, la liste est coupée en bas | OK |
| cave (liste) | limite : la date « samedi 6 déc. » est perdue ; centre vide | limite : date perdue | limite : date perdue ; 🛠️ vide | **cassé** : tout l'orange est en face de la lampe verte ; date perdue | limite : date perdue ; 1 colonne sur 3 | limite : le héros n'a pas la date |
| chaudiere | limite : 👷 ? ★ et 📅 ? sans titre ; l'urgence est une branche parmi 8 | limite : options sans titre ; la tâche urgente est en bas, coupée | limite : options sans titre | limite : 👷 et 📅 se chevauchent dans le hachuré | limite : options sans titre ; « 10 min » perdu | OK |
| sureau (idée) | **cassé** : les deux façons d'infuser deviennent ♨️ ? et ❄️ ? (un coût inconnu) | **cassé** : idem, avec une barre de coût | **cassé** : idem | **cassé** : jauge de coût pour des façons d'infuser ; « Goûter » (orange) en face de la lampe rouge | **cassé** : idem ; 4.5% perdu | limite : ♨️ ? et ❄️ ? |
| bouteilles (3 offres) | **cassé** : 13 branches, Verallia et Fournisseur B se chevauchent | **cassé** : 53 mots (plus de 30) ; « 0.20/bt » déborde | **cassé** : la grille du duel n'a que 2 colonnes, donc le 3e article décale en-têtes et valeurs ; 34 mots | **cassé** : les repères 0.2, 0.42 et 0.55 se chevauchent (Verallia lu « 0 ») | **cassé** : duel à 3 en texte, sans barre | **cassé** : le héros « Livraison ? » passe devant le vrai choix (quelle offre, avant le 15) |
| bar (client) | limite : « lundi » perdu | limite : « 2 fûts par mois » en très grand sur 3 lignes ; lundi perdu | limite : lundi perdu | OK | limite : 2 fûts/mois, 20 L et lundi perdus | limite : lundi absent du héros |
| levure | OK | limite : « 3e générat » coupé | OK | **cassé** : « Faire un starter » (orange) en face de la lampe rouge | limite : 3e génération et 12 jours perdus | OK |

Bilan (OK / limite / cassé) :

| Variante | OK | limite | cassé |
|---|---|---|---|
| v1 | 3 | 4 | 5 |
| v2 | 2 | 7 | 3 |
| v3 | 3 | 6 | 3 |
| v4 | 1 | 2 | 9 |
| v5 | 1 | 6 | 5 |
| v6 | 7 | 3 | 2 |

## Ce qui casse les 6 variantes, pas une seule
1. **Résolu** : aucune variante n'a de quoi dire « c'est réglé ». Le pilsner se lit partout comme un problème ouvert.
2. **Date d'une tâche** (`tache.quand` : « samedi 6 déc. au matin », « lundi ») : aucune variante ne l'affiche.
3. **Option sans coût** (une façon de faire, une piste de solution) : les 6 montrent une option par son coût seul, hérité du dessin d'origine. « Infuser à froid » devient donc « ❄️ ? ».
4. **Échéance et événement** : aucun compte à rebours, aucun « dans N jours ». L'échéance est une pastille ⏳ parmi les autres, alors que § FRISE-GENERIQUE le demandait.
5. **3 articles** : v3 (grille), v4 (repères) et v5 (barre) sont dessinées pour 2.
6. **Rangée ou colonne vide** :
   - v4 : les lampes ne suivent pas les rangées, donc la couleur ment dès qu'une rangée manque (7 cas sur 12) ;
   - v5 : 2 colonnes vides sur 3 pour un mémo, une liste ou un événement.
