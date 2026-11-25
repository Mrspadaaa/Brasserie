OK — 12 problèmes, 6 bloquants

RESULTAT critique-67 : 12 problèmes (B 6, m 6, D 0) — corrigés rejoués 0/8 (C66 non rejoués : plafond de tours atteint avant le carnet houblons) — carnet identique oui — BUGS OK

Version : index-BVBC77LE.js (curl ?nocache ; l'onglet servait encore Rj9Pjhxu, amené par `maj.mjs`, `maj.log`). DOSSIER prime sur VOIE (SSQ_J86L).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2321 bugs, 540 ouverts, 202 sources).
Couvert : clair, 390 × 844, deviceScaleFactor 2, au toucher (CDP), Chrome 9222, mon onglet seul. Port D451 : **écarts 7** (C67-1, 2, 3, 5, 10, 11, 12).

## À savoir d'abord (pilote)
- **Relevé avant / après identique** (avant.json, apres.json) :
  - Synthèse 0,00 / 265,40, caisse et départ 1 145,00, Opérations, Mon mois, HABITUELS, à dépenser −463 (S53), cadre, période (localStorage 23.11 → 03.01), les 16 barres.
  - Chambre froide : corps et 3 documents (837/9373/947). Houblons citra : corps.
  - Cache : 6 entrées neuves, toutes des suppressions à moi (CARNET-ec10d344, 4 MSG, PLAN-CARNET-…ec10d344). Carnets 32 avant et après.
- **Mon carnet c67 a été supprimé « avec son plan »** : À venir est revenu à 11, et le Calendrier n'a plus de c67. Il avait créé un achat dans À venir (C67-6).
- **Coût IA ≈ 0,008 CHF** : 4 appels aiTask, 4 lignes au journal.
- **Non couvert (plafond de 100 tours)** :
  - le carnet houblons (2 liens Citra, prix, Comparer, Choisir 1 kg, Retirer puis Annuler), donc **le rejeu de C66-1 à C66-8 n'est pas fait** ;
  - la photo seule (À ranger), le mémo, l'usage neuf ;
  - le 1280 et le sombre.
  - À relancer dans une voie critique-67b, avec le même outillage (`pas.mjs`, `liste.mjs`, `etat.mjs`, `supp.mjs`).
- Lignes C61, C59-6, C59-8, LE-1, BD-1, PX : non touchées, rien de neuf vu contre elles.
- Ses données, en lecture seule (pas à moi) : la Chambre froide montre toujours le lien en clair (ggmgastro…), le tableau « rang · article · CHF », et une note « ZZ TEST — M3 — cellule de garde » laissée par une ronde antérieure.

## Combien et quels problèmes ? 12
1. **B — C67-1** — Liste Carnets (E-liste contre v01-liste) : les problèmes de l'arbre n'ont que leur titre (ni jauge, ni état, ni dernier pas). Les carnets ne sont pas repliés par sous-domaine. La double rangée d'onglets est restée (D451, « Ce qui disparaît » 1 et 2). Il manque des éléments de sa maquette.
   - « Je vois pas où en est chaque problème. »
2. **B — C67-2** — Saisie rapide (S3-0 contre v01-saisie) :
   - la phrase entière sert de titre (« votre phrase en titre ») ;
   - la carte dit « Local » alors que c'est le brassage, sans sous-catégorie ;
   - elle dit « nouveau carnet · idée » au lieu de « nouveau problème · Je cherche » ;
   - aucune tâche n'est proposée.
   - Valeur fausse, et des éléments de sa maquette manquent.
   - « La vapeur au brassage, c'est pas le local, et c'est pas une idée. »
3. **B — C67-3** — ··· › Problème : le bandeau dit « Genre posé », mais l'écran reste celui de l'idée (Articles, Notes, Quand). Le suivi n'apparaît qu'en sortant puis en revenant (S6-0, S7-1). Le geste ne montre aucun effet.
   - « J'ai mis problème, il me dit toujours idée. »
4. **B — C67-4** — Le problème affiche « ≈ 1 230 CHF » : c'est la somme de deux condenseurs alternatifs, 690 et 540 (S11, S17-2). Valeur fausse.
   - « J'en achète un, pas les deux. »
5. **B — C67-5** — Résolu (S19-0 contre v01-resolu) : aucune option fermée ni sa raison. « Rangé : Brasserie » n'a pas de sous-catégorie, et « ira dans Réalisés » manque. L'onglet Réalisés reste à 0 avec 6 résolus. Il manque des éléments de sa maquette.
   - « Qu'est-ce que j'avais essayé, déjà ? »
6. **B — C67-6** — La tâche « Voir avec l'électricien », datée Fin du mois, crée un achat c67 dans À venir (11 → 12) et au Calendrier, « proposé, 23 nov., S48 » (F1-0, F1.txt). Un coup de fil devient un achat, et la date est fausse. Valeur fausse dans ses finances.
   - « Appeler l'électricien, c'est pas un achat. »
7. **m — C67-7** — La hotte, écartée avec sa raison, n'affiche cette raison nulle part (S17-2). Une fois la hotte retenue, la raison de l'écart s'affiche en pastille verte sous l'option retenue (S18-1).
   - « Il me met la raison du non comme raison du oui. »
8. **m — C67-8** — Les phrases sur les condenseurs A et B deviennent des articles, pas des options :
   - elles portent « lu sur la page : nom, prix » alors qu'il n'y a pas de page (S10-0) ;
   - B, hors stock, est classé 1er en vert, et Comparer dit « la 1re, la moins chère » (S13-0, S16-0).
   - « Il est plus en stock, pourquoi il est premier ? »
9. **m — C67-9** — Après un seul toucher sur Veille, la bulle « veille demandée · Hotte… · pas encore relevée » apparaît deux fois dans le fil (S18).
10. **m — C67-10** — Relecture (S20-0 contre v01-relecture) : pas de ligne « essayé », et « problème » recopie le titre. La catégorie n'a pas de sous-catégorie. « Retour à la liste » ne ramène pas au problème.
11. **m — C67-11** — À faire (S27-0 contre v01-afaire) :
    - aucune ligne ne porte son coût (Hotte recyclage, budget 200 CHF) ;
    - « Cette semaine 9 » mélange des achats passés, de S35 à S39 ;
    - l'appui long pour dater ne s'ouvre pas au toucher (1,6 s), seulement à la souris (S31-0). Sur un vrai téléphone, c'est à confirmer.
12. **m — C67-12** — Le menu du domaine ne propose que Local, Brasserie, Meuble, Outils et Papiers, sans sous-domaine (S8-0).

Bloquants : 6.
- Geste sans effet : n° 3.
- Valeurs fausses : n° 2, 4 et 6.
- Éléments de sa maquette absents : n° 1, 2 et 5.

### Doutes (non comptés)
1. La jauge en tête (●○○○) ne réagit pas au toucher ; l'état se change avec les mots.
2. La carte d'arrivée propose « Y ajouter en façon » vers un carnet ZZ d'une autre ronde. Le mot « façon » lui sera obscur.
3. Dialogue de suppression : toucher « Supprimer » avant de choisir « avec son plan » ne fait rien et ne dit rien.
4. Relecture : deux champs « Chercher dans les résolus », en haut et en bas.

### Conforme à la maquette (vu)
- Le coup d'œil en 4 cases, et les filtres Arbre / À faire / veille.
- La jauge et les états Noté → Je cherche → Décidé → Résolu → Rouvrir (« rouvert · Décidé » dans le fil).
- Les options piste, veille, écartée avec sa raison, et retenue.
- La tâche proposée, avec À faire et Plus tard.
- La question honnête « Pourquoi … ? Tes notes ne le disent pas » (greffe 3).
- Les tuiles de Résolu, « 6 · le dernier en vert ».
- La Relecture et « Toujours le bon choix ? ».
- La feuille Quand (à la souris).

## Table (captures 390 ouvertes : E-liste, S1-1, S3-0, S4-1, S7-1, S10-0, S11-1, S13-0, S14-2, S16-0, S17-2, S18-1, S18-2, S19-0, S20-0, S27-0, S31-0, F1-0 ; maquettes v01-liste, v01-saisie, v01-vapeur, v01-resolu, v01-relecture, v01-afaire)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| E-liste | clair | 390 | liste Carnets, arbre | 1 (n° 1) | 1 |
| S1-1, S3-0 | clair | 390 | saisie rapide, rangé pour toi | 1 (n° 2) | 1 |
| S4-1, S6-0, S7-1 | clair | 390 | idée → Problème | 1 (n° 3) | 1 |
| S8-0 | clair | 390 | domaine ▾ | 1 (n° 12) | 0 |
| S10-0, S11, S13-0, S16-0 | clair | 390 | Je cherche, articles, Comparer | 2 (n° 4, 8) | 1 |
| S14-2, S17-2, S18-1, S18-2 | clair | 390 | options : veille, écartée, retenue ; Décidé | 2 (n° 7, 9) | 0 |
| S19-0 | clair | 390 | Résolu | 1 (n° 5) | 1 |
| S20-0 | clair | 390 | Relecture | 1 (n° 10) | 0 |
| S27-0, S31-0, F1-0 | clair | 390 | À faire, Quand, À venir | 2 (n° 6, 11) | 1 |

## DEMANDE EXECUTANT (voie critique-67b, jugement gardé par un critique)
1. Copier l'outillage de ce dossier ; lancer `node maj.mjs`, puis `node etat.mjs avant`.
2. Carnet « ZZ TEST — c67b houblons » : coller les liens Citra motlerhops et brauundrauchshop. Puis prix, Comparer, Choisir 1 kg (garder 1 kg jusqu'à À venir), Retirer un article puis Annuler. Rejouer C66-1 à C66-8.
3. Jouer une photo seule (À ranger, carte « Rattacher à … ? »), un mémo et un usage neuf (ni vapeur ni houblon).
4. Prendre 3 captures à 1280 (liste, problème, Résolu) et 2 en sombre.
5. Supprimer « avec son plan », puis lancer `node etat.mjs apres` et comparer.

LEÇON PROPOSÉE : une voie de test d'écran plafonnée à 100 tours ne couvre pas un DOSSIER à 8 parcours plus un rejeu. Le pilote la coupe en deux voies (parcours du problème ; houblons et rejeu des corrigés), chacune avec son relevé avant / après.
