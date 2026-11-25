/**
 * D451 (maquettes3/v01 « resolu », greffe v05 « avant / après » et tuiles, greffe v03 question « pourquoi ») : un problème résolu.
 * De haut en bas : la paire avant / après (changeable) ; le tampon « Résolu en 27 jours », « Fermé grâce à l'achat du … », les options fermées avec
 * leur raison, « Rangé : Domaine › … » ; la question honnête si ses notes ne disent pas pourquoi ; « Résolus en 2026 · 5 · le dernier en vert » en
 * tuiles (photo, sinon le picto de la catégorie) ; « ira dans Réalisés » (seulement si un plan est lié) et Rouvrir ; le fil, replié sous « Le fil ▸ ».
 * Rien n'est inventé : une date, une durée ou une raison absentes ne se disent pas.
 */
import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Folder, RotateCcw, Sparkles } from 'lucide-react';
import type { CarnetDoc, MessageDoc, Photo } from '../../domain/carnets/modele';
import { avantApresDe, categorieDe, dureeDe, jourLocal, optionRetenue, suiviDe } from '../../domain/carnets/suivi';
import type { LienV, RappelsSuivi } from './carnetOuvertTypes';
import { VignetteObjet } from './pictos';
import { QuestionPourquoi } from './QuestionPourquoi';
import { cheminAffiche, deNom, destinationPlan, infoOption, libelleJour, optionsFermees, resolusDe, texteDuree, texteFermeture } from './filRegles';
import { montant } from './EtatIA';

export interface PropsResolu {
  c: CarnetDoc;
  carnets: readonly CarnetDoc[];
  messages: readonly MessageDoc[];
  rappels?: RappelsSuivi;
  liens?: readonly LienV[];
  annee: number;
  /** Ouvrir un autre résolu (tuile). */
  onOuvrir?: (carnetId: string) => void;
  onRelecture?: () => void;
  /** Le fil du carnet, replié sous « Le fil ▸ ». */
  fil?: React.ReactNode;
  nbFil?: number;
}

const messagesDe = (c: CarnetDoc, messages: readonly MessageDoc[]) => messages.filter(m => m.carnetMessage.depuis === c.id || m.carnetMessage.effets.some(e => e.carnetId === c.id));

/** « Fermer grâce à l'achat du condenseur B ? Oui · Annuler » : proposée quand le fil ou le plan dit que l'option retenue est achetée ; Annuler la remet à plus tard. */
export function CarteFermerParAchat({ option, onOui, onAnnuler }: { option: string; onOui: () => void; onAnnuler: () => void }) {
  return (
    <div className="cnp-question cnp-fermer" data-question="fermer" role="group" aria-label="Fermer grâce à l'achat ?">
      <Check size={18} aria-hidden />
      <span className="cn-sp"><b>Fermer grâce à l'achat {deNom(option)} ?</b></span>
      <button type="button" className="cnp-btn cnp-btn-plein" onClick={onOui}>Oui</button>
      <button type="button" className="cnp-btn" onClick={onAnnuler}>Annuler</button>
    </div>
  );
}

export function ResoluProbleme({ c, carnets, messages, rappels, liens, annee, onOuvrir, onRelecture, fil, nbFil }: PropsResolu) {
  const [choix, setChoix] = useState<'avant' | 'apres' | null>(null);
  const [filOuvert, setFilOuvert] = useState(false);
  const mes = messagesDe(c, messages);
  const av = avantApresDe(c, mes);
  const jourPhoto = (ph?: Photo): string | null => {
    const m = ph?.messageId ? mes.find(x => x.id === ph.messageId) : undefined;
    return m ? libelleJour(jourLocal(m.carnetMessage.le), annee) : null;
  };
  const resolu = suiviDe(c).resolu;
  const duree = texteDuree(dureeDe(c));
  const fermeture = texteFermeture(c);
  const fermees = optionsFermees(c, annee);
  const retenue = optionRetenue(c);
  const { tuiles } = resolusDe(carnets, messages, annee);
  /* C69-5 : une option pas prise garde son prix (l'article lié, ou le coût écrit pour elle) */
  const prixFermee = (o: { id: string }): string | null => {
    if (o.id.startsWith('art:')) { const a = c.carnet.articles.find(x => x.id === o.id.slice(4)); const m = a ? montant(a.prixCentimes) : null; return m === null ? null : `${m} ${a?.devise ?? 'CHF'}`; }
    const f = c.carnet.facons.find(x => x.id === o.id);
    return f ? infoOption(c, mes, f).prix : null;
  };
  /* C67-5 (maquette v01-resolu) : un problème résolu autrement que par un achat (réparation, geste, texte) est lui-même un réalisé : « ira dans Réalisés ».
     Fermé par un achat, c'est le plan de l'achat qui y va : sans plan lié, rien ne se dit (D451, carnetsProblemeEcran). Un plan déjà réalisé le dit au présent. */
  const plan = destinationPlan(liens) ?? (resolu?.par?.sorte === 'achat' ? null : 'ira');
  const cat = categorieDe(c);
  const photoApres = av?.apres, photoAvant = av?.avant;
  const jourApres = jourPhoto(photoApres) ?? (resolu ? libelleJour(jourLocal(resolu.le), annee) : null);
  const choisir = (quel: 'avant' | 'apres', id: string) => { if (quel === 'avant') rappels?.onAvantApres?.(id, undefined); else rappels?.onAvantApres?.(undefined, id); setChoix(null); };

  return (
    <div className="cnp-resolu" data-resolu>
      {(photoAvant || photoApres) && (
        <div className="cnp-avap" aria-label="Avant et après">
          {photoAvant && (
            <figure><img src={photoAvant.jpeg} alt="Avant" /><figcaption className="cnp-avap-l">avant{jourPhoto(photoAvant) ? ` · ${jourPhoto(photoAvant)}` : ''}</figcaption>
              {rappels?.onAvantApres && c.carnet.photos.length > 1 && <button type="button" className="cnp-avap-changer" aria-label="Changer la photo d'avant" onClick={() => setChoix(x => (x === 'avant' ? null : 'avant'))}>Changer</button>}</figure>
          )}
          {photoApres && (
            <figure><img src={photoApres.jpeg} alt="Après" /><figcaption className="cnp-avap-l cnp-avap-apres">après{jourApres ? ` · ${jourApres}` : ''}</figcaption>
              {rappels?.onAvantApres && c.carnet.photos.length > 1 && <button type="button" className="cnp-avap-changer" aria-label="Changer la photo d'après" onClick={() => setChoix(x => (x === 'apres' ? null : 'apres'))}>Changer</button>}</figure>
          )}
        </div>
      )}
      {choix && (
        <div className="cnp-choix-photo" role="group" aria-label={choix === 'avant' ? 'Photo d’avant' : 'Photo d’après'}>
          {c.carnet.photos.map(ph => <button key={ph.id} type="button" className="cnp-choix-vign" aria-label={`Prendre cette photo${jourPhoto(ph) ? ` du ${jourPhoto(ph)}` : ''}`} onClick={() => choisir(choix, ph.id)}><img src={ph.jpeg} alt="" /></button>)}
        </div>
      )}

      <div className="cnp-tampon">
        <div className="cnp-tampon-tete"><span className="cnp-coche" aria-hidden><Check size={22} /></span><span className="cnp-tampon-titre">Résolu{duree ? <> <span className="cnp-tampon-duree">{duree}</span></> : null}</span></div>
        {fermeture && <p className="cnp-fermeture">{fermeture}</p>}
        {retenue && resolu?.par?.sorte !== 'achat' && <p className="cnp-fermeture" data-retenue>Retenu : {retenue.nom}{infoOption(c, mes, retenue).prix ? ` · ${infoOption(c, mes, retenue).prix}` : ''}</p>}
        {fermees.length > 0 && (
          <ul className="cnp-fermees" aria-label="Options fermées">
            {fermees.map(o => (
              <li key={o.id}>
                <VignetteObjet photo={c.carnet.articles.find(a => a.faconId === o.id && a.photo)?.photo} mots={[o.nom]} classe="cnp-opt-vignette" taille={28} />
                <span className="cn-sp">{o.nom}</span><span className="cnp-jeton" data-j="ecart">{o.texte}</span>
                {prixFermee(o) && <span className="cnp-opt-prix">{prixFermee(o)}</span>}
                {o.raison && <span className="cn-mut cnp-raison">« {o.raison} »</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="cnp-range">{cat?.origine === 'vous' ? <Folder size={16} aria-hidden /> : <Sparkles size={16} aria-hidden />} <span>Rangé : {cheminAffiche(c)}</span></p>
      </div>

      <QuestionPourquoi c={c} messages={mes} onEcrire={rappels?.onEcrire} />

      {tuiles.length > 0 && (
        <section className="cnp-tuiles" aria-label={`Résolus en ${annee}`}>
          <div className="cnp-tuiles-tete"><b>Résolus en {annee}</b><span className="cn-mut">{tuiles.length}{tuiles.length > 1 ? ' · le dernier en vert' : ''}</span><span className="cn-sp" />
            {onRelecture && <button type="button" className="cnp-lien" onClick={onRelecture}>Relire <ChevronRight size={14} aria-hidden /></button>}</div>
          <div className="cnp-tuiles-rang">
            {tuiles.map(t => {
              const noeud = t.jpeg ? <img src={t.jpeg} alt="" /> : <VignetteObjet mots={[t.titre, cheminAffiche(carnets.find(x => x.id === t.id)!)]} classe="cnp-opt-vignette" taille={34} />;
              return onOuvrir && t.id !== c.id
                ? <button key={t.id} type="button" className="cnp-tuile" data-dernier={t.dernier ? '' : undefined} aria-label={`${t.titre}, résolu`} onClick={() => onOuvrir(t.id)}>{noeud}</button>
                : <span key={t.id} className="cnp-tuile" data-dernier={t.dernier ? '' : undefined} data-ici={t.id === c.id ? '' : undefined} role="img" aria-label={`${t.titre}${t.id === c.id ? ' (celui-ci)' : ''}`}>{noeud}</span>;
            })}
          </div>
        </section>
      )}

      <div className="cnp-bas">
        {plan && <span className="cnp-jeton cnp-plan" data-j="achat">{plan === 'ira' ? 'ira dans Réalisés' : 'est dans Réalisés'}</span>}
        <span className="cn-sp" />
        {rappels?.onRouvrir && <button type="button" className="cnp-btn cnp-btn-rouvrir" onClick={rappels.onRouvrir}><RotateCcw size={16} aria-hidden /> Rouvrir</button>}
      </div>

      {fil && (
        <div className="cnp-fil-replie">
          <button type="button" className="cnp-lien cnp-fil-bouton" aria-expanded={filOuvert} onClick={() => setFilOuvert(o => !o)}>
            {filOuvert ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />} Le fil{nbFil ? ` · ${nbFil}` : ''}
          </button>
          {filOuvert && fil}
        </div>
      )}
    </div>
  );
}
