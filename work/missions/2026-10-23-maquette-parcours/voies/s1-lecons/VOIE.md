# Voie s1-lecons — trier les « LEÇON PROPOSÉE » et « CONNAISSANCE » de la mission, pour la signature

- Mission : 2026-10-23-maquette-parcours
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (analyse, aucune écriture dans le cerveau)
- Plafond : 40 tours
- Décideur : pilote (il écrit seul dans `cerveau/`)

## Objectif
Les RESULTAT.md des voies (`work/missions/2026-10-23-maquette-parcours/voies/*/RESULTAT.md`) portent des lignes
`LEÇON PROPOSÉE :` et `CONNAISSANCE :` (environ 31 Ko). La skill voies veut qu'elles soient traitées à la signature, jamais
laissées en plan. Tu prépares ce traitement ; le pilote l'applique.

## Méthode
1. Relève toutes les lignes (et leur suite si elle continue sur les lignes suivantes), avec leur voie.
2. Lis `cerveau/LECONS.md`, `cerveau/INDEX.md`, et cherche chaque sujet : `node scripts/agents/systeme.mjs chercher <mots>`.
3. Classe chaque ligne : **déjà couverte** (cite la leçon ou la note : L.., M.., [[note]]), **à fusionner** dans une leçon
   existante (dis laquelle et la phrase à ajouter, 25 mots au plus), **nouvelle leçon** (rare : seulement une erreur de méthode
   répétée ou coûteuse ; propose le texte au format `### Lnn — règle` avec Erreur, Cause, Faire, Rôles, Contrôle, 6 lignes au
   plus), **savoir durable** (la note du cerveau qui le reçoit, ou une note neuve : nom, type, 5 lignes), ou **sans suite**
   (raison en une ligne : propre à une voie, faux, ou déjà corrigé dans le code).
4. Budget du cerveau : LECONS.md au plus 30 leçons et 170 lignes ; regroupe plutôt qu'ajouter.

## Possède
`work/missions/2026-10-23-maquette-parcours/voies/s1-lecons/RESULTAT.md`

## Rendre
`RESULTAT.md` : une section par classe (`## Déjà couvertes`, `## À fusionner`, `## Nouvelles leçons`, `## Savoirs durables`,
`## Sans suite`), une ligne par proposition, avec la voie d'origine entre crochets (`[dh4a]`). Ligne 1 :
`OK — <n> propositions : <a> couvertes, <b> à fusionner, <c> nouvelles, <d> savoirs, <e> sans suite`. Réponse finale : la ligne 1.
