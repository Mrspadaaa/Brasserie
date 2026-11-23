# Correction du Carnet par lots — brief commun (23.11, mode nuit)

Liste : LISTE.md de ce dossier, § 3 (table des lots, fichiers possédés) et § 4 (défauts par lot, causes probables).
Ses mots : « c'est pas normal de perdre autant de temps pour des bugs simple » : va vite, sans sauter le test rouge.

## Où
- Copie de travail : `node scripts/agents/copie-travail.mjs carnet-lot-<N>` (D439 ; exporte E2E_PORT et E2E_BUILD qu il affiche).
- Tu n'écris QUE les fichiers possédés par ton lot (table § 3) + tes tests (e2e/carnet/lot-<N>.spec.ts ou tests/…/lot<N>*.test.ts).
  Un correctif qui exige un fichier d'un autre lot : ne le touche pas, note-le « hors lot » dans ton retour.

## Méthode (rapide)
- 4 agents au plus en même temps (D439). Ne lance que le test de TA plainte (D438 : un test par plainte + règles fast-check) ; la suite entière se joue une fois, à l intégration, par le pilote.
- Par défaut (ou groupe de même cause) : test qui échoue d'abord (Playwright `npx playwright test <spec> --grep`, sur la
  fixture avec e2e/outils/doigt.ts ; ou vitest ciblé), correction, ce test vert. Un `test.fail` CA12-PW de ton lot qui
  devient vert : retire le `.fail`.
- Types : `npx tsc --noEmit --incremental --tsBuildInfoFile node_modules/.cache/tsc-lot<N>.tsbuildinfo -p .`
- Commit par défaut ou groupe, par chemins, id(s) L-n / CA12-… dans le message, terminé par
  « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> » (ou Sonnet 5.5 selon ton modèle).
- À la fin : `npx playwright test e2e/carnet e2e/calendrier` une fois ; captures à 390 de chaque correction visible,
  regardées ; chaque capture citée.
- Pas de push, pas de déploiement, pas de données réelles ni en ligne. Ne lis jamais functions/.env ni .secret.local.
  Ne touche jamais firestore.rules, .firebaserc, firestore.indexes.json, src/data/seedData.ts. Ne ferme jamais Chrome.
- Classe (b) de ton lot : rejoue sur la fixture ; non reproduit = test de garde seulement, dis-le.
- Retour en une ligne : branche, défauts corrigés (L-n) et hashes, non reproduits, hors lot, e2e verts/rouges,
  fonctions serveur touchées (noms).
