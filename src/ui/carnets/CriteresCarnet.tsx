/** La ligne Critère du carnet ouvert (« Ce qui compte », h05-3), sortie de CarnetOuvert.tsx : un hook qui rend ses morceaux. */
import React, { useRef, useState } from 'react';
import { ChevronDown, Ellipsis, Target } from 'lucide-react';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { pluriel } from '../../domain/carnets/comptes';
import { uniquesParTexte } from '../../domain/carnets/doublons';
import type { ContenuCarnetV, CritereV } from './EtatIA';
import { LigneRangee } from './LigneRangee';
import type { CarnetOuvertProps, RangeeV } from './carnetOuvertTypes';

export function useCriteresCarnet(p: Pick<CarnetOuvertProps, 'cadre' | 'onRetirerCritere'>, k: ContenuCarnetV, r: RangeeV | null | undefined,
  provenance: (el: CritereV) => string | null, avecProv: (el: CritereV) => string) {
  const [voirCriteres, setVoirCriteres] = useState(false);
  const [gererCriteres, setGererCriteres] = useState(false);
  /* « Ce qui compte » (h05-3 ; critique 5, n° 1 et 22) : **une ligne** « Critère : <ce qui range> · proposé par l'IA ». Ce qui range =
     les critères qui ont une caractéristique, dans leur ordre (« tient 80 °C, puis le débit »), comme Comparer ; sinon le premier
     critère. La provenance dit la vérité de chacun : « de votre phrase » seulement pour ce qui vient de lui. Les autres critères (sans
     valeur à comparer) sont rangés derrière « +1 sans valeur », un toucher les montre ; un critère tout juste rangé (rangée) les ouvre.
     P11 : un critère par texte normalisé. */
  const criteres = uniquesParTexte(k.criteres);
  /* critique 6, n° 14 (g5:v03-8, D-38) : chaque critère est écrit une fois. Le critère tout juste rangé ne se dit que dans sa ligne
     rangée (« ✓ Rangé ici · Annuler »), jamais en plus dans la ligne Critère ni dans une sous-liste de tous les critères. */
  const uRange = r && r.cible === 'critere' ? criteres.find(u => u.ids.includes(r.id)) : undefined;
  const critereRange = !!uRange;
  const autres = uRange ? criteres.filter(u => u !== uRange) : criteres;
  const classants = autres.filter(u => u.el.caracteristique);
  const tete = classants.length ? classants : autres.slice(0, 1);
  const derriere = autres.filter(u => !tete.includes(u));
  const provsTete = [...new Set(tete.map(u => provenance(u.el)))];
  /* n° 34 : « 1 critère sans valeur à comparer ⌄ », compté sans le critère rangé ; pendant que l'IA range (un cadre de geste est
     posé), le compte reste celui d'avant l'envoi : il ne bouge pas sous les yeux. */
  const derriereAvant = useRef(derriere.length);
  if (!p.cadre) derriereAvant.current = derriere.length;
  const nDerriere = p.cadre ? derriereAvant.current : derriere.length;
  const texteTete = (
    <>
      {tete.map((u, i) => (
        <React.Fragment key={u.ids[0]}>
          {i > 0 ? ', puis ' : ''}<b>{u.el.texte}</b>
          {provsTete.length > 1 && avecProv(u.el) && <span className="cn-mut">{avecProv(u.el)}</span>}
        </React.Fragment>
      ))}
      {provsTete.length === 1 && provsTete[0] && <span className="cn-mut"> · {provsTete[0]}</span>}
    </>
  );
  /* La phrase du critère rangé : citée une fois. Si le critère est sa phrase même (normalisée), « · de votre phrase » le dit déjà. */
  const phraseRangee = uRange && r?.phrase && normaliser(r.phrase) !== normaliser(uRange.el.texte) ? r.phrase : undefined;
  /* n° 34 : à la suite de la ligne Critère (h05-3 n'a qu'une ligne : pas une ligne de plus à 390) */
  const plusCriteres = nDerriere > 0 ? (
    <button type="button" className="cn-lien cn-critere-plus" aria-expanded={voirCriteres} onClick={() => setVoirCriteres(v => !v)}>
      {pluriel(nDerriere, 'critère')} sans valeur à comparer <ChevronDown size={15} aria-hidden className={voirCriteres ? 'cn-tourne' : undefined} />
    </button>
  ) : null;
  const rangeeCritere = uRange && r ? (
    <LigneRangee phrase={phraseRangee} rangeSur={r.rangeSur} onAnnuler={r.onAnnuler} onVotreTexte={r.onVotreTexte} onDeplacer={r.onDeplacer} onChangerEnNote={r.onChangerEnNote}>
      <p className="cn-critere cn-critere-court"><b>{uRange.el.texte}</b><span className="cn-mut">{avecProv(uRange.el)}{uRange.el.caracteristique ? '' : ' · sans valeur à comparer'}</span></p>
    </LigneRangee>
  ) : null;
  /* L-20 (23.11, M3-1) : aucun geste ne retirait un critère (appui court, long, ⋯ du carnet : rien). Comme chaque note a son ⋯ (R12),
     la ligne Critère a le sien : il montre chaque critère, une fois, avec « Retirer ». */
  const boutonCriteres = p.onRetirerCritere ? (
    <button type="button" className="cn-ico cn-critere-actions" aria-label="Critères, actions" aria-expanded={gererCriteres} onClick={() => setGererCriteres(v => !v)}><Ellipsis size={22} aria-hidden /></button>
  ) : null;
  const listeCriteres = gererCriteres && p.onRetirerCritere ? (
    <div className="cn-criteres-derriere" role="list" aria-label="Critères">
      {criteres.map(u => (
        <p key={u.ids[0]} className="cn-critere cn-critere-court cn-critere-retirable" role="listitem">
          <span className="cn-sp"><b>{u.el.texte}</b><span className="cn-mut">{avecProv(u.el)}</span></span>
          <button type="button" className="cn-lien" aria-label={`Retirer le critère « ${u.el.texte} »`} onClick={() => p.onRetirerCritere!(...u.ids)}>Retirer</button>
        </p>
      ))}
    </div>
  ) : null;
  const ligneCritere = criteres.length > 0 && (
    <section className="cn-critere-bloc" aria-label="Ce qui compte">
      {tete.length > 0 && (
        <p className="cn-critere cn-critere-une">
          <Target size={18} aria-hidden className="cn-vert cn-critere-ico" />
          <span className="cn-sp"><span className="cn-critere-tx">Critère : {texteTete}</span>{plusCriteres && <> <span className="cn-mut" aria-hidden>·</span> {plusCriteres}</>}</span>
          {boutonCriteres}
        </p>
      )}
      {rangeeCritere}
      {tete.length === 0 && plusCriteres}
      {listeCriteres}
      {voirCriteres && !listeCriteres && derriere.length > 0 && (
        <div className="cn-criteres-derriere" role="list" aria-label="Critères sans valeur à comparer">
          {derriere.map(u => (
            <p key={u.ids[0]} className="cn-critere cn-critere-court" role="listitem">
              <b>{u.el.texte}</b>
              <span className="cn-mut">{avecProv(u.el)}{u.el.raison ? ` · ${u.el.raison}` : ''}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
  return { criteres, tete, texteTete, boutonCriteres, rangeeCritere, listeCriteres, ligneCritere };
}
