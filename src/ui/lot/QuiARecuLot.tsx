import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Phone } from 'lucide-react';
import type { Batch, Client, KegItem, Transaction } from '../../types';
import { StorageService } from '../../services/storage';
import { Units } from '../../services/units';
import { useStorageValue } from '../../hooks/useLiveData';
import { clientPropose, jourCourt, numeroDuLot, quiARecuLot, type BrancheClient, type FutDuLot } from '../../domain/lot/quiARecuLot';
import { livrer, retourVide } from '../../domain/stock/futsFiche';
import { Sheet } from '../Sheet';
import { Combobox } from '../Combobox';
import { swissToday } from '../DateField';
import { optionsClients } from '../KegFiche';
import { litresVendus } from '../vente/brassinsVendables';
import './qui-a-recu.css';

/**
 * « Qui a reçu ce lot » — maquette lot/v1 « Les branches » (choisie le 16.11, port tel quel) :
 * sous la fiche, le lot se ramifie vers chaque client ; fût plein = encore chez lui, contour = rentré ;
 * un toucher ouvre la branche sur place (Appeler, fûts et dates) ; « Encore en cave » ouvre « Livrer ».
 * Corrections de la page « jouable » : le + n'y propose pas de mesure de densité ; le message sort du chemin du pied.
 */

const readKegs = (): KegItem[] => StorageService.getStocks().kegs;
const readClients = (): Client[] => StorageService.getClients();
const readTransactions = (): Transaction[] => StorageService.getTransactions();

const IconeFut: React.FC<{ plein?: boolean; id?: string }> = ({ plein, id }) => (
  <i className="qar-fut" data-plein={plein ? 'true' : 'false'} title={id}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12M6 21h12" /><path d="M6 3c-1.3 3-1.3 15 0 18M18 3c1.3 3 1.3 15 0 18" /><path d="M5.2 8h13.6M5.2 16h13.6" />
    </svg>
  </i>
);

const pluriel = (n: number, un: string, plus: string) => `${n} ${n > 1 ? plus : un}`;

const ligneFut = (f: FutDuLot, auj: string): string => {
  const livre = f.livre ? `livré le ${jourCourt(f.livre, auj)}` : 'date de livraison non notée';
  if (f.etat === 'chez-lui') return `${livre} · chez lui`;
  if (f.etat === 'rentre') return `${livre} · rentré le ${jourCourt(f.rentre, auj)}`;
  return `${livre} · retour non noté`;
};

export type GesteFutLot = 'livrer' | 'rentrer';

interface Props {
  batch: Batch;
  /** Un geste demandé par le menu « Plus » de la fiche ; `n` change à chaque demande (un même geste peut se redemander). */
  geste?: { quoi: GesteFutLot; n: number } | null;
}

export const QuiARecuLot: React.FC<Props> = ({ batch, geste }) => {
  const kegs = useStorageValue(readKegs);
  const clients = useStorageValue(readClients);
  const transactions = useStorageValue(readTransactions);
  const auj = swissToday();
  const r = useMemo(() => quiARecuLot(batch, kegs, clients), [batch, kegs, clients]);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [feuille, setFeuille] = useState<GesteFutLot | null>(null);
  const [fut, setFut] = useState<string>('');
  const [message, setMessage] = useState<{ texte: string; annuler?: () => void } | null>(null);
  const minuteur = useRef<number | undefined>(undefined);
  const vendusL = useMemo(() => litresVendus(transactions, batch.id), [transactions, batch.id]);

  const dire = (texte: string, annuler?: () => void) => {
    setMessage({ texte, annuler });
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => setMessage(null), annuler ? 6000 : 4000);
  };
  useEffect(() => () => window.clearTimeout(minuteur.current), []);
  useEffect(() => { if (geste) { setMessage(null); setFeuille(geste.quoi); } }, [geste]);
  useEffect(() => { if (feuille === 'livrer' && !r.enCave.includes(fut)) setFut(r.enCave[0] ?? ''); }, [feuille, r.enCave, fut]);

  const enCuve = batch.status === 'garde' || batch.status === 'fermentation';
  const propose = clientPropose(r);
  const dehors = useMemo(() => {
    const l: Array<{ b: BrancheClient; f: FutDuLot }> = [];
    r.branches.forEach((b) => b.futs.filter((f) => f.etat === 'chez-lui').forEach((f) => l.push({ b, f })));
    return l;
  }, [r]);

  const livrerA = (kegId: string, client: { id?: string; name: string }) => {
    const avant = kegs.find((k) => k.id === kegId);
    if (!avant) return;
    StorageService.updateKeg(livrer(avant, client, auj));
    setFeuille(null);
    setOuvert(client.id ? client.id : `nom:${client.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()}`);
    dire(`${kegId} livré à ${client.name}`, () => { StorageService.updateKeg(avant); setMessage(null); });
  };
  const rentrer = (kegId: string) => {
    const avant = kegs.find((k) => k.id === kegId);
    if (!avant) return;
    StorageService.updateKeg(retourVide(avant, auj));
    setFeuille(null);
    dire(`${kegId} rentré de chez ${avant.clientName || 'son client'}, à laver`, () => { StorageService.updateKeg(avant); setMessage(null); });
  };

  const sousTitre = (b: BrancheClient) =>
    `${b.chezLui ? `${pluriel(b.chezLui, 'fût chez lui', 'fûts chez lui')}` : 'tout est rentré'}${b.derniereLivraison ? ` · livré le ${jourCourt(b.derniereLivraison, auj)}` : ''}`;

  const racine = enCuve && r.livres === 0
    ? 'En cuve · rien n’est sorti'
    : `${batch.id}${batch.bottlingDate ? ` · conditionné ${jourCourt(batch.bottlingDate, auj)}` : ''}`;
  const rien = r.livres === 0;

  return (
    <section className="qar" aria-label="Qui a reçu ce lot" data-qar>
      <div className="qar-tete"><h3>Qui a reçu ce lot</h3></div>
      <p className="qar-lead">
        {rien
          ? <><b>Personne</b> pour l’instant</>
          : <><b className="font-mono">{r.branches.length}</b> {r.branches.length > 1 ? 'clients l’ont reçu' : 'client l’a reçu'} · <b className="font-mono">{r.chezEux}</b> {r.chezEux > 1 ? 'fûts encore chez eux' : 'fût encore chez lui'}</>}
      </p>
      {!rien && (
        <p className="qar-leg"><span><IconeFut plein />chez le client</span><span><IconeFut />rentré</span></p>
      )}
      {message && (
        <div className="qar-msg" role="status">
          <span>{message.texte}</span>
          {message.annuler && <button type="button" onClick={message.annuler}>Annuler</button>}
        </div>
      )}

      <div className="qar-arbre">
        <div className="qar-racine"><i className="font-mono">{numeroDuLot(batch.id) ?? '·'}</i>{racine}</div>

        {r.branches.map((b) => {
          const o = ouvert === b.cle;
          const tel = b.tel?.replace(/[^\d+]/g, '');
          return (
            <div key={b.cle} className="qar-br" data-rentre={b.chezLui === 0 ? 'true' : 'false'} data-ouvert={o ? 'true' : 'false'} data-client={b.cle}>
              <button type="button" className="qar-ligne" aria-expanded={o} onClick={() => setOuvert(o ? null : b.cle)}>
                <span className="qar-nom"><b>{b.nom}</b><span>{sousTitre(b)}</span></span>
                <span className="qar-futs">{b.futs.map((f, i) => <IconeFut key={`${f.id}-${i}`} id={f.id} plein={f.etat === 'chez-lui'} />)}</span>
                <ChevronRight size={20} className="qar-chev" aria-hidden="true" />
              </button>
              {o && (
                <div className="qar-det">
                  {b.contact && <p className="qar-qui">{b.contact}</p>}
                  {tel
                    ? <a className="qar-tel" href={`tel:${tel}`}><Phone aria-hidden="true" />Appeler <span className="font-mono">{b.tel}</span></a>
                    : <p className="qar-pasdetel">{b.clientId ? 'Aucun numéro sur sa fiche client.' : 'Ce nom n’est pas relié à une fiche client : pas de numéro.'}</p>}
                  <ul>
                    {b.futs.map((f, i) => (
                      <li key={`${f.id}-${i}`} data-dehors={f.etat === 'chez-lui' ? 'true' : 'false'}><b className="font-mono">{f.id}</b><span>{ligneFut(f, auj)}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}

        {vendusL > 0 && (
          <div className="qar-br qar-gris" data-rentre="true">
            <div className="qar-ligne" role="note">
              <span className="qar-nom"><b>Ventes à la caisse</b><span><span className="font-mono">{Units.format(vendusL, 'L')}</span> notés depuis la caisse</span></span>
              <span className="qar-pilule">sans nom</span>
            </div>
          </div>
        )}

        {r.enCave.length > 0 && (
          <div className="qar-br qar-gris" data-rentre="true">
            <button type="button" className="qar-ligne" onClick={() => { setMessage(null); setFeuille('livrer'); }}>
              <span className="qar-nom"><b>Encore en cave</b><span><span className="font-mono">{r.enCave.join(', ')}</span></span></span>
              <span className="qar-pilule qar-livrer">Livrer ›</span>
            </button>
          </div>
        )}
      </div>

      {rien && (
        <p className="qar-vide" data-vide>
          <b>Aucun fût livré.</b> Chaque fût que tu livres viendra s’accrocher ici tout seul, avec son client. Rien à saisir.
        </p>
      )}

      {feuille === 'livrer' && (
        <Sheet open onClose={() => setFeuille(null)} title={fut ? `Livrer ${fut}` : 'Rien à livrer'} subtitle={`${batch.name} · ${batch.id} · à qui ?`}>
          {!fut
            ? <p className="qar-aide">{batch.status === 'conditionne' || batch.status === 'termine' ? `Plus aucun fût de ${batch.id} en cave.` : `${batch.id} est encore en cuve : aucun fût à livrer.`}</p>
            : <>
                {r.enCave.length > 1 && (
                  <div className="qar-chips" role="group" aria-label="Fût à livrer">
                    {r.enCave.map((id) => <button key={id} type="button" aria-pressed={id === fut} onClick={() => setFut(id)} className="font-mono">{id}</button>)}
                  </div>
                )}
                <div className="qar-choix">
                  {[...(propose ? [propose] : []), ...r.branches.filter((b) => b !== propose)].map((b) => (
                    <button key={b.cle} type="button" onClick={() => livrerA(fut, { id: b.clientId, name: b.nom })}>
                      <span>{b.nom}<small>{b.chezLui ? pluriel(b.chezLui, 'fût chez lui', 'fûts chez lui') : 'tout est rentré'}</small></span>
                      {b === propose && <em>proposé</em>}
                    </button>
                  ))}
                </div>
                <p className="qar-aide" style={{ marginTop: '.75rem' }}>Un autre client de l’onglet Clients :</p>
                <Combobox ariaLabel="Autre client" value="" onChange={(id) => { const c = clients.find((x) => x.id === id); if (c) livrerA(fut, { id: c.id, name: c.name }); }}
                  options={optionsClients(clients)} placeholder="Choisir un client…" />
              </>}
        </Sheet>
      )}

      {feuille === 'rentrer' && (
        <Sheet open onClose={() => setFeuille(null)} title={dehors.length ? 'Rentrer un fût' : 'Rien à rentrer'} subtitle={`${batch.name} · ${batch.id} · lequel revient ?`}>
          {dehors.length === 0
            ? <p className="qar-aide">{r.livres ? `Tous les fûts de ${batch.id} sont rentrés.` : `Aucun fût de ${batch.id} n’est sorti.`}</p>
            : <div className="qar-choix">
                {dehors.map(({ b, f }) => (
                  <button key={`${b.cle}-${f.id}`} type="button" onClick={() => rentrer(f.id)}>
                    <span><b className="font-mono">{f.id}</b> · {b.nom}<small>{f.livre ? `livré le ${jourCourt(f.livre, auj)}` : 'date de livraison non notée'} · revient vide, à laver</small></span>
                  </button>
                ))}
              </div>}
        </Sheet>
      )}
    </section>
  );
};
