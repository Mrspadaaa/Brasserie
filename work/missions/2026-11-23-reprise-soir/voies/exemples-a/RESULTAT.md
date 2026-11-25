OK — exemples-a : 16 ZZ refaits (Reclasser 3, gestes 13, recréés 0) ; défauts 11 (B 5) ; données identiques oui

# RESULTAT exemples-a

RESULTAT exemples-a : 11 problèmes (B 5, m 6, D 3) — corrigés rejoués : sans objet (le DOSSIER D454 remplace le rejeu du VOIE) — carnet identique oui — BUGS OK

- Version : paquet servi `index-DyC_sRPc.js` (le VOIE citait index-SSQ_J86L.js : un déploiement plus récent est en ligne). Service worker contourné. 390 × 844, toucher, Chrome de débug 9222, onglet propre, jamais browser.close().
- Tests : sans objet (test d'écran). Registre : `node scripts/agents/controle-bugs.mjs` → `bugs.log` : BUGS OK (2455 bugs, 631 ouverts, 202 sources).
- Garde : chaque geste vérifie le titre du carnet ouvert (« ZZ TEST ») ; hors carnet ZZ, aucun geste qui écrit. Fonctions et IA bloquées sauf aiTask voulu ; écritures Firestore journalisées (`ecritures.log`).
- Relevés avant/après, liste À faire (elle montre ses tâches) et journal des gestes : hors Git (scratchpad de session).
- IA : 3 appels aiTask (soufre, ranger la cave, assurance), estimés 3 × 0,0094 = 0,0282 CHF ≤ 0,10 ; journalisés dans `work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl`.
- Numérotation : les ZZ réels sont Z01–Z04, Z06–Z10, Z13–Z15, Z17, Z19, Z21, Z22 (16). Z05, Z11, Z12, Z16, Z18, Z20, Z23 du relevé avant sont des doublons de lecture de la liste (titre collé à un montant ou à un extrait), pas des carnets : rien à refaire.

## Relevé de ses données (avant 12:52, après 14:00, heure locale)
- Identiques : paquet, « CHF à dépenser » (même valeur, même semaine), période « 6 sem. », 16 barres de la frise hors ZZ (même liste), 32 carnets, 11 À venir.
- Cache Firestore « hors ZZ » : 3 525 → 3 528 documents ; 3 ajoutés et 9 modifiés, tous des messages de carnets ZZ (chacun retrouvé dans `ecritures.log` : Z01, Z02 ×2, Z03 ×2, Z04 ×2, Z06, Z07, Z15, Z21, Z22). Le filtre « hors ZZ » ne voit pas qu'un message appartient à un carnet ZZ ; aucun document à lui n'a bougé.
- Puces qui comptent aussi les ZZ : Réalisés 5 → 8, résolus 5 → 8, décidés 8 → 11, je cherche 7 → 5, notés 0 → 3 (nos ZZ remis en état).
- Données identiques : oui.

## Tableau final (captures 390 ouvertes : cap/Zxx-final.png, Z04-fin2.png, Z15-fin2.png, Z21-fin2.png)
| Carnet ZZ | Chemin | État final | Défauts |
|---|---|---|---|
| Z01 malt pilsner en rupture | Reclasser (piste « Autre fournisseur · +4 CHF le sac », Commandé → fait), puis Problème, Retenir, Résolu | Problème · Résolu, retenu « Autre fournisseur » | EXA-3, EXA-10 |
| Z02 pompe qui chauffe | Reclasser (constat → note, Résolu, idée → problème) | Problème · Résolu (« Fermé : vanne d'entrée à moitié fermée… ») | — |
| Z03 trop de vapeur | gestes : Problème, 2 façons (humidificateur écarté « finalement pas utile », steam condenser retenu), Décidé | Problème · Décidé | EXA-1, EXA-5, EXA-10 |
| Z04 CO2 qui baisse | Reclasser (constat → note, idée → problème), 1 façon, Décidé ; ce tour : façon retenue | Problème · Décidé, façon retenue | EXA-1, EXA-5, EXA-10 |
| Z06 frigo de garde | gestes : critère né d'une phrase retiré, article veille retiré, note égarée supprimée, Problème, Je cherche | Problème · Je cherche (sans façon : la bulle « Technicien… » n'a plus de ⋯) | EXA-2, EXA-4, EXA-6 |
| Z07 levure lente | gestes : 3 critères retirés, Problème, façon, Résolu | Problème · Résolu | EXA-4, EXA-7 |
| Z08 débit faible | gestes : Problème | Problème · Noté | — |
| Z09 fenêtre | gestes : Problème | Problème · Noté | — |
| Z10 fusible | gestes : critère retiré, Problème, Je cherche (lien brewtools gardé en article) | Problème · Je cherche | EXA-4 |
| Z13 écoulement | gestes : article veille retiré, Problème, Je cherche (« Pistes : joint du siphon » sans ⋯) | Problème · Je cherche | EXA-4, EXA-6 |
| Z14 moisissure | gestes : Problème | Problème · Noté | — |
| Z15 assurance | recréation tentée par le champ de la liste (rien créé, EXA-8), renommé, Mémo ; ce tour : tâche « Renouveler l'assurance avant le 31 décembre » (IA, À faire) | Mémo + tâche | EXA-8, EXA-11 |
| Z17 truc à voir | gestes : Idée (fil vide d'origine) | Idée · Quand pas encore daté | — |
| Z19 fête de la bière | gestes : critère et article veille retirés, Idée | Idée · Quand pas encore daté | EXA-4 |
| Z21 ranger la cave | recréation tentée (EXA-8), renommé, Mémo ; ce tour : tâche « Ranger la cave le samedi 6 déc. au matin » (IA, À faire) | Mémo + tâche | EXA-8, EXA-11 |
| Z22 odeur de soufre | gestes : Problème, Décidé, jeton veille retiré ; tâche « Sentir à nouveau avant la mise en fût » (IA) | Problème · Décidé + tâche ; bulle mêlée « ZZ TÀ sentir… EST — ranger la cave » restée (sans ⋯) | EXA-2, EXA-6, EXA-8, EXA-9 |

## Combien et quels problèmes ? 11 (versés à BUGS.md)
1. EXA-1 (B) — la feuille ⋯ de la note s'ouvre sous l'en-tête : « Changer en façon » intouchable, le toucher tombe sur l'onglet Carnets.
2. EXA-2 (B) — supprimer une note dans un carnet la retire aussi d'un autre carnet, sans avertir.
3. EXA-3 (m) — Reclasser sur le malt laisse « Idée » à l'ancien format, sans Résolu ni tâche.
4. EXA-4 (m) — pas de carte Reclasser sur 5 carnets qui gardent articles nés d'une note et critères nés d'une phrase.
5. EXA-5 (m) — une façon prend toute la phrase pour nom (« Pistes : joint du couvercle, raccord gaz ou régulateur. »), sans geste pour la renommer.
6. EXA-6 (m) — une bulle devenue article, critère ou jeton n'a plus de ⋯ : ni façon, ni modifier, ni supprimer.
7. EXA-7 (m) — carte Résolu de la levure : picto de frigo, remède du fil absent.
8. EXA-8 (B) — champ de la liste : « Ajouter » ouvre le carnet proche sans rien créer, la phrase reste en brouillon partout et se mêle à la suivante.
9. EXA-9 (B) — tâche « dans 2 semaines » rangée « Cette semaine », sans date.
10. EXA-10 (m, neuf) — « Pourquoi … ? Tes notes ne le disent pas » alors que le fil le dit (malt, CO2, vapeur), aussi sur un carnet Résolu.
11. EXA-11 (B, neuf) — « samedi 6 déc. » et « avant le 31 déc. » rangées « Fin du mois », sans date sur la carte ni sur la ligne (phrases propres : le doute d'EXA-9 est levé).

Doutes (non comptés) :
- D1 : dans un mémo, la tâche acceptée ne laisse aucune trace visible dans le carnet une fois le bandeau « ✓ À faire » parti (Z15, Z21).
- D2 : la bande « Résolus en 2026 · le dernier en vert » montre le même picto en vert dans le malt, la pompe et la levure : « le dernier » n'est pas le carnet ouvert.
- D3 : Z06 et Z13 restent « Je cherche » sans façon, faute de ⋯ sur la bulle (EXA-6) : leur format est juste, mais incomplet.

LEÇON PROPOSÉE : un relevé « hors ZZ » filtré sur le texte du document compte les messages des carnets ZZ comme les siens ; filtrer par carnet parent (ou attribuer chaque écart par le journal des écritures, comme ici) avant de conclure « identique ».
