import React, { useRef } from 'react';
import { FileText, FlaskConical, MessageCircle, Package, Smartphone, Sparkles, Trash2, Wallet, Wifi, WifiOff } from 'lucide-react';
import { Feuille } from './Feuille';
import { etatLienCompagnon, horodatageConversation, iconeConversation, type IconeConversation } from './regles';

export interface LigneConversation {
  cle: string;
  label: string;
  question: string;
  statut: string;
  createdAt: number;
  kind: string;
  /** La question attend le réseau (envoi non confirmé). */
  enAttente: boolean;
  echanges: number;
  selected: boolean;
  /** Un échec se relance depuis la ligne (geste du compagnon déployé). */
  relancer?: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  lignes: LigneConversation[];
  enLigne: boolean;
  erreurLien: string;
  notice: string;
  suppressionEnCours: boolean;
  onOuvrir: (cle: string) => void;
  onChoisir: (cle: string | null) => void;
  onConfirmer: () => void;
  onIndice: () => void;
  /** Gestes du compagnon déployé, gardés dans la feuille d3p2 : « Repartir à zéro » au-dessus de la liste, l'interrupteur de notification en dessous. */
  avant?: React.ReactNode;
  apres?: React.ReactNode;
}

const PICTOS: Record<IconeConversation, React.ReactNode> = {
  flask: <FlaskConical size={16} />, file: <FileText size={16} />, box: <Package size={16} />, wallet: <Wallet size={16} />, msg: <MessageCircle size={16} />
};
const COULEUR = { prod: 'rgb(var(--area-production))', sto: 'rgb(var(--area-stocks))', fin: 'rgb(var(--area-finances))', hop: 'rgb(var(--hop))' } as const;

/**
 * Mes conversations (d3p2) : le fil entre cet appareil et le compagnon, coupé et dit quand il n'y a plus de réseau ;
 * puis les conversations, une ligne chacune. On supprime en glissant la ligne vers la gauche (au pointeur : au survol ;
 * au clavier : au focus) ; la suppression se confirme toujours, et se dit.
 */
export const ConversationsBoite: React.FC<Props> = ({ open, onClose, lignes, enLigne, erreurLien, notice, suppressionEnCours, onOuvrir, onChoisir, onConfirmer, onIndice, avant, apres }) => {
  const depart = useRef<number | null>(null);
  const lien = etatLienCompagnon(enLigne, erreurLien);
  const maintenant = new Date();
  const choisie = lignes.find(l => l.selected);
  const bande = (
    <>
      <div className="fe-cut" role="img" aria-label={lien.coupe ? 'Cet appareil et le compagnon : lien coupé' : 'Cet appareil et le compagnon : lien établi'}>
        <i><Smartphone size={20} aria-hidden="true" /></i>
        <span className="fe-wire" data-coupe={lien.coupe}><s />{lien.coupe ? <WifiOff size={18} aria-hidden="true" /> : <Wifi size={18} aria-hidden="true" />}<s /></span>
        <i><Sparkles size={20} aria-hidden="true" /></i>
      </div>
      <div className="fe-offt" role="status"><b>{lien.titre}</b>{lien.texte}</div>
    </>
  );
  return (
    <Feuille open={open} onClose={onClose} dismissible={!suppressionEnCours} teinte="hop" icone={<MessageCircle size={16} />} titre="Mes conversations" bande={bande}
      pied={<>
        {choisie
          ? <><span className="fe-sp">Les analyses en cours seront arrêtées.</span>
              <button type="button" className="fe-b2" disabled={suppressionEnCours} onClick={() => onChoisir(null)}>Annuler</button></>
          : <span className="fe-sp">Le + ouvre le compagnon sur l’écran en cours</span>}
        <button type="button" className="fe-b2" disabled={suppressionEnCours} onClick={() => (choisie ? onConfirmer() : onIndice())}>
          <Trash2 size={14} aria-hidden="true" />{suppressionEnCours ? 'Suppression…' : 'Supprimer les échanges'}</button>
      </>}>
      {notice && <p className="fe-notice" role="status">{notice}</p>}
      {avant}
      {!lignes.length
        ? <p className="fe-emp" role="status"><b>Aucune conversation</b>Le bouton + ouvre le compagnon sur l’écran en cours.</p>
        : <>
            <div className="fe-gt"><span>Récentes</span><span className="fe-m">{lignes.length}</span></div>
            {lignes.map(l => {
              const { icone, zone } = iconeConversation(l.kind, l.label);
              return (
                <React.Fragment key={l.cle}>
                  <div className="fe-swp" data-ouvert={l.selected}
                    onTouchStart={e => { depart.current = e.touches[0]?.clientX ?? null; }}
                    onTouchEnd={e => {
                      const x0 = depart.current, x1 = e.changedTouches[0]?.clientX;
                      depart.current = null;
                      if (x0 === null || x1 === undefined) return;
                      if (x0 - x1 > 40) onChoisir(l.cle); else if (x1 - x0 > 40 && l.selected) onChoisir(null);
                    }}>
                    <button type="button" className="fe-cv" disabled={suppressionEnCours} onClick={() => onOuvrir(l.cle)}>
                      <span className="fe-ci" style={{ background: COULEUR[zone] }} aria-hidden="true">{PICTOS[icone]}</span>
                      <span className="fe-l">{l.label}<small>{l.question}</small>
                        <small>{l.statut}{l.echanges > 1 && !/échange/.test(l.statut) ? ` · ${l.echanges} échanges` : ''}</small></span>
                      {l.enAttente ? <span className="fe-wait">attend le réseau</span> : <time className="fe-m">{horodatageConversation(l.createdAt, maintenant)}</time>}
                    </button>
                    {l.relancer && !l.selected && <button type="button" className="fe-b2" disabled={suppressionEnCours} aria-label={`Relancer la conversation ${l.label}`} onClick={l.relancer}>Relancer</button>}
                    <button type="button" className="fe-del" aria-label={`Supprimer la conversation ${l.label}`} disabled={suppressionEnCours} onClick={() => onChoisir(l.cle)}>
                      <Trash2 size={16} aria-hidden="true" />Supprimer</button>
                  </div>
                  {l.selected && <p className="fe-conf" role="status">Supprimer les échanges de « {l.label} » ? Les analyses en cours seront arrêtées.</p>}
                </React.Fragment>
              );
            })}
          </>}
      {apres}
    </Feuille>
  );
};
