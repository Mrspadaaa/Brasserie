import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, Cloud, History, Lightbulb, LogOut, MessageCircle, Moon, Settings, Sun, Truck, Wrench } from 'lucide-react';
import type { AuditLog, Batch, Transaction } from '../../types';
import { joursDepuisBrassage } from '../../domain/productionInsights';
import { SaisirAuNom } from '../feuilles/SaisirAuNom';
import { lireHorodatage, type Personne } from '../feuilles/regles';
import { ChoixPlage } from '../periode/ChoixPlage';
import { dansPeriode, enPeriode, titre, type Periode, type PeriodeEntree } from '../periode/periode';
import { useTheme } from '../../theme/theme';
import { suffixeJournal, type EtatLigne } from './etats';
import './plus.css';

interface Props {
  /** Qui signe maintenant. */
  courant: Personne;
  onSigner: (cible: Personne) => void;
  periode: PeriodeEntree;
  onChoisirPeriode: (p: Periode) => void;
  /** Dates des écritures (opérations) de l'app : les comptes de la grille. */
  /** Les opérations de l'app : la frise de la période en dessine les dépenses. */
  transactions?: Transaction[];
  logs: AuditLog[];
  batches: Batch[];
  pendingTodosCount: number;
  horsConnexion: boolean;
  /** Nom de la brasserie, tel que la configuration le dit. */
  entreprise?: string;
  /** « ✓ Drive · IA Rapide » : lu de l'app (accès Drive, niveau d'IA par défaut). Absent : rien d'écrit. */
  etatCloud?: EtatLigne | null;
  /** « ⚠ IBAN à corriger » : lu du bilan des Réglages (erreurs, puis trous). Absent : rien d'écrit. */
  etatReglages?: EtatLigne | null;
  onBack: () => void;
  onAssistant: () => void;
  onAtelier: () => void;
  onConversations: () => void;
  onJournal: () => void;
  /** La liste des fournisseurs (fiche : prix, factures, noms à réunir). */
  onFournisseurs?: () => void;
  onCloud?: () => void;
  onReglages: () => void;
  onLogout?: () => void;
}

const lettre = (p: Personne) => (p === 'Gaëtan' ? 'G' : 'A');
const PERSONNES: Personne[] = ['Gaëtan', 'Aricia'];

/** L'état écrit à droite d'une ligne (m3) : ✓ vert, ⚠ rouge, ou le texte seul. */
const Etat: React.FC<{ e?: EtatLigne | null }> = ({ e }) => e
  ? <small className="pl-et" data-n={e.niveau}>
      {e.niveau === 'ok' && <Check size={14} aria-hidden="true" />}
      {e.niveau === 'alerte' && <AlertTriangle size={14} aria-hidden="true" />}
      {e.texte}
    </small>
  : null;

/**
 * La page « Plus » (m3, choisie) : plein écran à sections, ouverte par le duo d'avatars de l'en-tête.
 * Qui saisit (la bascule), la période (m3r-a : la même grille que la pastille), le thème, les deux outils, puis l'administration.
 * Rien ne se perd du menu ⋮ d'avant : chaque ligne ouvre ce qu'elle ouvrait.
 */
export const PagePlus: React.FC<Props> = ({
  courant, onSigner, periode, onChoisirPeriode, transactions, logs, batches, pendingTodosCount, horsConnexion, entreprise, etatCloud, etatReglages,
  onBack, onAssistant, onAtelier, onConversations, onJournal, onFournisseurs, onCloud, onReglages, onLogout
}) => {
  const [theme, choisirTheme] = useTheme();
  const [confirmer, setConfirmer] = useState(false);
  const p = enPeriode(periode);

  /* Les écritures du journal par personne, dans la période : le compte vient du journal des modifications, pas d'un exemple. */
  const parPersonne = useMemo(() => {
    const n: Record<Personne, number> = { Gaëtan: 0, Aricia: 0 };
    for (const l of logs) {
      const d = lireHorodatage(l.timestamp);
      if (!d) continue;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dansPeriode(iso, p)) n[l.user] += 1;
    }
    return n;
  }, [logs, p]);
  const dansLaPeriode = parPersonne.Gaëtan + parPersonne.Aricia;

  const enCuve = batches.find(b => b.status === 'fermentation');
  const jours = enCuve ? joursDepuisBrassage(enCuve) : undefined;
  const ligneAssistant = enCuve ? `${enCuve.id}${jours !== undefined && jours >= 0 ? ` · J+${jours}` : ''}` : 'Aucun en cuve';
  const ecritures = (n: number) => `${n} écriture${n > 1 ? 's' : ''}`;

  return (
    <section className="pl" aria-label="Plus" data-page-plus>
      <div className="pl-tt">
        <button type="button" className="pl-back" aria-label="Retour" onClick={onBack}><ChevronLeft size={22} aria-hidden="true" /></button>
        <h1>Plus</h1>
        {entreprise && <small>{entreprise}</small>}
      </div>
      <div className="pl-cols">
        <div className="pl-col">
          <section className="pl-card" aria-labelledby="pl-saisis">
            <h2 id="pl-saisis">Je saisis</h2>
            <div className="pl-pp">
              {PERSONNES.map(nom => (
                <button key={nom} type="button" className="pl-pe" aria-pressed={nom === courant}
                  onClick={() => { if (nom !== courant) setConfirmer(true); }}>
                  <i data-p={lettre(nom)} aria-hidden="true">{lettre(nom)}</i>
                  <span>{nom}<small>{ecritures(parPersonne[nom])}</small></span>
                </button>
              ))}
            </div>
          </section>
          <section className="pl-card" aria-labelledby="pl-theme">
            <h2 id="pl-theme">Thème</h2>
            <div className="pl-pp">
              {(['clair', 'cave'] as const).map(t => (
                <button key={t} type="button" className="pl-th" data-t={t} aria-pressed={theme === t} data-theme-choix={t} onClick={() => choisirTheme(t)}>
                  <span className="pl-ln" aria-hidden="true"><s /><s /></span>
                  <span className="pl-tn">{t === 'clair' ? 'Clair' : 'Cave'}{t === 'clair' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
        <section className="pl-card pl-per" aria-label="Période">
          {/* m3 : « Période » à gauche, la période choisie en gras à droite ; au 1280 comme au 390. */}
          <h2 className="pl-lb">Période<b>{titre(p)}</b></h2>
          <ChoixPlage periode={p} onChoisir={onChoisirPeriode} transactions={transactions} />
        </section>
        <div className="pl-col">
          <div className="pl-pp pl-outils">
            <button type="button" className="pl-ou" data-t="prod" onClick={onAssistant}>
              <i aria-hidden="true"><Wrench size={20} /></i>
              <span>Assistant de brassage<small>{ligneAssistant}</small></span>
            </button>
            <button type="button" className="pl-ou" data-t="atelier" onClick={onAtelier}>
              <i aria-hidden="true"><Lightbulb size={20} /></i>
              <span>Atelier R&amp;D<small>{pendingTodosCount > 0 ? `${pendingTodosCount} idée${pendingTodosCount > 1 ? 's' : ''} nouvelle${pendingTodosCount > 1 ? 's' : ''}` : 'Aucune idée nouvelle'}</small></span>
            </button>
          </div>
          <ul className="pl-liste">
            <li><button type="button" onClick={onConversations}><MessageCircle size={20} aria-hidden="true" /><span>Mes conversations</span>{horsConnexion && <small className="pl-et">hors ligne</small>}</button></li>
            <li><button type="button" onClick={onJournal}><History size={20} aria-hidden="true" /><span>Journal des modifications</span><small className="pl-et"><span className="pl-m pl-n">{dansLaPeriode}</span> {suffixeJournal(p)}</small></button></li>
            {onFournisseurs && <li><button type="button" onClick={onFournisseurs}><Truck size={20} aria-hidden="true" /><span>Fournisseurs</span></button></li>}
            {onCloud && <li><button type="button" onClick={onCloud}><Cloud size={20} aria-hidden="true" /><span>Connexions cloud et IA</span><Etat e={etatCloud} /></button></li>}
            <li><button type="button" onClick={onReglages}><Settings size={20} aria-hidden="true" /><span>Réglages</span><Etat e={etatReglages} /></button></li>
            {onLogout && <li><button type="button" className="pl-sortie" onClick={onLogout}><LogOut size={20} aria-hidden="true" /><span>Se déconnecter</span></button></li>}
          </ul>
        </div>
      </div>
      <SaisirAuNom open={confirmer} courant={courant}
        onConfirmer={cible => { onSigner(cible); setConfirmer(false); }} onAnnuler={() => setConfirmer(false)} />
    </section>
  );
};
