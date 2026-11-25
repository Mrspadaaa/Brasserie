/**
 * Banc du contrôle de mise en page du Carnet (c80, `scripts/controle-mise-en-page-carnet.mjs`). **Banc : données simulées, rien n'est écrit.**
 * Monte le CarnetsVue RÉEL sur de VRAIS documents relevés (tests/fixtures/c75, c78, c79) et un document reconstruit (c80), dans un magasin mémoire, IA simulée.
 *
 * Le décor imite l'écran Matériel de l'app (src/components/tabs/StocksTab.tsx l. 715 et 930) : un en-tête collé en haut, la rangée « Matériel · Carnets » (z 20, 44 px,
 * `shrink-0`), puis CarnetsVue (`min-h-0 flex-1`) dans un écran de hauteur `100dvh − en-tête − barre du bas − 1rem`, main à 12 px de marge (≥ 375 px), barre du bas fixe.
 * Les cadres vides sont MARQUÉS `data-banc-cadre` : le script y lit la hauteur de ce qui cache le haut et le bas. Jamais chargé par l'app.
 *
 * Paramètres : `?carnet=<id>` ouvre ce carnet ; sans lui, la liste des carnets.
 */
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import '../../../../../../src/index.css';
import { CarnetsVue } from '../../../../../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../../../../../src/services/carnetsStore';
import { MAINTENANT_SUIVI } from '../../../../../../src/domain/carnets/fixture';
import { aidesCarnet } from '../../../../../../src/config/carnetIA';
import { poserQuantitePour } from '../../../../../../src/ui/carnets/tableauRegles';
import type { AppelsIA } from '../../../../../../src/ui/carnets/rangement';

interface Releve { carnet: { id: string; title: string }; messages: unknown[]; plan: unknown | null }
const modules = import.meta.glob('../../../../../../tests/fixtures/{c75,c78,c79,c80}/*.json', { eager: true, import: 'default' }) as Record<string, Releve>;
const releves = Object.values(modules).filter(r => r && r.carnet && Array.isArray(r.messages));

const q = new URLSearchParams(location.search);
if (q.get('theme') === 'sombre') document.documentElement.setAttribute('data-theme', 'cave');
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };
export const ENTETE = 40;
export const RANGEE = 44;
export const BARRE_BAS = 44;

function Banc() {
  const magasin = useMemo(() => {
    for (const r of releves) poserQuantitePour(r.carnet.title, 1);
    return magasinMemoire(releves.flatMap(r => [r.carnet, ...r.messages]) as never[]);
  }, []);
  const plans = useMemo(() => releves.flatMap(r => (r.plan ? [r.plan] : [])), []);
  const id = q.get('carnet');
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div data-banc-cadre="entete" style={{ position: 'sticky', top: 0, zIndex: 30, height: ENTETE, flex: 'none', background: 'rgb(var(--cave-900))', borderBottom: '1px solid rgb(var(--cave-800))' }} />
      <main style={{ flex: 1, width: '100%', maxWidth: 896, margin: '0 auto', padding: '0 12px' }}>
        <div className="stocks-screen" style={{ display: 'flex', flexDirection: 'column', height: `calc(100dvh - ${ENTETE}px - ${BARRE_BAS}px - 1rem)`, paddingTop: 4, gap: 4 }}>
          <div data-banc-cadre="rangee" style={{ position: 'relative', zIndex: 20, flex: 'none', height: RANGEE, background: 'rgb(var(--cave-900))', borderRadius: 12, border: '1px solid rgb(var(--cave-800))' }} />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <CarnetsVue className="min-h-0 flex-1" magasin={magasin} finances={{ plans, transactions: [], payments: [] } as never} mode={'simule' as never} appels={horsLigne}
              aides={aidesCarnet('simule' as never, {})} maintenant={() => new Date(MAINTENANT_SUIVI)} anciens={[]} {...(id ? { ouvrir: { id, at: 1 } } : {})} />
          </div>
        </div>
      </main>
      <div data-banc-cadre="barre" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, height: BARRE_BAS, background: 'rgb(var(--cave-900))', borderTop: '1px solid rgb(var(--cave-800))' }} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Banc />);
