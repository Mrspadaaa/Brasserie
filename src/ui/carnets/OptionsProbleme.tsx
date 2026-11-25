/**
 * D451 (maquettes3/v01, VERDICT § Retouches) : les options d'un problème en deux colonnes à 50 %, libellés entiers (la maquette les coupait :
 * « Condenseur B » sur deux lignes, jetons rognés) ; chaque case : photo ou picto, nom, jeton d'état. Toucher une case ouvre ses gestes (piste, veille,
 * retenir, écarter avec sa raison) ; sans rappel, la grille se lit seulement. Et la rangée de jetons du diagnostic « trouvé n · pas trouvé n · devis ·
 * ≈ total » (une seule rangée, le total dans la rangée).
 */
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { CarnetDoc, EtatOption, Facon, MessageDoc } from '../../domain/carnets/modele';
import { etatOption } from '../../domain/carnets/suivi';
import { VignetteObjet } from './pictos';
import { MOT_OPTION, infoOption, type ResumeJetons } from './filRegles';
import { montant } from './EtatIA';

const GESTES: readonly { vers: EtatOption; libelle: string }[] = [
  { vers: 'piste', libelle: 'Piste' }, { vers: 'veille', libelle: 'Veille' }, { vers: 'retenue', libelle: 'Retenir' }, { vers: 'ecartee', libelle: 'Écarter' }
];

export function OptionsProbleme({ c, onOption, messages = [] }: { c: CarnetDoc; onOption?: (faconId: string, vers: EtatOption, raison?: string) => void; messages?: readonly MessageDoc[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [raisonPour, setRaisonPour] = useState<string | null>(null);
  const [raison, setRaison] = useState('');
  const facons = c.carnet.facons;
  if (!facons.length) return null;
  const photoDe = (f: Facon) => c.carnet.articles.find(a => a.faconId === f.id && a.photo)?.photo;
  const fermer = () => { setOuverte(null); setRaisonPour(null); setRaison(''); };
  const choisie = facons.find(f => f.id === ouverte);
  return (
    <section className="cnp-options" aria-label="Options">
      <ul className="cnp-opt-grille">
        {facons.map(f => {
          const e = etatOption(f);
          /* C68-5 : la raison tapée à l'écart se lit avec l'écart (« pas pris » n'est pas une raison de lui) */
          const raison = e === 'ecartee' ? ((f.raison ?? [...(f.suivi?.historique ?? [])].reverse().find(h => h.etat === 'ecartee')?.raison) ?? '').trim() : '';
          const info = infoOption(c, messages, f);
          const contenu = (
            <>
              {/* C69-5 : le picto vient du NOM de l'option ; le titre du problème (« vapeur ») ne le prête pas à un condenseur */}
              <VignetteObjet photo={photoDe(f)} mots={[f.nom]} classe="cnp-opt-vignette" taille={30} />
              <span className={`cnp-opt-nom${e === 'ecartee' ? ' cnp-barre' : ''}`}>{f.nom}</span>
              <span className="cnp-opt-info">
                <span className="cnp-jeton" data-j={e === 'retenue' ? 'retenu' : e === 'ecartee' ? 'ecart' : e}>{MOT_OPTION[e]}</span>
                {info.prix && <span className="cnp-opt-prix">{info.prix}</span>}
                {info.dispo && <span className="cnp-opt-dispo cn-mut">{info.dispo}</span>}
              </span>
              {raison && raison.toLowerCase() !== 'pas pris' && <span className="cnp-opt-raison cn-mut">« {raison} »</span>}
            </>
          );
          return (
            <li key={f.id} data-etat={e} data-ouverte={ouverte === f.id ? '' : undefined}>
              {onOption
                ? <button type="button" className="cnp-opt" aria-expanded={ouverte === f.id} aria-label={`${f.nom}, ${MOT_OPTION[e]}, changer`} onClick={() => { setRaisonPour(null); setOuverte(o => (o === f.id ? null : f.id)); }}>{contenu}</button>
                : <div className="cnp-opt">{contenu}</div>}
            </li>
          );
        })}
      </ul>
      {onOption && choisie && (
        <div className="cnp-opt-gestes" role="group" aria-label={`${choisie.nom} : changer l'état`}>
          {raisonPour === choisie.id ? (
            <form className="cnp-raison" onSubmit={ev => { ev.preventDefault(); onOption(choisie.id, 'ecartee', raison.trim() || undefined); fermer(); }}>
              <input className="cnp-raison-champ" value={raison} onChange={ev => setRaison(ev.target.value)} placeholder="Pourquoi pas ? (facultatif)" aria-label="Raison de l'écart" autoFocus enterKeyHint="done" />
              <button type="submit" className="cnp-btn cnp-btn-plein"><Check size={16} aria-hidden /> Écarter</button>
              <button type="button" className="cnp-btn" aria-label="Annuler" onClick={() => setRaisonPour(null)}><X size={16} aria-hidden /></button>
            </form>
          ) : GESTES.map(g => {
            const actif = etatOption(choisie) === g.vers;
            return (
              <button key={g.vers} type="button" className="cnp-btn" aria-pressed={actif} disabled={actif}
                onClick={() => { if (g.vers === 'ecartee') { setRaisonPour(choisie.id); return; } onOption(choisie.id, g.vers); fermer(); }}>{g.libelle}</button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** « ✓ trouvé 1 · ✗ pas trouvé 2 · devis 850 · ≈ 910 CHF » : les jetons du diagnostic sur une rangée ; rien de compté, pas de rangée. */
export function RangeeJetons({ resume, nom = 'Où en est le diagnostic' }: { resume: ResumeJetons | null; nom?: string }) {
  if (!resume || (!resume.trouve && !resume.pasTrouve && !resume.devis && !resume.total && !resume.fourchette && !resume.retenu)) return null;
  return (
    <div className="cnp-jetons" role="group" aria-label={nom}>
      {resume.trouve > 0 && <span className="cnp-jeton" data-j="trouve"><Check size={14} aria-hidden /> trouvé {resume.trouve}</span>}
      {resume.pasTrouve > 0 && <span className="cnp-jeton" data-j="pas"><X size={14} aria-hidden /> pas trouvé {resume.pasTrouve}</span>}
      {resume.devis && <span className="cnp-jeton" data-j="devis">{resume.devis.centimes !== undefined ? `devis ${montant(resume.devis.centimes)}` : resume.devis.n > 1 ? `${resume.devis.n} devis` : 'devis'}</span>}
      <span className="cn-sp" />
      {!resume.retenu && resume.fourchette && <b className="cnp-total" data-fourchette title={resume.fourchette.n === 1 ? 'Le prix de la seule piste chiffrée' : `${resume.fourchette.n} options, l'une ou l'autre : jamais additionnées`}>{resume.fourchette.min === resume.fourchette.max ? `${resume.fourchette.n === 1 ? '' : '≈ '}${montant(resume.fourchette.min)} CHF` : `${montant(resume.fourchette.min)} à ${montant(resume.fourchette.max)} CHF`}</b>}
      {resume.retenu && <b className="cnp-total" data-retenu title="Coût de l'option retenue">{montant(resume.retenu.centimes)} CHF</b>}
      {!resume.retenu && resume.total && <b className="cnp-total" title={`Somme de ${resume.total.n} montants écrits, en francs`}>≈ {montant(resume.total.centimes)} CHF</b>}
    </div>
  );
}
