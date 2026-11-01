# Écarts — témoin juste

Tout ce qui est cité entre accents graves existe.

- Un chemin : `scripts/agents/systeme.mjs`, et `package.json` à la racine.
- Un nom de fichier seul, unique dans le dépôt : `systeme.mjs`.
- Une ligne : `scripts/agents/systeme.mjs:1`, une plage : `scripts/agents/systeme.mjs:1-10`.
- Des identifiants de code : `verifierMission`, `BUDGET_CHARGE`, et un mot à tirets qui porte une version : `invoice-v4`.
- Ignorés, car ce ne sont ni des chemins ni des identifiants : `npm run build`, `https://exemple.ch/page`, `Europe/Zurich`, `--image`, `3,5 CHF`.

```
`ceci/est/dans/un/bloc/de/code.ts` n'est jamais lu
```
