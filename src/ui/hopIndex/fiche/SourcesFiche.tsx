// La feuille « Sources › » de la fiche, complète (t12e, #184 ; ses mots du 25.10 : « Aussi dans source -> renvoi vraiment à la
// source » ; « afficher en premier le liens vers les info et fiche beermavriik mais ensuite affiche TOUTES les infos de manière
// exhaustive sur le houblons et ses caractéristiques »). D'abord les liens (la page Beer Maverick du houblon, champ `url` du
// catalogue, puis chaque fiche fournisseur qui a une adresse ; une source sans adresse : nom complet et date, sans lien), puis,
// par thème, tout ce que le catalogue (src/data/hopV4/proto-data.json) et les sources du moteur disent de ce houblon : identité,
// acides, huile et composants, arômes (ses mots traduits avec leur famille ou ◇, les auteurs de chaque famille, les textes des
// fiches), styles, ma recette et mon stock. Chaque valeur porte sa source (un lien quand elle a une adresse) et sa plage ; un champ
// que les fiches ne portent pas s'écrit « ? », jamais 0. Compact : des lignes par thème, les textes longs repliés.
// Classes préfixées pq-fiche- (L26).
import { ExternalLink } from 'lucide-react';
import { COULEURS, COURT, Picto, nombre, plage } from './commun';
import { nomMoment, ibuAjout, type HoublonLu } from '../parcours/adaptateur';
import { quandDe } from '../parcours/quand';
import type { RecetteParcours } from '../parcours/types';
import { ibuByMoment } from '../parcours/v4';
import { motsFiche } from './donnees-matrice';
import { confianceSources, groupesConfiance, liensAvecComplements, nomSource, texteSources, type Accord, type ChampComp, type ComplementsFiche, type PlageSource, type SourcesFiche } from './sources';
import type { ChampComplement } from '../../../domain/hopIndex/v4/complements';
import { nomCourt, texteBornes } from './complements-ui';

export const pl = (s: PlageSource) => plage(s.min, s.max, 1);
const accordTexte = (a: Accord) => (a ? `fiches ${a}` : null);

/** Un nom de source : un lien qui s'ouvre dans un nouvel onglet quand elle a une adresse, sinon le nom seul. */
export function LienUrl({ nom, url, role }: { nom: string; url: string | null; role?: string }) {
  if (!url) return <span data-role={role} className="text-cave-200">{nom}</span>;
  return (
    <a href={url} target="_blank" rel="noopener" data-role={role} data-url={url}
      className="inline-flex items-baseline gap-0.5 text-cave-50 underline decoration-cave-600 underline-offset-2 break-words">
      {nom}<ExternalLink aria-hidden="true" className="w-3 h-3 shrink-0 self-center text-cave-400" />
    </a>
  );
}
/** « Beer Maverick 2023 », en lien vers la page de la source. */
export const NomPlage = ({ x }: { x: PlageSource }) => <LienUrl nom={nomSource(x)} url={x.url} />;

export function Rangee({ nom, valeur, inconnu }: { nom: React.ReactNode; valeur: React.ReactNode; inconnu?: boolean }) {
  return (
    <div className="pq-fiche-rangee flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-cave-200 min-w-0 max-w-[58%]">{nom}</span>
      <span className={`${inconnu ? 'text-cave-400' : 'text-cave-50'} text-right tabular-nums min-w-0`}>{valeur}</span>
    </div>
  );
}

export function Etiquettes({ mots }: { mots: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {mots.map((m) => <span key={m} className="inline-flex items-center h-6 px-2 rounded-full bg-cave-850 border border-cave-800 text-sm text-cave-50">{m}</span>)}
    </span>
  );
}

/** d3b (#180) : un champ des compléments (18 sources). La rangée porte l'enveloppe des valeurs valides ; le détail replié donne
 * chaque valeur avec sa source, son année et le lien vers sa fiche. Une valeur suspecte ou hors enveloppe n'entre pas dans
 * l'enveloppe : elle reste dans le détail, marquée d'un signe, sa raison au survol. Un champ à une seule valeur valide : une rangée sans repli. */
export function RangeeChamp({ k }: { k: ChampComp }) {
  const env = k.enveloppe;
  const texte = env ? `${texteBornes(env[0], env[1])}${k.unite ? ` ${k.unite}` : ''}` : '?';
  const marquee = k.valeurs.some((v) => v.horsEnveloppe);
  const nom = k.libelle;
  if (k.valeurs.length === 1 && !marquee) {
    const v = k.valeurs[0];
    return <div data-champ={k.champ}><Rangee nom={<>{nom} <LienUrl nom={nomCourt(v)} url={v.url} /> <span className="text-xs text-cave-400">{v.annee ?? 'date ?'}</span></>} valeur={texte} inconnu={!env} /></div>;
  }
  return (
    <details data-champ={k.champ} className="pq-fiche-champ">
      <summary className="pq-fiche-rangee flex items-baseline justify-between gap-3 py-1.5 text-sm cursor-pointer">
        <span className="text-cave-200 min-w-0 max-w-[58%]">{nom} <span className="text-xs text-cave-400">· {k.valeurs.length} {k.valeurs.length > 1 ? "fiches" : "fiche"}</span></span>
        <span className={`${env ? 'text-cave-50' : 'text-cave-400'} text-right tabular-nums min-w-0`}>{texte}</span>
      </summary>
      <ul className="pb-1.5 space-y-0.5">
        {k.valeurs.map((v, i) => {
          const ecartee = v.horsEnveloppe;
          return (
            <li key={i} data-source={v.source.id} data-statut={v.suspect ? 'suspect' : ecartee ? 'hors-enveloppe' : 'valide'}
              className={`flex items-baseline justify-between gap-3 text-xs ${ecartee ? 'text-cave-400' : 'text-cave-200'}`}>
              <span className="min-w-0"><LienUrl nom={nomCourt(v)} url={v.url} /> · {v.annee ?? 'date ?'}
                {ecartee && <span role="img" aria-label={`écartée de l’enveloppe : ${v.raison ?? ''}`} title={`écartée de l’enveloppe : ${v.raison ?? ''}`} className="ml-1 text-attention cursor-help">⚠</span>}
              </span>
              <span className="text-right tabular-nums">{texteBornes(v.min, v.max)}{k.uniteCourte ? ` ${k.uniteCourte}` : ''}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
/** Les champs des compléments d'un thème, dans l'ordre de complements.json. */
const ChampsTheme = ({ comp, champs }: { comp: ComplementsFiche | null | undefined; champs: readonly ChampComplement[] }) => (
  <>{champs.map((c) => comp?.parChamp[c] ? <RangeeChamp key={c} k={comp.parChamp[c]!} /> : null)}</>
);
const T_ACIDES = ['alpha', 'beta', 'cohumulone', 'colupulone', 'resinesDures'] as const;
const T_HUILE = ['huile', 'myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalol', 'geraniol', 'betaPinene', 'selinene', 'undecanone2', 'esters_alcools_terpeniques', 'cetones', 'isobutyrates', 'monoterpenes', 'sesquiterpenes', 'rapportHC', 'linalolAcide', 'thiols'] as const;
const T_AROMES = ['arome_citrusy', 'arome_fruity', 'arome_floral', 'arome_herbal', 'arome_spicy', 'arome_resinous', 'arome_sugarlike', 'arome_divers'] as const;
const CHAMP_DE: Record<string, ChampComplement | undefined> = { 'myrcène': 'myrcene', 'humulène': 'humulene', 'caryophyllène': 'caryophyllene', 'farnésène': 'farnesene', linalol: 'linalol' };

/** Un thème : titre discret, lignes dessous ; replié quand c'est long. */
function Theme({ id, titre, ouvert = true, children }: { id: string; titre: string; ouvert?: boolean; children: React.ReactNode }) {
  return (
    <details open={ouvert} data-theme={id} className="pq-fiche-theme border-t border-cave-800 first:border-t-0">
      <summary className="flex items-center justify-between min-h-[34px] cursor-pointer text-xs font-semibold uppercase tracking-wide text-cave-400">{titre}</summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}

export function ContenuSources({ h, cle, s, recette, comp }: { h: HoublonLu; cle: string; s: SourcesFiche; recette: RecetteParcours; comp?: ComplementsFiche | null }) {
  const st = s.stock;
  const ajouts = recette.additions.filter((a) => a.hopKey === cle);
  const lot = h.alpha && !/^plage/.test(h.alpha.source) ? h.alpha.valeur : null;
  const mots = motsFiche(cle);
  const liens = liensAvecComplements(s.liens, comp ?? null);
  const bm = liens.find((l) => l.auteur === 'Beer Maverick');
  const confiance = confianceSources(s, comp ?? null);
  const a = (c: ChampComplement) => !!comp?.parChamp[c];
  const dejaListes = new Set<ChampComplement>([...T_ACIDES, ...T_HUILE, ...T_AROMES]);
  const autresMesures = (comp?.champs ?? []).filter((k) => !dejaListes.has(k.champ));
  return (
    <div data-role="sources-feuille" data-houblon={cle}>
      {/* 1. Les liens, d'abord : la page Beer Maverick, puis les fiches fournisseurs ; sans adresse : sans lien. */}
      <ul data-role="sources-liens" aria-label="Sources citées" className="space-y-1.5 pb-2">
        {liens.map((l) => (
          <li key={l.url ?? `${l.nom}|${l.annee}`} data-source-nom={l.nom} className="text-sm leading-snug">
            <LienUrl nom={l.nom} url={l.url} role={l === bm ? 'lien-beer-maverick' : 'lien-source'} />
            <span className="block text-xs text-cave-400">
              {l.annee ?? 'date ?'} · {l.sert.join(' ; ')}{l.url ? '' : ' · sans adresse'}{l.releve ? ` · modifiée ${l.modifiee ?? 'date non publiée'}, relevée ${l.releve}` : ''}
            </span>
          </li>
        ))}
      </ul>
      {/* b1 (D201) : le seul endroit où le nombre de sources se dit, sous la liste des sources : « 1 source : β, myrcène · 3 sources : α ». */}
      {confiance.length > 0 && (
        <p data-role="sources-confiance" aria-label="Nombre de sources par valeur" className="pb-2 text-xs text-cave-400">
          {groupesConfiance(confiance).map((g, i) => (
            <span key={g.n} data-n={g.n}>{i > 0 ? ' · ' : ''}<b className="font-semibold text-cave-200">{texteSources(g.n)}</b> : {g.libelles.join(', ')}</span>
          ))}
        </p>
      )}

      <Theme id="identite" titre="Houblon">
        <Rangee nom="nom" valeur={s.nom} />
        <Rangee nom="alias" valeur={s.alias.length ? s.alias.join(', ') : '?'} inconnu={!s.alias.length} />
        <Rangee nom="origine" valeur={s.origine ?? '?'} inconnu={!s.origine} />
        <Rangee nom="usage" valeur={h.role.mot ?? '?'} inconnu={!h.role.mot} />
        {s.bm && <Rangee nom={<>usage <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></>} valeur={s.bm.usage ?? '?'} inconnu={!s.bm.usage} />}
        {s.bm?.proprietaire && <Rangee nom={<>propriétaire <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></>} valeur={s.bm.proprietaire} />}
        <Rangee nom="forme" valeur={st && st.forme !== 'unknown' ? st.forme : s.forme && s.forme !== 'unknown' ? s.forme : '?'} inconnu={!(st && st.forme !== 'unknown') && !(s.forme && s.forme !== 'unknown')} />
        <Rangee nom="identifiants" valeur={[s.id, s.hopsteinerId].filter(Boolean).join(' ; ')} />
        {s.faitsCites.length > 0 && <Rangee nom="faits cités" valeur={s.faitsCites.join(' ; ')} />}
      </Theme>

      <Theme id="acides" titre="Acides">
        {s.alpha.map((x) => <Rangee key={`a${x.source}`} nom={<>α <NomPlage x={x} /></>} valeur={`${pl(x)} %`} />)}
        {lot != null && <Rangee nom="α mon lot" valeur={`${nombre(lot, 1)} %${st?.alphaDe ? `, ${st.alphaDe}` : ''}`} />}
        {s.beta.length ? s.beta.map((x) => <Rangee key={`b${x.source}`} nom={<>β <NomPlage x={x} /></>} valeur={`${pl(x)} %`} />) : <Rangee nom="β" valeur="?" inconnu />}
        {s.cohumulone
          ? <Rangee nom={<>cohumulone <NomPlage x={s.cohumulone} /></>} valeur={`${pl(s.cohumulone)} % des α`} />
          : !a('cohumulone') && <Rangee nom="cohumulone" valeur="?" inconnu />}
        <ChampsTheme comp={comp} champs={T_ACIDES} />
        {s.bm?.rapportAB && <Rangee nom={<>rapport α/β <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></>} valeur={s.bm.rapportAB} />}
        {s.bm?.stockage && <Rangee nom={<>stockage (HSI) <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></>} valeur={s.bm.stockage} />}
        {(s.accord.alpha || s.accord.beta) && (
          <p className="text-xs text-cave-400">{[accordTexte(s.accord.alpha) && `α : ${accordTexte(s.accord.alpha)}`, accordTexte(s.accord.beta) && `β : ${accordTexte(s.accord.beta)}`].filter(Boolean).join(' ; ')}.</p>
        )}
      </Theme>

      <Theme id="huile" titre="Huile">
        {s.huileTotale.length
          ? s.huileTotale.map((x) => <Rangee key={`h${x.source}`} nom={<>huile totale <NomPlage x={x} /></>} valeur={`${pl(x)} mL/100 g`} />)
          : <Rangee nom="huile totale" valeur="?" inconnu />}
        {s.composants.filter((c) => c.plage || !(CHAMP_DE[c.nom] && a(CHAMP_DE[c.nom]!))).map((c) => (
          <Rangee key={c.nom} nom={c.plage ? <>{c.nom} <NomPlage x={c.plage} /></> : c.nom}
            valeur={c.plage ? `${pl(c.plage)} % de l’huile` : '?'} inconnu={!c.plage} />
        ))}
        {!a('geraniol') && <Rangee nom="géraniol" valeur="?" inconnu />}
        <ChampsTheme comp={comp} champs={T_HUILE} />
        {s.composants.some((c) => c.nom === 'autres huiles' && c.plage) && <p className="text-xs text-cave-400">autres huiles : β-pinène, linalol, géraniol et sélinène, non séparés par la page Beer Maverick.</p>}
        <Rangee nom="thiols, Hopsteiner" valeur={s.thiol ? `classe ${s.thiol}` : '?'} inconnu={!s.thiol} />
        {s.composants.filter((c) => !c.plage && c.raison && c.raison !== 'non renseigné').map((c) => <p key={c.nom} className="text-xs text-cave-400">{c.nom} : {c.raison}</p>)}
      </Theme>

      <Theme id="aromes" titre="Arômes">
        {T_AROMES.some(a) && <div data-role="sources-aromes-notes" className="pb-1"><ChampsTheme comp={comp} champs={T_AROMES} /></div>}
        {mots.length > 0 ? (
          <ul data-role="sources-mots" aria-label="Ses mots, traduits" className="flex flex-wrap gap-x-3 gap-y-1.5 py-1">
            {mots.map((m) => (
              <li key={m.mot} data-mot={m.mot} {...(m.famille ? { 'data-famille': m.famille } : {})} title={m.fiches.length ? m.fiches.join(', ') : 'catégorie de Hopsteiner'}
                className="inline-flex items-center gap-1 text-sm whitespace-nowrap">
                {m.famille ? <Picto famille={m.famille} taille={13} /> : <i role="img" aria-label="hors des 12 familles" className="pq-fiche-mx-hf" style={{ width: 7, height: 7, margin: '0 2px', borderWidth: 1.5 }} />}
                <span style={{ color: m.famille ? COULEURS[m.famille].texte : undefined }} className={m.famille ? 'font-semibold' : 'text-cave-50'}>{m.mot}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-cave-400">Aucun mot dans les fiches : ?</p>}
        <p className="text-xs text-cave-400">Mots des fiches, traduits ; le picto est la famille, ◇ : hors des 12 familles.</p>
        {s.auteurs.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {s.auteurs.map((a) => (
              <li key={a.famille} data-famille={a.famille} className="flex items-start gap-1.5 text-sm text-cave-200">
                <Picto famille={a.famille} taille={14} />
                <span>
                  <b className="font-semibold text-cave-50">{COURT[a.famille]}{a.sur > 1 ? ` ${a.fiches}/${a.sur}` : ''}</b> {a.auteurs.join(', ') || '?'}
                  {s.premier[a.famille]?.length ? <span className="text-cave-400"> · 1er chez {s.premier[a.famille]!.join(', ')}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {s.bm?.arome && (
          <div data-role="sources-profil-bm" className="mt-2">
            <p className="mb-1 text-xs text-cave-400">Profil d’arôme <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} />, de 0 à 5</p>
            <Etiquettes mots={s.bm.arome.filter((a) => a.valeur > 0).sort((a, b) => b.valeur - a.valeur).map((a) => `${a.nom} ${a.valeur}`)} />
            <p className="mt-1 text-xs text-cave-400">à 0 : {s.bm.arome.filter((a) => a.valeur === 0).map((a) => a.nom).join(', ') || 'aucun axe'}.</p>
          </div>
        )}
        {s.descripteurs.length > 0 && <div className="mt-2"><p className="mb-1 text-xs text-cave-400">Descripteurs Beer Maverick</p><Etiquettes mots={s.descripteurs} /></div>}
        {s.textes.length > 0 && (
          <details className="mt-2">
            <summary className="min-h-[30px] cursor-pointer text-xs text-cave-400">Textes des autres fiches ({s.textes.length})</summary>
            <ul className="space-y-1 text-sm text-cave-200">
              {s.textes.map((t, i) => <li key={i}><b className="font-semibold text-cave-50">{t.auteur}</b> : {t.texte.replace(/^[^:]*:\s*/, '')}</li>)}
            </ul>
          </details>
        )}
      </Theme>

      {autresMesures.length > 0 && (
        <Theme id="mesures" titre="Autres mesures">
          {autresMesures.map((k) => <RangeeChamp key={k.champ} k={k} />)}
        </Theme>
      )}

      <Theme id="styles" titre="Styles et usages">
        {s.bm && s.bm.styles.length > 0 && (
          <div data-role="sources-styles-bm" className="py-1 text-sm">
            <Etiquettes mots={s.bm.styles} />
            <span className="mt-0.5 block text-xs text-cave-400"><LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></span>
          </div>
        )}
        {s.usages.length > 0
          ? s.usages.map((u, i) => (
            <div key={i} className="py-1 text-sm">
              <Etiquettes mots={u.styles} />
              {u.source && <span className="mt-0.5 block text-xs text-cave-400"><LienUrl nom={u.source} url={u.url && /^https?:\/\//i.test(u.url) ? u.url : null} /></span>}
            </div>
          ))
          : !(s.bm && s.bm.styles.length > 0) && <p className="text-sm text-cave-400">{s.stylesRaison}</p>}
      </Theme>

      <Theme id="recette" titre="Ma recette et mon stock">
        <Rangee nom="mon stock" valeur={st ? (st.grammes > 0 ? `${nombre(st.grammes, 1)} g` : 'épuisé') : 'pas au stock'} />
        {st && st.articles.length > 0 && <Rangee nom="article" valeur={st.articles.join(' ; ')} />}
        <Rangee nom="dans ma recette" valeur={ajouts.length
          ? ajouts.map((a) => { const i = ibuAjout(a, recette).ibu; return `${nombre(a.grams, 1)} g à ${nomMoment(quandDe(a, recette))}${i ? `, ${nombre(i.valeur, 1)} IBU` : ''}`; }).join(' ; ')
          : 'non'} />
        <Rangee nom="IBU par gramme à 60′" valeur={(() => { const m = ibuByMoment(cle, 1, recette).find((x) => x.code === 'b60'); return m?.ibuPerGram ? nombre(m.ibuPerGram.value, 2) : '?'; })()} />
        <p className="text-xs text-cave-400">IBU : {nombre(recette.volumeL, 1)} L, DI {nombre(recette.og, 3)}, ébullition {recette.boilMin} min.</p>
      </Theme>

      {s.bm && (s.bm.substituts?.length || s.bm.accords?.length) ? (
        <Theme id="substituts" titre="Substituts et accords">
          {s.bm.substituts?.length ? (
            <div data-role="sources-substituts-bm" className="py-1 text-sm">
              <p className="mb-1 text-xs text-cave-400">Substituts choisis par des brasseurs · <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></p>
              <Etiquettes mots={s.bm.substituts.map((x) => x.name)} />
            </div>
          ) : null}
          {s.bm.accords?.length ? (
            <div data-role="sources-accords-bm" className="py-1 text-sm">
              <p className="mb-1 text-xs text-cave-400">Utilisés avec lui, nombre de bières · <LienUrl nom={s.bm.ref.nom} url={s.bm.ref.url} /></p>
              <Etiquettes mots={s.bm.accords.map((x) => `${x.name} ${x.count}`)} />
            </div>
          ) : null}
        </Theme>
      ) : null}

      <Theme id="inconnus" titre="Pas dans les fiches">
        {s.inconnus.filter((c) => !(c.nom === 'géraniol' && a('geraniol')) && !(c.nom === 'cohumulone' && a('cohumulone')) && !(c.nom === 'stockage (HSI)' && a('hsi'))).map((c) => <Rangee key={c.nom} nom={c.nom} valeur={<span title={c.raison}>?</span>} inconnu />)}
        <p className="text-xs text-cave-400">Remplaçants calculés par le moteur : Substituts ›.</p>
      </Theme>

      {s.liens.some((l) => l.note) && (
        <Theme id="notes" titre="Ce que chaque fiche précise" ouvert={false}>
          <ul className="space-y-1 text-xs text-cave-200">
            {s.liens.filter((l) => l.note).map((l) => <li key={l.url ?? l.nom}><b className="font-semibold text-cave-50">{l.nom}</b> : {l.note}</li>)}
          </ul>
        </Theme>
      )}
    </div>
  );
}
