// Le mode Radar de Suggérer, tel que sa base v4.10 le montrait (suggestions-radar.html, radars m4 et h4 : « Radar: m4
// h4 très bien ») : les objectifs en rangées (verdict, ma bière → la meilleure voie), le grand radar à 12 axes (ma bière
// en contour, la voie montrée en plein, la zone du style), puis trois voies en lignes d'action : le changement, son
// moment « ‹ 10′ › » (plus tôt, plus tard ; par 5′, rien de figé), la dérive d'IBU, le stock, « Montrer sur le radar »
// et « Appliquer à la recette » (Annuler la retire). « +n » montre les autres voies. Tout vient du moteur en direct.
import { useMemo, useState } from 'react';
import type { FamilyId } from '../../../../src/engine';
import { COURT, nombre, type Echelle } from '../../commun';
import { useGestes, useRecette } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import type { AjoutParcours, Quand } from '../../etat/types';
import type { BiereLue } from '../../moteur';
import { houblon } from '../../moteur';
import { Stock } from './briques';
import { Radar } from './radar';
import { lireVoie, memeQuand, momentsChauds, nomQuand, verdict, type Groupe, type Ligne, type Objectif } from './voies';

const MONTREES = 3;

/** Le changement d'abord, comme la base : verbe, houblon(s), dose. */
function changement(l: Ligne) {
  const a = l.voie.actions;
  const nom = (k: string) => <span key={k} data-houblon={k}>{houblon(k).nom}</span>;
  if (l.geste === 'assembler') return <>Assembler {nom(a[0].hopKey)} + {nom(a[1].hopKey)} {a[0].grams} + {a[1].grams} g</>;
  if (l.geste === 'remplacer') return <>Remplacer {a[0].previousHopKey ? houblon(a[0].previousHopKey).nom : ''} par {nom(a[0].hopKey)} {a[0].grams} g</>;
  return <>Ajouter {a.map((x, i) => <span key={x.hopKey}>{i > 0 ? ' + ' : ''}{nom(x.hopKey)}</span>)} {a.reduce((s, x) => s + x.grams, 0)} g</>;
}
const texteVoie = (l: Ligne) => l.voie.label.replace(/\./g, ',');

export function VueRadar({ biere, sc, echelle, objectifs, groupes, onHorsHoublon, famHors, pistesHors }: {
  biere: BiereLue; sc: Parameters<typeof Radar>[0]['sc']; echelle: Echelle; objectifs: Objectif[]; groupes: Groupe[];
  onHorsHoublon: () => void; famHors: FamilyId | undefined; pistesHors: number;
}) {
  const recette = useRecette();
  const gestes = useGestes();
  // Les voies du moteur à chaud, comme la base (son mode Radar listait les voies de proposer, décalables de 60′ au
  // whirlpool) ; le dry hop actif reste dans les barres.
  const lignes = groupes.flatMap((g) => g.lignes).filter((l) => l.geste !== 'dryhop');
  const [moments, setMoments] = useState<Record<string, Quand>>({});
  const [montree, setMontree] = useState<string | null>(null);
  const [tous, setTous] = useState(false);
  const [applique, setApplique] = useState<{ id: string; texte: string; defaire: () => void } | null>(null);
  const montrees = lignes.slice(0, MONTREES);
  const autres = lignes.slice(MONTREES);
  const vus = tous ? lignes : montrees;
  const idMontree = montree && lignes.some((l) => l.id === montree) ? montree : montrees[0]?.id ?? null;

  // Le moment de la voie : celui du moteur, ou décalé ; le décalage ne vaut qu'à chaud (la base), le dry hop garde le sien.
  const momentDe = (l: Ligne): Quand | null => moments[l.id] ?? null;
  const quandMoteur = (l: Ligne): Quand => {
    const x = l.voie.actions[0];
    return quandDe({ id: x.additionId, hopKey: x.hopKey, grams: x.grams, moment: x.moment } as AjoutParcours, recette);
  };
  const lus = useMemo(() => Object.fromEntries(vus.map((l) => [l.id, lireVoie(recette, l.voie, momentDe(l))])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recette, vus.map((l) => l.id).join(), JSON.stringify(moments)]);
  const lm = idMontree ? lignes.find((l) => l.id === idMontree) ?? null : null;
  const luM = lm ? lus[lm.id] ?? lireVoie(recette, lm.voie, momentDe(lm)) : null;
  const series = lm && luM?.effets ? [{ cle: lm.id, nom: `${lm.houblons.map((h) => h.nom).join(" + ")} · ${nomQuand(momentDe(lm) ?? quandMoteur(lm))}`, effets: Object.fromEntries(Object.entries(luM.effets)) as Record<FamilyId, number | null> }] : [];

  const bouger = (l: Ligne, d: -1 | 1) => {
    const L = momentsChauds(recette), q = momentDe(l) ?? quandMoteur(l);
    const i = L.findIndex((x) => memeQuand(x, q));
    const j = Math.max(0, Math.min(L.length - 1, (i < 0 ? 0 : i) + d));
    setMoments({ ...moments, [l.id]: L[j] });
  };
  const appliquer = (l: Ligne) => {
    if (applique) applique.defaire();
    const q = momentDe(l), avant = recette;
    for (const x of l.voie.actions) {
      if (x.op === 'ajouter') {
        const a: AjoutParcours = { id: x.additionId, hopKey: x.hopKey, grams: x.grams, moment: x.moment };
        gestes.ajouter('recette', a);
        if (q) gestes.moment('recette', a.id, q);
      } else if (x.op === 'modifier') {
        gestes.remplacer('recette', x.additionId, x.hopKey);
        gestes.dose('recette', x.additionId, x.grams);
        if (q) gestes.moment('recette', x.additionId, q);
      }
    }
    const defaire = () => {
      for (const x of l.voie.actions) {
        if (x.op === 'ajouter') gestes.retirer('recette', x.additionId);
        else if (x.op === 'modifier') {
          const a0 = avant.additions.find((a) => a.id === x.additionId);
          if (!a0) continue;
          gestes.remplacer('recette', a0.id, a0.hopKey);
          gestes.dose('recette', a0.id, a0.grams);
          gestes.moment('recette', a0.id, quandDe(a0, avant));
        }
      }
    };
    setApplique({ id: l.id, texte: `${texteVoie(l)}${q ? ` · ${nomQuand(q)}` : ''}`, defaire });
  };

  return (
    <div className="space-y-2" data-role="vue-radar">
      <section aria-label="Objectifs" className="space-y-1.5">
        {objectifs.map((o) => {
          const v = verdict(o, groupes);
          const apres = o.avant != null && v.meilleure && v.effet != null ? o.avant + v.effet : null;
          return (
            <div key={o.f} data-role="objectif" data-objectif={o.f} className="pq-sg-rang flex items-center gap-3 rounded-lg px-3 py-2">
              <i aria-hidden="true" className={`pq-sg-glyphe pq-sg-glyphe-${v.mot.toLowerCase()}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-cave-400 leading-tight">{o.sens > 0 ? '▲' : '▼'} {COURT[o.f]}</span>
                <span className="block leading-tight"><b className="text-xl font-extrabold text-cave-50">{v.mot}</b>{v.mot === 'Aucune' && <span className="text-sm font-bold text-cave-50"> voie houblon</span>}</span>
                {o.avant != null && <span className="block font-mono text-xs text-cave-200">{nombre(o.avant, 0)} → {apres != null ? nombre(apres, 0) : '—'}</span>}
              </span>
              {v.mot === 'Aucune' && o.f === famHors && pistesHors > 0 && (
                <button type="button" onClick={onHorsHoublon} className="pq-sg-hh-radar h-11 px-3 rounded-full text-sm font-bold whitespace-nowrap">Hors houblon</button>
              )}
            </div>
          );
        })}
      </section>
      <Radar biere={biere} sc={sc} echelle={echelle} series={series} plein />
      {luM && !luM.effets && <p className="text-xs text-cave-400 px-1">À ce moment, {luM.raison} : la voie n’est pas dessinée.</p>}
      {applique && (
        <p className="flex items-center gap-2 px-1 text-sm text-cave-200">
          <span className="flex-1 min-w-0">Appliqué : <b className="text-cave-50">{applique.texte}</b></span>
          <button type="button" onClick={() => { applique.defaire(); setApplique(null); }} aria-label="Annuler : retirer cette voie de la recette"
            className="h-11 px-3 rounded-full border-2 border-cave-50 text-sm font-bold">Annuler</button>
        </p>
      )}
      <ul aria-label="Voies du moteur" className="space-y-1.5">
        {vus.map((l, n) => {
          const lu = lus[l.id];
          const on = l.id === idMontree;
          const q = momentDe(l) ?? quandMoteur(l);
          const L = momentsChauds(recette), i = L.findIndex((x) => memeQuand(x, q));
          const chaud = l.geste !== 'dryhop' && i >= 0;
          return (
            <li key={l.id} data-voie-radar={l.id} className={`pq-sg-rl grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-2 rounded-lg px-2 py-1.5 ${on ? 'pq-sg-rl-on' : ''}`}>
              <span aria-hidden="true" className="pq-sg-rl-n">{n + 1}</span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-bold text-cave-50 leading-tight">{changement(l)}</span>
                {chaud ? (
                  <span className="pq-sg-mom mt-0.5">
                    <button type="button" disabled={i <= 0} aria-label={`Plus tôt${i > 0 ? ` : ${nomQuand(L[i - 1])}` : ''}`} onClick={() => bouger(l, -1)} className="pq-sg-mom-b pq-sg-mom-tot" />
                    <b data-role="quand">{nomQuand(q)}</b>
                    <button type="button" disabled={i >= L.length - 1} aria-label={`Plus tard${i < L.length - 1 ? ` : ${nomQuand(L[i + 1])}` : ''}`} onClick={() => bouger(l, 1)} className="pq-sg-mom-b pq-sg-mom-tard" />
                  </span>
                ) : <span className="pq-suggerer-moment mt-0.5">{nomQuand(q)}</span>}
              </span>
              <span className="flex items-center gap-1">
                <span data-role="ibu" title={lu ? `IBU après la voie : ${nombre(lu.apres.ibu.valeur, 1)}` : 'IBU à recalculer'} className="font-mono text-sm font-semibold text-cave-50 w-10 text-right">
                  {lu ? `${lu.derive >= 0 ? '+' : '−'}${nombre(Math.abs(lu.derive), 1)}` : '?'}
                </span>
                <Stock etat={l.stock} />
                <button type="button" aria-pressed={on} onClick={() => setMontree(l.id)} aria-label={`${on ? 'Montrée sur le radar' : 'Montrer sur le radar'} : ${texteVoie(l)}`}
                  className="w-11 h-11 inline-flex items-center justify-center"><i aria-hidden="true" className={`pq-sg-losange ${on ? 'pq-sg-losange-on' : ''}`} /></button>
                <button type="button" data-action="appliquer" aria-pressed={applique?.id === l.id} onClick={() => (applique?.id === l.id ? (applique.defaire(), setApplique(null)) : appliquer(l))}
                  aria-label={applique?.id === l.id ? 'Annuler : retirer cette voie de la recette' : `Appliquer à la recette : ${texteVoie(l)}`}
                  className="w-11 h-11 inline-flex items-center justify-center"><span className="pq-sg-appliquer"><i aria-hidden="true" className="pq-suggerer-coche" /></span></button>
              </span>
            </li>
          );
        })}
      </ul>
      {autres.length > 0 && (
        <button type="button" aria-expanded={tous} onClick={() => setTous(!tous)} aria-label={`${tous ? 'Replier les' : 'Voir les'} ${autres.length} autres voies`}
          className="pq-sg-rl-plus h-11 px-4 rounded-full text-sm font-bold">{tous ? '−' : `+${autres.length}`}</button>
      )}
    </div>
  );
}
