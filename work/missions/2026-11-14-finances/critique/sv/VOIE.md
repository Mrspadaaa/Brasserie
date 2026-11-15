# Voie sv — critique des 52 mini maquettes des sous-vues

- Mission : 2026-11-14-finances
- Agent : critique
- Modèle : opus
- Niveau : jugement
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : m1, m2, m3, m4
- Décideur en cas de doute : pilote

## Objectif
Juger chaque mini maquette comme le brasseur, avant qu'on la lui montre : défauts numérotés, et classement par vue (sans rien rejeter de la diversité).

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` et `work/missions/2026-11-14-finances/COUVERTURE.md`.
- Images : `work/missions/2026-11-14-finances/voies/<voie>/<id>/<id>.png` (voie = m1, m2, m3 ou m4, les deux premiers caractères de l'id) et chaque NOTE.md. Ids : m1ap-a…d, m1ar-a…d, m1do-a…d, m1fi-a…d, m2fo-a…d, m2mo-a…d, m2pa-a…d, m3im-a…d, m3pm-a…d, m3pr-a…d, m4bb-a…d, m4ia-a…d, m4pf-a…d (52).
- Aujourd'hui (si présentes) : `work/missions/2026-11-14-finances/voies/m0/cap/<clé>.png` (clé = les deux lettres après m1…m4, par exemple fi).
- Le portrait du brasseur : `.claude/agents/critique.md` et ses renvois.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/critique/sv`

## Consignes
Ouvrir chaque image en plein format (une image à la fois, jamais deux d'un coup au-delà de ce que le contexte supporte). Écrire
`work/missions/2026-11-14-finances/critique/sv/SYNTHESE.md` : un tableau | id | genre | montrable (oui/non) | défauts numérotés |, une ligne
par id, les défauts courts (lisibilité, débordement, texte coupé, chiffre faux ou incohérent avec v6a, jargon, cockpit, cible < 44 px,
hachure détournée, contenu actuel perdu). Puis, par vue, un classement des quatre et une greffe éventuelle. Un défaut se corrige sans changer
le genre. Aucun Fable, aucun sous-agent.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : l'écran derrière est sa maquette choisie ; c3a reste le choix du coût d'un brassin (m4bb ne sont que des pistes autour).
- Pas de cockpit, peu de texte, mots du métier ; inconnu ≠ 0 ; hachure = à payer ; jamais type=number ; 44 px.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (ids jugés) : une limite de tours ne perd rien.
- Tests : aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/critique/sv/SYNTHESE.md m4pf-d SYNTHESE --reporter=dot > work/missions/2026-11-14-finances/critique/sv/tests.txt`.
Réponse finale au pilote : une ligne.
