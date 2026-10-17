# Garde-fous — houblons, puis tout le frontend

Phase 4 de la mission #119, 18.10.2026. Réponse à la question du brasseur :
« Comment règle ce problème de fond ? Quoi mettre en place ? Comment faire pour
pas que ça se reproduise ? » (17.10, 23:00).

Le principe découle de la cause racine ([causes-racines.md](causes-racines.md)) :
chaque contrôle validait un substitut du besoin. Les garde-fous ci-dessous
mesurent **la tâche du brasseur, sur ses données, à 390 × 844**, et chacun a un
témoin négatif : il échoue sur l'app actuelle. Un contrôle qui ne peut pas
échouer ne prouve rien.

## Cause → garde-fou

| Cause | Garde-fou | Outil | État |
|---|---|---|---|
| H1 critères techniques | Le ticket cite les mots du brasseur et une question de la banque | `.github/ISSUE_TEMPLATE/interface.yml`, `scripts/check-issue-closure.mjs` | prêt |
| H2 revue contre le ticket | La revue juge contre la banque et U1 à U7 ; un défaut hors du diff bloque aussi | `docs/qualite/protocole-revue-ux.md` | prêt |
| H3 fixtures plus riches que la production | Banc QA sur l'instantané de production | `tests/fixtures/production/houblons-2026-10-17.json`, `scripts/hop-one-tap/stock-production.mjs` | prêt |
| H4 relecteur nourri par l'auteur | Le relecteur reçoit l'app et la banque, jamais le rapport | `docs/qualite/protocole-revue-ux.md` | prêt |
| H5 aucune tâche mesurée | Un toucher sans défiler, règles d'utilisabilité, budgets | `scripts/check-hop-one-tap.mjs`, `scripts/check-hop-ux-rules.mjs`, `scripts/check-hop-budget.mjs` | prêt |
| H6 aucune concurrence | La revue joue la même tâche chez un concurrent | `docs/qualite/protocole-revue-ux.md` | prêt |
| H7 app déployée jamais jouée | Contrôle en ligne, lecture seule, après chaque déploiement | `scripts/hop-one-tap/production.mjs` | préparé : exige le Chrome QA du brasseur |
| H8 couches empilées | Règle de soustraction ; budgets de JavaScript | `scripts/check-hop-budget.mjs` | prêt |
| A1 test qui acte une perte | Un test ne peut affirmer l'absence d'une fonction sans l'accord du brasseur | `.claude/hooks/guards.mjs` (lost-feature) | préparé : actif sur accord |
| A1 commit « sauvegarde » de 289 fichiers | Commit de plus de 80 fichiers refusé | `.claude/hooks/guards.mjs` (big-commit) | préparé : actif sur accord |
| A2 issues fermées avec un bloquant | Clôture refusée tant qu'un bloquant reste ouvert | `scripts/check-issue-closure.mjs`, `.claude/hooks/guards.mjs` (issue-close) | prêt ; hook actif sur accord |
| A3 consignes perdues entre briefs | Les mots du brasseur vivent dans un seul fichier ; les briefs y renvoient par identifiant | `docs/besoins/corpus-demandes.md` | prêt |
| A4 surcharge validée | Règles U1 à U7 contrôlées | `scripts/check-hop-ux-rules.mjs` | prêt pour U1, U4, U5, U6 ; U2, U3, U7 en revue |
| A5 quota | Contrôles automatiques bon marché à chaque changement ; revue humaine sur les tâches | `scripts/check-hop-one-tap.mjs`, `scripts/check-hop-ux-rules.mjs`, `scripts/check-hop-budget.mjs` | prêt |

## 1. Le ticket

- Gabarit `.github/ISSUE_TEMPLATE/interface.yml` (actif sur GitHub après le
  prochain push accepté) : mots du brasseur (Cnnn « … »), questions de la banque,
  critères en mots du brasseur mesurés à 390 × 844, règles U1 à U7, contrôles
  joués, production, bloquants.
- `node scripts/check-issue-closure.mjs <numéro>` refuse la clôture si une
  citation ne se retrouve pas mot pour mot dans le corpus, si aucune question de
  la banque n'est visée, si aucun contrôle `scripts/check-*.mjs` n'est nommé
  avec sa sortie « … OK » collée dans un bloc de code (écrire l'attendu ne suffit
  pas), si un bloquant reste ouvert, ou si la section Production est vide.
  Témoins : `--selftest` (8 cas).
- Le contrôle s'applique aux issues étiquetées « interface ». Mesuré : #76,
  fermée le 12.10 avec un verdict bloquant, aurait été refusée pour 5 raisons.
  L'étiquette est posée en phase 5 sur les tickets d'écran.

## 2. Les contrôles automatiques

Tous jouent l'écran ouvert par un adaptateur (`scripts/hop-one-tap/`) :
`qa-bench.mjs` (app actuelle sur le banc QA ; `QA_CATALOGUE=production` pour
l'instantané), `wireframe.mjs` (fils de fer, témoin positif), `production.mjs`
(app en ligne, lecture seule). Le prototype de la phase 8 reçoit le sien.

### Un toucher, sans défiler — `scripts/check-hop-one-tap.mjs`

Depuis l'étape Houblons à 390 × 844, l'état d'arrivée puis chaque commande
visible, une à une, depuis un état neuf : au moins 5 houblons du stock (ou tout
le stock) visibles au premier plan, chacun avec sa quantité, et aucun houblon
hors stock avant eux. Le contrôle ne connaît pas l'écran : il ne peut pas être
« ajusté » à une conception.

### Règles d'utilisabilité — `scripts/check-hop-ux-rules.mjs`

U1 (aucun paragraphe de plus d'une ligne avant la première commande), U4 (aucun
terme interne : V5.5, dossier local, canonique, creuset…), U5 (ni grand panneau
clair dans l'app sombre, ni police à empattements), U6 (chaque commande visible
est au premier plan), aucun `type="number"`, cibles de 24 × 24 px sans
chevauchement, contraste 4,5:1 (3:1 pour le grand texte). Le contenu inerte
sous une feuille modale et le contenu rogné sont exclus.

### Budgets — `scripts/check-hop-budget.mjs`

| Budget | Seuil | Raison |
|---|---|---|
| B1 démarrage : JavaScript avant le premier écran | 350 ko gzip | Environ 2 s en 4G lente (1,6 Mbit/s) ; « l'app est devenue très lente » (#121). |
| B2 étape Houblons : JavaScript ajouté à l'ouverture | 150 ko gzip | Moins d'1 s de plus en 4G lente pour ouvrir l'étape. |
| B3 classement visible, processeur bridé × 4 | 1 000 ms | Critère du brief : résultat en moins d'une seconde. |
| B4 tas JavaScript à l'étape Houblons | 120 Mo | Téléphone moyen ; 3,5 Go observés en comparant (#107). |

Le budget de la simulation (moins d'1 s après un réglage) se mesure sur le
prototype de la phase 8, quand le geste existe.

### Résultats mesurés le 18.10.2026

| Contrôle | App actuelle (banc QA, stock et catalogue de production) | Fils de fer A | Fils de fer B |
|---|---|---|---|
| Un toucher, sans défiler | **échoue** : 0 houblon du stock visible, à l'arrivée et après chacune des 18 commandes | passe : 9 houblons à 0 toucher | passe : 9 houblons à 1 toucher |
| Règles d'utilisabilité | **échoue** sur 4 : U4 (8 termes internes), U5 (panneau clair), U6 (8 commandes sous le panneau de l'atelier), cibles (case de 13 × 13 px, chevauchements) | passe | passe |
| B1 démarrage | **918 ko** gzip (3 fichiers, dont `App` 704 ko) | — | — |
| B2 étape Houblons | **772 ko** gzip ajoutés (20 fichiers, dont `Host` 479 ko) | — | — |
| B3 classement | **jamais** en 10 s | 26 ms | 41 ms |
| B4 tas JavaScript | 74 Mo (tenu) | 2 Mo | 2 Mo |

Le contrôle a aussi trouvé deux défauts dans les fils de fer eux-mêmes (bouton
de 22 px de haut, feuille modale sans contenu inerte), corrigés avant la mesure.

## 3. La revue UX

Protocole complet : [protocole-revue-ux.md](protocole-revue-ux.md). Relecteur à
l'aveugle, 5 tâches chronométrées à 390 × 844 sur données de production,
description de chaque capture, comparaison à un concurrent, bloquants qui
empêchent la clôture.

## 4. La vraie app

- **Fixtures de production** : `tests/fixtures/production/houblons-2026-10-17.json`,
  instantané en lecture seule (12 variétés, 18 articles de stock, sans donnée
  personnelle). Le banc QA le charge avec `?catalogue=production` : 12 variétés au
  lieu de 136. Le stock de production est semé par l'adaptateur.
- **Après chaque déploiement** : le brasseur ouvre son Chrome QA avec le port de
  débogage 9222, se connecte, ouvre l'étape Houblons d'une recette, puis lance :

  ```text
  node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/production.mjs
  ```

  Le contrôle s'attache à l'onglet sans en créer, ne saisit rien, n'enregistre
  rien, et ne touche que des commandes de lecture listées d'avance. Sans Chrome QA,
  il s'arrête avec « PRODUCTION NON JOUÉE ».
- **Même résultat qu'en fixture** : la sortie en ligne doit égaler celle du banc
  sur l'instantané du jour. Un écart est un bloquant de mise en ligne.

## 5. Règles de travail

- **Soustraction** : un écran refait remplace l'ancien ; il ne s'y ajoute pas.
  Chaque donnée visible par défaut cite sa question de la banque ; le reste
  s'ouvre à la demande.
- **Pas de perte silencieuse** : retirer une fonction visible, ou un test qui la
  vérifie, demande l'accord écrit du brasseur.
- **Commits revus** : un commit par geste ou par ticket, 80 fichiers au plus.
- **Captures** : une capture compte si elle est regardée et décrite.

## 6. Hooks Claude Code préparés

`.claude/hooks/guards.mjs` contient trois gardes (issue-close, lost-feature,
big-commit), testées par `node .claude/hooks/guards.mjs --selftest` (8 cas). Ils
sont **inactifs** : la configuration est dans `docs/qualite/hooks-settings.json`.
Activation, sur accord du brasseur : fusionner son bloc `hooks` dans
`.claude/settings.json`. Rien n'est activé dans cette mission sans cet accord.

## 7. Ce qui reste au jugement humain

U2 (seulement l'utile par défaut), U3 (une entrée par geste) et U7 (tâche
réussie sans aide) se jugent en revue, avec le protocole. Le rendu de l'app
connectée se joue avec le Chrome QA du brasseur.
