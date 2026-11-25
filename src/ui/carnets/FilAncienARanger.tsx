/**
 * R95 (c74c) : un fil écrit avant le port du suivi, rangé À L'OUVERTURE par l'analyse locale : la carte PROPOSE (options, Résolu, tâches) ; rien n'est écrit avant
 * « Ranger » (un geste de lui, annulable) ; « Laisser » la retire pour cette ouverture. Les options se lisent comme celles d'un problème (même grille, mêmes jetons).
 * Provenance : le picto du calcul local (Q19), jamais le ✻ de l'IA.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PropositionFilAncien } from '../../domain/carnets/filAncien';
import { Provenance } from './EtatIA';
import { VignetteObjet } from './pictos';
import { Insec } from './insecable';

export function FilAncienARanger({ proposition: p, onRanger }: { proposition: PropositionFilAncien; onRanger: (avecResolu: boolean) => void }) {
  const [laisse, setLaisse] = useState(false);
  const [avecResolu, setAvecResolu] = useState(true);
  if (laisse) return null;
  return (
    <section className="cnp-options cnp-propose" aria-label="Ranger ce fil ?" data-fil-ancien>
      <p className="cn-mut cnp-propose-tete"><Provenance origine="locale" titre="calculé sur place, rien n’est écrit avant votre OK" /> Ce fil se range comme un problème ? <span>Rien n’est écrit avant votre OK.</span></p>
      {p.options.length > 0 && (
        <ul className="cnp-opt-grille" aria-label="Options proposées">
          {p.options.map(o => (
            <li key={o.nom} data-etat="piste">
              <div className="cnp-opt">
                <VignetteObjet mots={[o.nom]} classe="cnp-opt-vignette" taille={30} />
                <span className="cnp-opt-nom"><Insec t={o.nom} /></span>
                <span className="cnp-opt-info"><span className="cnp-jeton" data-j="piste">piste proposée</span></span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {p.resolu && (
        <label className="cnp-propose-ligne">
          <input type="checkbox" checked={avecResolu} onChange={e => setAvecResolu(e.target.checked)} />
          <span><b>Résolu ?</b> <span className="cn-mut">« {p.resolu.phrase} »</span></span>
        </label>
      )}
      {p.taches.map(t => (
        <p key={t.texte} className="cnp-propose-ligne"><span><b>Tâche</b> <span className="cn-mut">« {t.texte} »</span></span></p>
      ))}
      <div className="cnp-propose-gestes">
        <button type="button" className="cn-action cn-action-vert" onClick={() => onRanger(avecResolu && !!p.resolu)}><Check size={16} aria-hidden /> Ranger</button>
        <button type="button" className="cn-second" onClick={() => setLaisse(true)}>Laisser</button>
      </div>
    </section>
  );
}
