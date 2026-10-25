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
import { nomSource, type Accord, type PlageSource, type SourcesFiche } from './sources';

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

/** Un thème : titre discret, lignes dessous ; replié quand c'est long. */
function Theme({ id, titre, ouvert = true, children }: { id: string; titre: string; ouvert?: boolean; children: React.ReactNode }) {
  return (
    <details open={ouvert} data-theme={id} className="pq-fiche-theme border-t border-cave-800 first:border-t-0">
      <summary className="flex items-center justify-between min-h-[34px] cursor-pointer text-xs font-semibold uppercase tracking-wide text-cave-400">{titre}</summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}

export function ContenuSources({ h, cle, s, recette }: { h: HoublonLu; cle: string; s: SourcesFiche; recette: RecetteParcours }) {
  const st = s.stock;
  const ajouts = recette.additions.filter((a) => a.hopKey === cle);
  const lot = h.alpha && !/^plage/.test(h.alpha.source) ? h.alpha.valeur : null;
  const mots = motsFiche(cle);
  const bm = s.liens.find((l) => l.auteur === 'Beer Maverick');
  return (
    <div data-role="sources-feuille" data-houblon={cle}>
      {/* 1. Les liens, d'abord : la page Beer Maverick, puis les fiches fournisseurs ; sans adresse : sans lien. */}
      <ul data-role="sources-liens" aria-label="Sources citées" className="space-y-1.5 pb-2">
        {s.liens.map((l) => (
          <li key={l.url ?? `${l.nom}|${l.annee}`} data-source-nom={l.nom} className="text-sm leading-snug">
            <LienUrl nom={l.nom} url={l.url} role={l === bm ? 'lien-beer-maverick' : 'lien-source'} />
            <span className="block text-xs text-cave-400">
              {l.annee ?? 'date ?'} · {l.sert.join(' ; ')}{l.url ? '' : ' · sans adresse'}
            </span>
          </li>
        ))}
      </ul>

      <Theme id="identite" titre="Houblon">
        <Rangee nom="nom" valeur={s.nom} />
        <Rangee nom="alias" valeur={s.alias.length ? s.alias.join(', ') : '?'} inconnu={!s.alias.length} />
        <Rangee nom="origine" valeur={s.origine ?? '?'} inconnu={!s.origine} />
        <Rangee nom="usage" valeur={h.role.mot ?? '?'} inconnu={!h.role.mot} />
        <Rangee nom="forme" valeur={st && st.forme !== 'unknown' ? st.forme : s.forme && s.forme !== 'unknown' ? s.forme : '?'} inconnu={!(st && st.forme !== 'unknown') && !(s.forme && s.forme !== 'unknown')} />
        <Rangee nom="identifiants" valeur={[s.id, s.hopsteinerId].filter(Boolean).join(' ; ')} />
        {s.faitsCites.length > 0 && <Rangee nom="faits cités" valeur={s.faitsCites.join(' ; ')} />}
      </Theme>

      <Theme id="acides" titre="Acides">
        {s.alpha.map((x) => <Rangee key={`a${x.source}`} nom={<>α <NomPlage x={x} /></>} valeur={`${pl(x)} %`} />)}
        {lot != null && <Rangee nom="α mon lot" valeur={`${nombre(lot, 1)} %${st?.alphaDe ? `, ${st.alphaDe}` : ''}`} />}
        {s.beta.length ? s.beta.map((x) => <Rangee key={`b${x.source}`} nom={<>β <NomPlage x={x} /></>} valeur={`${pl(x)} %`} />) : <Rangee nom="β" valeur="?" inconnu />}
        <Rangee nom="cohumulone" valeur="?" inconnu />
        {(s.accord.alpha || s.accord.beta) && (
          <p className="text-xs text-cave-400">{[accordTexte(s.accord.alpha) && `α : ${accordTexte(s.accord.alpha)}`, accordTexte(s.accord.beta) && `β : ${accordTexte(s.accord.beta)}`].filter(Boolean).join(' ; ')}.</p>
        )}
      </Theme>

      <Theme id="huile" titre="Huile">
        {s.huileTotale.length
          ? s.huileTotale.map((x) => <Rangee key={`h${x.source}`} nom={<>huile totale <NomPlage x={x} /></>} valeur={`${pl(x)} mL/100 g`} />)
          : <Rangee nom="huile totale" valeur="?" inconnu />}
        {s.composants.map((c) => (
          <Rangee key={c.nom} nom={c.plage ? <>{c.nom} <NomPlage x={c.plage} /></> : c.nom}
            valeur={c.plage ? `${pl(c.plage)} % de l’huile` : '?'} inconnu={!c.plage} />
        ))}
        <Rangee nom="géraniol" valeur="?" inconnu />
        <Rangee nom="thiols, Hopsteiner" valeur={s.thiol ? `classe ${s.thiol}` : '?'} inconnu={!s.thiol} />
        {s.composants.filter((c) => !c.plage && c.raison && c.raison !== 'non renseigné').map((c) => <p key={c.nom} className="text-xs text-cave-400">{c.nom} : {c.raison}</p>)}
      </Theme>

      <Theme id="aromes" titre="Arômes">
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

      <Theme id="styles" titre="Styles et usages">
        {s.usages.length > 0
          ? s.usages.map((u, i) => (
            <div key={i} className="py-1 text-sm">
              <Etiquettes mots={u.styles} />
              {u.source && <span className="mt-0.5 block text-xs text-cave-400"><LienUrl nom={u.source} url={u.url && /^https?:\/\//i.test(u.url) ? u.url : null} /></span>}
            </div>
          ))
          : <p className="text-sm text-cave-400">{s.stylesRaison}</p>}
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

      <Theme id="inconnus" titre="Pas dans les fiches">
        {s.inconnus.map((c) => <Rangee key={c.nom} nom={c.nom} valeur={<span title={c.raison}>?</span>} inconnu />)}
        <p className="text-xs text-cave-400">Substituts : {s.inconnus.find((c) => /substituts/.test(c.nom))?.raison}.</p>
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
