---
name: conseil
description: Soumettre une décision lourde de L'Affinée à un conseil de six regards (Brasseur, Contradicteur, Audacieux, Premiers principes, Bâtisseur, Regard neuf), revus anonymement puis tranchés par un président. Adapté du LLM Council de Karpathy. À utiliser pour une décision coûteuse si elle est fausse (architecture d'un outil, convention du moteur, données, coût de calcul, priorités), quand l'utilisateur dit « conseil », « passe au conseil », « council ». Pas pour une question factuelle ni pour ce qu'un test peut trancher.
---

# Le conseil

Le pilote cadre, six conseillers répondent chacun depuis un regard, trois relecteurs anonymes les
croisent, un président tranche. Tout est écrit dans le second cerveau. Regards et gabarits :
`references/regards.md`.

## 0. Faut-il un conseil ?
Oui si la décision coûte cher quand elle est fausse et qu'aucun test ne la tranche : architecture
des outils houblons, conventions du moteur, rattachement des données, coût de calcul, ordre des
chantiers, choix entre pistes (#115). Non pour un fait, une commande, une préférence connue du
brasseur (le cerveau la donne), ou un geste irréversible (il va à l'utilisateur).

## 1. Router avant de cadrer
Écrire le **type de décision** (grille de `docs/agents/systeme.md` § Décider) :
- **déléguée** (réversible, dans le périmètre du pilote) : le verdict s'applique, puis se journalise ;
- **brasseur** (goût, choix de variante, ce qu'il voit) : le conseil prépare et filtre, il montre les
  désaccords, et le brasseur tranche (« le brasseur choisit ») ;
- **utilisateur** (push, déploiement, données réelles, Gemini facturé, suppression, dépense) : le
  conseil éclaire, l'utilisateur décide.

## 2. Cadrer (pilote, 5 minutes au plus)
Chercher le contexte : `node scripts/agents/systeme.mjs chercher <mots>`, les mots du brasseur dans
SPEC-BRASSEUR.md, les défauts liés dans DEFAUTS-RECURRENTS.md, l'état dans le registre, deux ou
trois captures si la question touche un écran. Écrire la **question cadrée** : la décision, les
options connues, le contexte chiffré, l'enjeu, les contraintes (hors ligne, téléphone, quota,
honnêteté des données), et la liste des sources. Pas d'avis du pilote dedans.

## 3. Six avis en parallèle
Un seul message, six `Agent` en arrière-plan, `subagent_type: "conseiller"` (repli :
`general-purpose` avec « Suis .claude/agents/conseiller.md »). Modèles :

| Regard | Modèle | Pourquoi |
|---|---|---|
| Brasseur | fable | le juge qui compte : calibré sur `fils21-choisir/critique/PORTRAIT.md`, comme le critique |
| Contradicteur | opus | défaut fatal, déjà rejeté, données trompeuses |
| Audacieux | opus | potentiel manqué, plancher à enrichir |
| Premiers principes | opus | la vraie question, un facteur libre par écran, la science |
| Bâtisseur | opus | faisable dans l'app, coût mesuré (L20), premier geste |
| Regard neuf | sonnet | aucun contexte : la naïveté vient des entrées limitées, pas d'un modèle faible |

Répartition révisée le 22.10 (L25). Au premier conseil, les deux avis les plus faibles venaient du
Bâtisseur (Sonnet), qui écartait un repli sans le mesurer, et du Regard neuf (Haiku), resté en
surface. Le Regard neuf ne reçoit que la question cadrée et, s'il y en a, les captures, sans le
reste des sources. Gabarit d'appel : `references/regards.md`.

## 4. Revue anonyme
Mélanger les six avis sous les lettres A à F (ordre tiré au hasard, noté). Trois relecteurs
`conseiller` en parallèle, chacun sur un modèle différent (opus, fable, sonnet), pour une vraie
diversité à la Karpathy. Ils reçoivent la question et les six réponses anonymes. Chacun répond
à trois questions : la plus solide, le plus gros angle mort, ce que toutes ont manqué.

## 5. Président
Un agent `conseiller` neuf, modèle **fable** pour une décision du produit (ce que le brasseur verra
ou utilisera), **opus** pour une décision technique. Il reçoit la question, les six avis nommés et
les trois revues. Il rend le verdict en cinq parties :
`### Où le conseil s'accorde`, `### Où il se divise`, `### Angles morts`, `### Recommandation`,
`### Premier geste`. Il peut donner raison à la minorité. Pas de « ça dépend ».

## 6. Écrire et appliquer
1. Transcription : `cerveau/decisions/<AAAA-MM-JJ>-<sujet>.md` (gabarit dans `references/regards.md`) :
   en-tête de note (`type: decisions`), `## Question cadrée`, `## Type de décision`, `## Regards`
   (six `### <regard>`), `## Revues` (`### Revue 1..3`), `## Correspondance` (`- Réponse A = <regard>`),
   `## Verdict`. Ajouter la note à la carte de `cerveau/INDEX.md`.
2. Contrôle : `node scripts/agents/systeme.mjs conseil <fichier>` → CONSEIL OK.
3. Décision déléguée : l'appliquer, puis une ligne D-n dans le `decisions.md` du chantier, qui
   pointe la transcription. Décision du brasseur : les options ouvertes deviennent des axes de variantes du
   prochain lot, qu'on lui montre ; il choisit en regardant. Jamais une question fermée qui
   bloque le lot (L24). Décision de l'utilisateur :
   l'ajouter au groupe d'accords en attente.
4. Une erreur de méthode révélée → `cerveau/LECONS.md`. Un savoir durable → note du cerveau.

## Trois niveaux, du moins cher au plus cher
Choisir le plus léger qui suffit. Quand `docs/agents/systeme.md` § « Quand le conseil intervient »
ne demande rien, le pilote décide seul.

| Niveau | Appels | Modèles | Pour |
|---|---|---|---|
| **Avis croisé** | 2 | Brasseur (fable) et Contradicteur (opus) ; le pilote tranche | décision moyenne : un seuil de contrôle, un choix entre deux réalisations, une voie à relancer ou à réécrire. Trace : une ligne D-n dans `decisions.md`, pas de transcription |
| **Conseil rapide** | 7 | six regards (sonnet, sauf le Brasseur en fable) et président (opus), sans revue | décision qui touche plusieurs voies, sans engager un lot entier |
| **Conseil complet** | 10 | regards en opus, Brasseur en fable, revues sur trois modèles, président en fable pour le produit | seulement ce qui engage un lot entier ou plus : carte des outils, nouvel outil, convention du moteur, cap de la porte B |

**Le dossier de conseil** : c'est le principal levier de coût. Au premier conseil complet, chaque
regard relisait lui-même la SPEC, le registre et les captures (1,04 million de jetons en tout).
Désormais, le pilote écrit un seul dossier, `work/missions/<mission>/conseil-<sujet>/question.md` :
- la question cadrée ;
- les extraits utiles, mot pour mot avec leur chemin, en 4 000 mots au plus ;
- 4 captures au plus.
Les regards et les revues lisent ce dossier. Ils n'ouvrent une source que pour vérifier un point
précis, pas pour tout relire. Cible : environ trois fois moins de jetons pour la même qualité.
Relever `get_usage` avant et après, et l'écrire dans la transcription (`## Suite`).
Ne jamais réunir le conseil deux fois sur la même question sans fait nouveau : relire la
transcription d'abord (`systeme.mjs chercher`).
