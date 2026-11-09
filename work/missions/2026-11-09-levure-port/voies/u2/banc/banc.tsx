// Banc de la voie u2 : monte Chercher, Comparer ou Suggérer seul, sur l'API simulée (?api=simulee, défaut tant que d1 n'a pas livré)
// ou sur l'API de d1 (?api=reelle). ?vue=chercher|comparer|suggerer · ?theme=clair|cave · ?base=aucune · ?comparees=id,id (ids réels
// avec ?api=reelle). Servi par vite dev, jamais dans le bundle de production ; aucune donnée du brasseur.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '/src/index.css';
import { Chercher } from '/src/ui/etapeLevure/Chercher';
import { Comparer } from '/src/ui/etapeLevure/Comparer';
import { Suggerer } from '/src/ui/etapeLevure/Suggerer';
import type { PropsVue } from '/src/ui/etapeLevure/props';
import type { YeastReference } from '/src/domain/yeastReferences';
import { yeastReferences } from '/src/domain/yeastReferences';
import { apiSimulee, levureDe, reperes } from '/tests/integration/etapeLevure/vues-simule';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
const vue = (q.get('vue') ?? 'chercher') as 'chercher' | 'comparer' | 'suggerer';
const simulee = q.get('api') !== 'reelle';
const trouver = (nom: string): YeastReference | undefined => yeastReferences([], { includeCatalogue: true }).find((y) => y.id === nom || y.name.toLowerCase().includes(nom.toLowerCase()));
const base = q.get('base') === 'aucune' ? undefined : simulee ? levureDe('us05') : trouver(q.get('base') ?? 'US-05');
const journal: Array<{ cb: string; args: unknown[] }> = [];
(window as unknown as { __journal: typeof journal }).__journal = journal;

function Banc() {
  const [comparees, setComparees] = useState<string[]>((q.get('comparees') ?? '').split(',').filter(Boolean).map((n) => (simulee ? n : trouver(n)?.id ?? n)));
  const props: PropsVue & { api?: typeof apiSimulee } = {
    base, reperes: simulee ? reperes : { temperatureC: 19, abvVise: 7, ogVisee: 1.066 }, comparees,
    onChoisir: (l) => journal.push({ cb: 'onChoisir', args: [l.id] }),
    onComparees: (ids) => { journal.push({ cb: 'onComparees', args: [ids] }); setComparees(ids); },
    onVue: (v) => journal.push({ cb: 'onVue', args: [v] }),
    onChercherDonnee: (l, axe) => journal.push({ cb: 'onChercherDonnee', args: [l.id, axe] }),
    ...(simulee ? { api: apiSimulee } : {}),
  };
  return (
    <div data-banc={vue} style={{ maxWidth: Number(q.get('largeur') ?? 390), margin: '0 auto', padding: '8px 10px 80px' }}>
      {vue === 'chercher' ? <Chercher {...props} /> : vue === 'comparer' ? <Comparer {...props} /> : <Suggerer {...props} />}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<Banc />);
