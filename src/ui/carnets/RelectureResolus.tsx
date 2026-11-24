/**
 * D451 (maquettes3/v01 « relecture ») : relire un problème résolu, des mois plus tard. La recherche ; la fiche « problème / essayé / pris / pourquoi / durée »
 * (ses notes citées mot pour mot) avec l'avant → l'après et « Le fil ▸ » ; « Toujours le bon choix ? · Oui · Pas sûr » ; les autres résolus, par catégorie.
 * Une ligne sans source est absente : jamais « pourquoi : — » inventé. La route `relecture` est branchée par la vue des carnets.
 */
import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import type { CarnetDoc, MessageDoc } from '../../domain/carnets/modele';
import { avantApresDe, suiviDe } from '../../domain/carnets/suivi';
import { VignetteObjet } from './pictos';
import { QuestionRelu } from './QuestionPourquoi';
import { chercherResolus, cheminAffiche, ficheResolu, libelleJour, parCategorie } from './filRegles';
import { jourLocal } from '../../domain/carnets/suivi';

export interface PropsRelecture {
  carnets: readonly CarnetDoc[];
  messages: readonly MessageDoc[];
  /** Les gestes (Relu) pour le carnet affiché : `onRelu(carnetId, réponse)`. */
  rappels?: { onRelu?: (carnetId: string, reponse: 'oui' | 'pas-sur') => void };
  /** « Le fil ▸ » : ouvre ce carnet. */
  onOuvrir?: (carnetId: string) => void;
  /** Recherche de départ. */
  requete?: string;
}

const lieesDe = (c: CarnetDoc, messages: readonly MessageDoc[]) => messages.filter(m => m.carnetMessage.depuis === c.id || m.carnetMessage.effets.some(e => e.carnetId === c.id));

export function RelectureResolus({ carnets, messages, rappels, onOuvrir, requete = '' }: PropsRelecture) {
  const [q, setQ] = useState(requete);
  const [choisi, setChoisi] = useState<string | null>(null);
  const resolus = useMemo(() => carnets.filter(c => suiviDe(c).etat === 'resolu').sort((a, b) => (suiviDe(b).resolu?.le ?? '').localeCompare(suiviDe(a).resolu?.le ?? '')), [carnets]);
  const trouves = useMemo(() => chercherResolus(resolus, messages, q), [resolus, messages, q]);
  const fiche = trouves.find(c => c.id === choisi) ?? trouves[0];
  const autres = trouves.filter(c => c.id !== fiche?.id);
  const groupes = parCategorie(autres);

  return (
    <article className="cn-page cn-ouvert cnp-relecture" aria-label="Résolus">
      <div className="cnp-recherche">
        <Search size={18} aria-hidden />
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher dans les résolus" aria-label="Chercher dans les résolus" enterKeyHint="search" autoComplete="off" />
      </div>
      {resolus.length === 0 && <p className="cn-mut cnp-vide">Aucun problème résolu pour l'instant.</p>}
      {resolus.length > 0 && !fiche && <p className="cn-mut cnp-vide">Aucun résolu ne parle de « {q.trim()} ».</p>}
      {fiche && <FicheRelue c={fiche} messages={messages} onOuvrir={onOuvrir} onRelu={rappels?.onRelu ? r => rappels.onRelu!(fiche.id, r) : undefined} />}
      {groupes.length > 0 && (
        <section aria-label="Autres résolus">
          <h3 className="cnp-h">Autres résolus <span className="cn-mut">par catégorie</span></h3>
          {groupes.map(g => g.carnets.map(c => {
            const f = ficheResolu(c, lieesDe(c, messages));
            const resolu = suiviDe(c).resolu;
            const detail = [c.carnet.suivi?.resolu?.par?.texte ? `« ${c.carnet.suivi.resolu.par.texte} »` : f.pris ? `pris : ${f.pris.nom}` : null, resolu ? libelleJour(jourLocal(resolu.le), new Date().getFullYear()) : null].filter(Boolean).join(' · ');
            return (
              <button key={c.id} type="button" className="cnp-ligne" onClick={() => setChoisi(c.id)} aria-label={`${c.title}, voir la fiche`}>
                <VignetteObjet mots={[c.title, g.chemin]} classe="cnp-opt-vignette" taille={30} />
                <span className="cn-sp"><b>{c.title}</b><span className="cn-mut">{g.chemin}{detail ? ` · ${detail}` : ''}</span></span>
              </button>
            );
          }))}
        </section>
      )}
    </article>
  );
}

function FicheRelue({ c, messages, onOuvrir, onRelu }: { c: CarnetDoc; messages: readonly MessageDoc[]; onOuvrir?: (id: string) => void; onRelu?: (r: 'oui' | 'pas-sur') => void }) {
  const mes = lieesDe(c, messages);
  const f = ficheResolu(c, mes);
  const av = avantApresDe(c, mes);
  return (
    <section className="cnp-fiche" aria-label={`Fiche : ${c.title}`}>
      <div className="cnp-fiche-tete">
        <VignetteObjet mots={[c.title, cheminAffiche(c)]} classe="cnp-opt-vignette" taille={34} />
        <span className="cn-sp"><b className="cnp-fiche-titre">{c.title}</b><span className="cn-mut">{f.chemin}</span></span>
        <span className="cnp-jeton" data-j="trouve">Résolu</span>
      </div>
      <dl className="cnp-q">
        {f.probleme && <><dt>problème</dt><dd>{f.probleme}</dd></>}
        {f.essaye.length > 0 && <><dt>essayé</dt><dd>{f.essaye.join(' · ')}</dd></>}
        {f.pris && <><dt>pris</dt><dd><b>{f.pris.nom}</b>{f.pris.prix ? `, ${f.pris.prix}` : ''}{f.pris.jour ? `, ${f.pris.jour}` : ''}</dd></>}
        <dt>pourquoi</dt>
        <dd>{f.pourquoi ? <>tes notes : {f.pourquoi.map((p, i) => <span key={i}>{i > 0 ? ' · ' : ''}« {p.texte} »</span>)}</> : <span className="cn-mut">tes notes ne le disent pas</span>}</dd>
        {f.duree && <><dt>durée</dt><dd>{f.duree}</dd></>}
      </dl>
      {(av?.avant || av?.apres) && (
        <div className="cnp-fiche-av">
          {av.avant && <img src={av.avant.jpeg} alt="Avant" />}
          {av.avant && av.apres && <span aria-hidden>→</span>}
          {av.apres && <img src={av.apres.jpeg} alt="Après" />}
          <span className="cn-sp" />
          {onOuvrir && <button type="button" className="cnp-lien" onClick={() => onOuvrir(c.id)}>Le fil <ChevronRight size={14} aria-hidden /></button>}
        </div>
      )}
      {!(av?.avant || av?.apres) && onOuvrir && <div className="cnp-fiche-av"><span className="cn-sp" /><button type="button" className="cnp-lien" onClick={() => onOuvrir(c.id)}>Le fil <ChevronRight size={14} aria-hidden /></button></div>}
      <QuestionRelu c={c} onRelu={onRelu} />
    </section>
  );
}
