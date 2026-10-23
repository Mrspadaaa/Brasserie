// Briques de la base v4.10 partagées par l'étape Houblons (index.html) et l'onglet Ma bière (biere.html) : le
// bandeau IBU · OG · EBC (pilule, jauge IBU au style), l'alerte dégustée, la barre de famille de la base (zone du
// style, zone « au-dessus » en pointillé, point dégusté plein ou « prévu » creux, inconnu hachuré « non situé »),
// et les mots de la levure. Classes propres préfixées pq-ma-biere- (L26).
import { COULEURS, COURT, Inconnu, Picto, nombre, type Echelle } from '../../commun';
import type { BiereLue, FamilleLue } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';

/** Noms de levure de la base (« SafAle US-05 ») ; toutes celles-ci sont caractérisées par le moteur (biotransformation). */
const LEVURES: Record<string, string> = {
  'fermentis-us05': 'SafAle US-05', 'lalbrew-pomona': 'LalBrew Pomona', 'lalbrew-verdant-ipa': 'LalBrew Verdant IPA', 'lalbrew-diamond': 'LalBrew Diamond',
};
export const nomLevureBase = (id: string | null | undefined) => (id ? LEVURES[id] ?? id : 'levure ?');

/** Familles hors du style par le haut, la dégustée d'abord. */
export function tropMarquees(biere: BiereLue, ordre: FamilyId[]) {
  return ordre.filter((f) => biere.profil[f].horsStyle === 'au-dessus')
    .sort((a, b) => (biere.profil[a].source === 'dégustation' ? -1 : 0) - (biere.profil[b].source === 'dégustation' ? -1 : 0));
}

export function Alerte({ biere, ordre, element }: { biere: BiereLue; ordre: FamilyId[]; element?: string }) {
  const trop = tropMarquees(biere, ordre);
  if (!trop.length) {
    return <p data-role="alerte" data-element={element} className="flex items-center gap-1.5 text-sm font-semibold text-hop"><span aria-hidden="true" className="w-2 h-2 rounded-full bg-hop" />Au style</p>;
  }
  return (
    <p data-role="alerte" data-element={element} className="flex items-center gap-1.5 min-w-0 text-base font-semibold text-alert">
      <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-alert shrink-0" />
      <span className="truncate">{trop.map((f) => COURT[f]).join(' et ')} trop marqué{trop.length > 1 ? 's' : ''}</span>
    </p>
  );
}

/** Bandeau IBU · OG · EBC, en pilule, avec la jauge de l'IBU face à la bande du style. */
export function Bandeau({ biere, avant, element }: { biere: BiereLue; avant?: BiereLue | null; element: string }) {
  const ibu = biere.ibu.valeur;
  const b = biere.bandeIbu;
  const max = b ? Math.max(b[1] * 1.4, ibu * 1.1) : Math.max(1, ibu * 1.5);
  const pc = (x: number) => `${Math.max(0, Math.min(100, (x / max) * 100)).toFixed(1)}%`;
  const ibuAvant = avant && Math.abs(avant.ibu.valeur - ibu) >= 0.5 ? avant.ibu.valeur : null;
  return (
    <div data-role="lectures" data-element={element} className="flex items-center justify-between gap-2 px-4 py-1.5 rounded-full border border-cave-700 bg-cave-900">
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-sm text-cave-400">IBU</span>
        <output data-role="ibu" data-valeur={ibu.toFixed(2)} className="reading text-xl">{nombre(ibu)}</output>
        {ibuAvant != null && <s data-role="vient-de-changer" className="font-mono text-xs text-cave-400">{nombre(ibuAvant)}</s>}
        {b && (
          <span aria-label={`style ${b[0]}–${b[1]} IBU`} role="img" className="relative self-center w-12 h-2 ml-1 rounded-full bg-cave-800">
            <i className="absolute inset-y-0 rounded-full bg-cave-600" style={{ left: pc(b[0]), width: `calc(${pc(b[1])} - ${pc(b[0])})` }} />
            <i className="absolute -top-1 -bottom-1 w-0.5 rounded-sm bg-cave-50" style={{ left: pc(ibu) }} />
          </span>
        )}
      </span>
      <span className="inline-flex items-baseline gap-1.5"><span className="text-sm text-cave-400">OG</span><span className="reading text-xl">{nombre(biere.og, 3)}</span></span>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-sm text-cave-400">EBC</span>
        {biere.ebc == null ? <Inconnu raison="couleur non calculée" /> : <span className="reading text-xl">{nombre(biere.ebc)}</span>}
      </span>
    </div>
  );
}

/** Position d'une valeur sur la piste : au style, la zone du style finit à 80 % et la zone « au-dessus » va
 * jusqu'à deux fois le haut de la bande ; en absolu, 0 → 110. */
export function positions(x: FamilleLue, echelle: Echelle) {
  const haut = x.bande?.[1] ?? null;
  const pos = (v: number) => (echelle === 'style' && haut ? (v <= haut ? (v / haut) * 80 : 80 + Math.min(1, (v - haut) / haut) * 20) : (v / 110) * 100);
  const zone = echelle === 'style' && haut ? { de: 0, a: 80 } : x.bande ? { de: pos(x.bande[0]), a: pos(x.bande[1]) } : null;
  return { pos, zone, dessus: echelle === 'style' && !!haut };
}
const pc = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(1)}%`;

/** La barre de famille de la base : piste, zone du style, zone « au-dessus » en pointillé, point. `visee` : ma visée, en
 * points (palier × 33,33), posée sur la piste comme la base (losange blanc relié au point par un trait pointillé, D108). */
export function PisteBase({ x, avant, echelle, fine = false, visee = null, crans = false }: { x: FamilleLue; avant?: FamilleLue | null; echelle: Echelle; fine?: boolean; visee?: number | null; crans?: boolean }) {
  const f = x.famille;
  const { pos, zone, dessus } = positions(x, echelle);
  const inconnu = !x.valeur;
  const hors = x.horsStyle === 'au-dessus';
  const deguste = x.source === 'dégustation';
  const h = fine ? 'h-2.5' : 'h-3';
  return (
    <span data-barre={f} data-echelle={echelle} className={`relative block ${h} min-w-0`} title={inconnu ? x.raison ?? 'non situé' : undefined}>
      <i className={`absolute inset-y-0 left-0 rounded-full ${inconnu ? 'pq-hachure' : 'bg-cave-800/60'}`} style={{ width: dessus ? '80%' : '100%' }} />
      {zone && !inconnu && <i data-role="zone" className="absolute inset-y-0 rounded-full bg-cave-700/70" style={{ left: pc(zone.de), width: pc(zone.a - zone.de) }} />}
      {/* La zone du style en trois crans, comme la base (biere.html, .zone-f.crans) : deux traits fins, au style seulement,
          sur les familles que le style n'attend pas (la base les efface sur les attendues). */}
      {crans && zone && !inconnu && echelle === 'style' && x.statut !== 'attendue' && [1, 2].map((k) => (
        <i key={k} aria-hidden="true" {...(k === 1 ? { 'data-element': 'biere-crans-style' } : {})} data-role="cran-style"
          className="pq-ma-biere-cran-style absolute inset-y-0" style={{ left: pc(zone.de + ((zone.a - zone.de) * k) / 3) }} />
      ))}
      {dessus && <i aria-hidden="true" className={`absolute inset-y-0 rounded-full border border-dashed border-cave-600 ${inconnu ? 'pq-hachure' : ''}`} style={{ left: '81%', width: '19%' }} />}
      {inconnu && zone && <i data-role="zone" className="absolute inset-y-0 rounded-full border border-dashed border-cave-600" style={{ left: pc(zone.de), width: pc(zone.a - zone.de) }} />}
      {avant?.valeur && x.valeur && Math.abs(avant.valeur.centre - x.valeur.centre) >= 0.5 && (
        <i data-role="avant" className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cave-400" style={{ left: pc(pos(avant.valeur.centre)) }} />
      )}
      {visee != null && x.valeur && (() => {
        const a = pos(x.valeur.centre), b = pos(visee);
        return <i data-visee-lien="" aria-hidden="true" className="pq-ma-biere-lien absolute top-1/2" style={{ left: pc(Math.min(a, b)), width: `${Math.abs(Math.max(0, Math.min(100, b)) - Math.max(0, Math.min(100, a))).toFixed(1)}%` }} />;
      })()}
      {visee != null && (
        <i data-visee-marque="" data-niveau={String(Math.round((visee / (100 / 3)) * 10) / 10)} aria-hidden="true"
          className="pq-ma-biere-visee absolute top-1/2" style={{ left: pc(pos(visee)) }} />
      )}
      {x.valeur && (
        <i data-role="point" data-biere-point="" data-source={deguste ? 'dégustation' : 'simulé'}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full ${fine ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${hors ? 'border-0' : deguste ? 'border-0 bg-cave-50' : 'border-[3px] border-cave-50 bg-cave-900'}`}
          style={{ left: pc(pos(x.valeur.centre)), ...(hors ? { background: '#c2410c' } : !deguste ? { borderColor: COULEURS[f].texte } : {}) }} />
      )}
    </span>
  );
}

/** Nom de la famille, au trait de la page : picto, gras si le style l'attend, rouge si hors du style. */
export function NomFamille({ x, petit = false, bannie = false }: { x: FamilleLue; petit?: boolean; bannie?: boolean }) {
  const hors = x.horsStyle === 'au-dessus';
  return (
    <span className={`flex items-center gap-1 min-w-0 ${petit ? 'text-sm' : 'text-base'}`}>
      <Picto famille={x.famille} taille={petit ? 13 : 15} />
      <span data-role="nom-famille" className={`truncate ${bannie ? 'line-through text-cave-400' : hors ? 'text-alert' : x.statut === 'attendue' ? 'font-semibold text-cave-50' : 'text-cave-200'}`}>{COURT[x.famille]}</span>
    </span>
  );
}
