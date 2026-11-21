// POINT D'ENTRÉE DE FIXTURE du parcours Calendrier — jamais dans l'application livrée.
//
// Il remplace `src/dev/financeDemo.ts` (que `runMigrationIfNeeded` n'importe que sous `import.meta.env.DEV` ET `?dev-local`
// ET `?finance-demo`) dans le BUILD DE TEST seulement : `scripts/parcours/vite.parcours.config.mjs` l'y branche par un
// plugin ; ni `vite.config.ts` ni `src/` ne changent. Un build normal (`npm run build`) ne le voit pas, et son `DEV` est faux.
// Il ne s'active que sur localhost et avec `?finance-demo=parcours-calendrier` ou `=parcours-carnet` ; ailleurs il rend la démo d'origine.
//
// Il lit la fixture dans localStorage (posée par le script avant le chargement), la verse dans le magasin mémoire de
// dev-local, puis, à chaque changement, copie ce magasin dans localStorage : un rechargement relit donc ce qui a été écrit
// (le magasin dev-local est sinon vide à chaque chargement, il ne permettrait pas de « relire après rechargement »).
import { financeDemoEntries as demoOrigine } from '@parcours/financeDemo-origine';
import { FirestoreRepo, ALL_COLLECTIONS } from '@parcours/firestoreRepo';

/* Les jeux de fixture connus : un par parcours (`?finance-demo=<jeu>` ; clés localStorage `<jeu>:fixture` et `<jeu>:cache`). */
const JEUX = ['parcours-calendrier', 'parcours-carnet', 'parcours-chaines'];

const surLocalhost = () => ['localhost', '127.0.0.1'].includes(location.hostname);

export function financeDemoEntries(jeu) {
  const choisi = jeu ?? new URLSearchParams(location.search).get('finance-demo') ?? '';
  if (!JEUX.includes(choisi) || !surLocalhost()) return demoOrigine(jeu);
  const CLE_FIXTURE = `${choisi}:fixture`;
  const CLE_CACHE = `${choisi}:cache`;
  const demo = demoOrigine();
  const config = demo.entries.filter((e) => e.name === 'config');
  const memorise = localStorage.getItem(CLE_CACHE);
  const brut = memorise ?? localStorage.getItem(CLE_FIXTURE);
  if (!brut) throw new Error(`${choisi} : aucune fixture dans localStorage (clé ${CLE_FIXTURE})`);
  const lues = JSON.parse(brut);
  const entries = memorise ? lues : [...config, ...lues];
  // le magasin est rempli par `bulkWrite` juste après (synchrone en dev-local) : on s'abonne au tour suivant
  setTimeout(() => {
    const copier = () => {
      const tout = [];
      for (const name of ALL_COLLECTIONS) for (const d of FirestoreRepo.all(name)) tout.push({ name, id: d.__docId ?? d.id, data: d });
      if (tout.length) localStorage.setItem(CLE_CACHE, JSON.stringify(tout));
    };
    copier();
    FirestoreRepo.subscribe(copier);
  }, 0);
  return { entries, source: 'seed', counts: {} };
}
