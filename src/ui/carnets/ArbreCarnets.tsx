/**
 * D451, voie liste : la liste en arbre (maquettes3/v01 passe 3, écrans `liste` et `epreuve` ; greffe maquettes2/v01 pour les sous-domaines dépliés).
 * Le coup d'œil à quatre cases (chaque case filtre), la rangée « Arbre · À faire n · cloche n », puis Domaine › sous-domaine : chaque problème
 * ouvert avec son picto, son titre, sa jauge, son état et son dernier pas ; les autres genres repliés par sous-domaine avec leur valeur utile ;
 * « Résolus <année> » replié (un toucher ouvre la Relecture) ; « À ranger » en ambre, avec la carte « Rattacher à … ? » d'une photo seule.
 * Le champ « Une idée, un problème… », le + volant et la barre du bas sont ceux de l'app. Disparaît (PLAN) : les groupes par état, les puces
 * Tous / Local / Brasserie, « dès » et le prix à droite, « votre lien ». L'ancienne liste (`ListeCarnets`) reste joignable par `?carnet=v0`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight, HelpCircle, Search, Check, Wrench } from 'lucide-react';
import type { CarnetDoc, MessageDoc } from '../../domain/carnets/modele';
import { arbreDe, coupDOeil } from '../../domain/carnets/arbre';
import { etatDe, LIBELLE_ETAT, genreDe } from '../../domain/carnets/suivi';
import { DOMAINE_LIBELLE } from '../../domain/carnets/domaines';
import { chercherCarnet, requete, type Trouve } from '../../domain/carnets/recherche';
import type { AncienneNote } from '../../domain/carnets/anciens';
import { domaineParMots } from './domaineMots';
import { PictoDomaine } from './Domaines';
import { Bandeau } from './Bandeau';
import { AnciennesNotes } from './AnciennesNotes';
import { ListeVide } from './ListeCarnets';
import { Photo, PictoObjet, VignetteObjet, pictoDe } from './pictos';
import { CarteARanger } from './CarteARanger';
import { CoupDOeil } from './CoupDOeil';
import { InsecMarque, liesParNbsp } from './insecable';
import { propositionARanger, texteMince } from './afaireRegles';
import { carnetsAvecVeille, dernierPas, jaugeDe, ligneResolus, nomGroupe, passeFiltre, resumeReplie, titreLigne, valeurUtile, ETATS_LISTE,
  type FiltreOeil, type OngletListe } from './listeRegles';
import { dateCourte, type StatutCarnet } from './EtatIA';
import './carnets-liste.css';

export interface ListeArbreProps {
  /** Les carnets non archivés ; `tous` y ajoute les archivés (les résolus). */
  carnets: readonly CarnetDoc[];
  tous: readonly CarnetDoc[];
  messages: readonly MessageDoc[];
  maintenant: Date;
  onglet: OngletListe;
  onOnglet: (o: OngletListe) => void;
  filtre: FiltreOeil;
  onFiltre: (f: FiltreOeil) => void;
  /** Le nombre de tâches ouvertes (`aFaireDe(...).total`) et le corps de l'onglet « À faire » (`AFaire`, voie afaire). */
  aFaire: number;
  corpsAFaire: React.ReactNode;
  rangeEnCours?: string | null;
  /** Posé au-dessus : reprise, bandeau « Annuler », cadre du champ. */
  enHaut?: React.ReactNode;
  supprime?: { titre: string; statut: StatutCarnet; onAnnuler: () => void } | null;
  anciennes?: readonly AncienneNote[];
  onOuvrir: (id: string) => void;
  onRelecture: () => void;
  /** « Oui » de la carte d'une photo seule : le contenu du carnet à ranger passe dans ce carnet (un Annuler). */
  onRattacher: (sourceId: string, versId: string) => void;
  /** « Nouveau problème » : le carnet à ranger devient un problème. */
  onNouveauProbleme: (sourceId: string) => void;
  /** R66 : le carnet « à ranger » tout juste posé (une photo seule) : sa carte est amenée en vue. */
  montrer?: string | null;
  onExemple?: (texte: string) => void;
}

/** Brasserie d'abord (maquette), puis Local, Meuble, Outils, Papiers. */
const ORDRE_DOMAINES = ['brasserie', 'local', 'meuble', 'outils', 'papiers'];
const jourAnnee = (d: Date): number => d.getFullYear();

function Jauge({ etat }: { etat: ReturnType<typeof etatDe> }) {
  const n = jaugeDe(etat);
  return <span className="cnl-jauge" data-etat={etat} aria-hidden>{ETATS_LISTE.map((k, i) => <i key={k} data-on={i < n ? '' : undefined} />)}</span>;
}

const nomPicto = (c: CarnetDoc) => pictoDe(c.title, c.carnet.categorie?.chemin.join(' '), c.carnet.phrase);
function Picto({ c }: { c: CarnetDoc }) {
  return <span className="cnl-picto" aria-hidden>{nomPicto(c) === 'objet' ? <Wrench size={20} /> : <PictoObjet nom={nomPicto(c)} taille={22} />}</span>;
}

function LigneProbleme({ c, messages, maintenant, enCours, trouve, onOuvrir }: { c: CarnetDoc; messages: readonly MessageDoc[]; maintenant: Date; enCours: boolean; trouve?: Trouve | null; onOuvrir: (id: string) => void }) {
  const e = etatDe(c);
  const pas = enCours ? null : dernierPas(c, messages, maintenant);
  return (
    <button type="button" className="cnl-pb" data-etat={e} data-genre="probleme" onClick={() => onOuvrir(c.id)}>
      <Picto c={c} />
      <span className="cnl-tx">
        <b className="cnl-t cn-carnet-titre">{liesParNbsp(titreLigne(c))}</b>
        <span className="cnl-sub">
          <Jauge etat={e} /> <b className="cnl-etat" data-etat={e}>{LIBELLE_ETAT[e]}</b>
          {enCours ? <span className="cnl-pas" role="status">· ✻ L’IA range…</span> : trouve && trouve.sorte !== 'titre' ? <LigneTrouvee t={trouve} /> : pas ? <span className="cnl-pas">· {pas}</span> : null}
        </span>
      </span>
    </button>
  );
}

function LigneTrouvee({ t }: { t: Trouve }) {
  return <span className="cnl-pas cnd-cite" data-trouve={t.sorte}>· {t.sorte === 'article' ? 'article' : 'note'} : <InsecMarque t={t.texte ?? ''} debut={t.debut ?? 0} fin={t.fin ?? 0} /></span>;
}

/** `avecEtat` (C67-1) : sous un filtre du coup d'œil, le chiffre de la case compte tous les genres ; la ligne qu'il fait voir porte donc sa jauge et son état, comme un problème. */
function LigneAutre({ c, maintenant, messages, trouve, onOuvrir, avecEtat }: { c: CarnetDoc; maintenant: Date; messages?: readonly MessageDoc[]; trouve?: Trouve | null; onOuvrir: (id: string) => void; avecEtat?: boolean }) {
  /* C68-11 : sous un filtre d'état, la ligne dit aussi son dernier pas quand elle n'a pas de valeur utile ; un achat sans note n'en a pas (rien n'est inventé) */
  const val = valeurUtile(c, maintenant, messages) ?? (avecEtat && messages ? dernierPas(c, messages, maintenant) : null);
  const e = etatDe(c);
  const k = c.carnet;
  const photo = k.articles.find(a => a.photo)?.photo ?? k.photos[0]?.jpeg;
  return (
    <button type="button" className="cnl-pb cnl-autre" data-genre={genreDe(c)} onClick={() => onOuvrir(c.id)}>
      <VignetteObjet photo={photo} mots={[c.title, k.phrase, ...k.facons.map(f => f.nom)]} classe="cnl-vignette" taille={24} />
      <span className="cnl-tx">
        <b className="cnl-t cn-carnet-titre">{liesParNbsp(titreLigne(c))}</b>
        {avecEtat
          ? <span className="cnl-sub"><Jauge etat={e} /> <b className="cnl-etat" data-etat={e}>{LIBELLE_ETAT[e]}</b>{trouve && trouve.sorte !== 'titre' ? <LigneTrouvee t={trouve} /> : val ? <span className="cnl-pas">· {val}</span> : null}</span>
          : trouve && trouve.sorte !== 'titre' ? <span className="cnl-sub"><LigneTrouvee t={trouve} /></span> : val ? <span className="cnl-sub"><span className="cnl-pas">{val}</span></span> : null}
      </span>
    </button>
  );
}

/** La ligne d'un élément à ranger : sa miniature (photo) ou son picto, son titre, ce qu'on sait ; jamais une catégorie devinée. */
function LigneARanger({ c, messages, maintenant, onOuvrir }: { c: CarnetDoc; messages: readonly MessageDoc[]; maintenant: Date; onOuvrir: (id: string) => void }) {
  const k = c.carnet;
  const photo = k.photos[0]?.jpeg;
  const texte = k.notes.map(n => n.texte).join(' ').trim();
  const titre = c.title === 'Photo' ? `Photo du ${dateCourte(k.creeLe) ?? 'jour'}` : titreLigne(c);
  const dit = !texte ? 'sans texte' : texteMince(texte) ? 'rien d’autre écrit : reste ici' : null;
  const e = etatDe(c);
  /* C68-11 : un carnet encore à ranger qui a des notes dit aussi son dernier pas, comme un problème */
  const pas = dit ? null : dernierPas(c, messages, maintenant);
  return (
    <button type="button" className="cnl-pb" data-etat={e} data-aranger="" onClick={() => onOuvrir(c.id)}>
      {photo ? <Photo src={photo} className="cnl-miniature" alt="" repli={<Picto c={c} />} /> : <Picto c={c} />}
      <span className="cnl-tx">
        <b className="cnl-t cn-carnet-titre">{liesParNbsp(titre)}</b>
        <span className="cnl-sub"><Jauge etat={e} /> {dit ? <span className="cnl-pas">{dit}</span> : <><b className="cnl-etat" data-etat={e}>{LIBELLE_ETAT[e]}</b>{pas && <span className="cnl-pas">· {pas}</span>}</>}</span>
      </span>
    </button>
  );
}

export function ListeArbre(p: ListeArbreProps) {
  const [q, setQ] = useState('');
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [ouverts, setOuverts] = useState<ReadonlySet<string>>(() => new Set());
  const [laissees, setLaissees] = useState<ReadonlySet<string>>(() => new Set());
  /* R66 (C67B-4) : une photo seule vient d'être posée : le groupe « À ranger » (sa ligne, sa carte « Rattacher à … ? ») est amené en vue, au lieu de rester tout en bas de l'arbre */
  const sectionARanger = useRef<HTMLElement>(null);
  useEffect(() => { if (p.montrer) sectionARanger.current?.scrollIntoView?.({ block: 'start' }); }, [p.montrer]);
  const mot = requete(q);
  const annee = jourAnnee(p.maintenant);
  const vivants = p.carnets.filter(c => !c.carnet.archive);
  const trouves = new Map<string, Trouve>();
  const garde = (c: CarnetDoc): boolean => {
    if (!mot) return true;
    const t = chercherCarnet(c as never, q);
    if (t) trouves.set(c.id, t);
    return !!t;
  };
  const sources = p.tous.filter(c => passeFiltre(c, p.filtre) && garde(c));
  const arbre = arbreDe(sources, domaineParMots);
  const coup = coupDOeil(p.tous, annee);
  const veilles = carnetsAvecVeille(vivants);
  const basculer = (cle: string) => setOuverts(s => { const n = new Set(s); if (n.has(cle)) n.delete(cle); else n.add(cle); return n; });

  if (!p.tous.length && !p.supprime) return <ListeVide enHaut={p.enHaut} onExemple={p.onExemple} pied={<AnciennesNotes notes={p.anciennes ?? []} />} />;

  const rienDuTout = arbre.domaines.length === 0 && arbre.aRanger.length === 0 && arbre.resolus.length === 0;

  const corpsArbre = (
    <>
      {[...arbre.domaines].sort((x, y) => ORDRE_DOMAINES.indexOf(x.domaine) - ORDRE_DOMAINES.indexOf(y.domaine)).map(n => (
        <section key={n.domaine} className="cnl-domaine" data-domaine={n.domaine} aria-label={DOMAINE_LIBELLE[n.domaine]}>
          <div className="cnl-dn"><PictoDomaine d={n.domaine} taille={18} /><span className="cnl-dn-nom">{DOMAINE_LIBELLE[n.domaine]}</span><span className="cn-mono cnl-dn-n">{n.n}</span></div>
          {n.ouverts.map(c => <LigneProbleme key={c.id} c={c} messages={p.messages} maintenant={p.maintenant} enCours={p.rangeEnCours === c.id} trouve={trouves.get(c.id)} onOuvrir={p.onOuvrir} />)}
          {n.groupes.map(g => {
            if (g.chemin === null) return g.carnets.map(c => <LigneAutre key={c.id} c={c} maintenant={p.maintenant} messages={p.messages} trouve={trouves.get(c.id)} onOuvrir={p.onOuvrir} avecEtat={p.filtre !== null} />);
            const cle = `${n.domaine}/${g.chemin}`;
            /* une recherche déplie : ce qu'elle a trouvé se lit sans toucher */
            const ouvert = ouverts.has(cle) || !!mot || p.filtre !== null;
            return (
              <React.Fragment key={cle}>
                <button type="button" className="cnl-sd" aria-expanded={ouvert} onClick={() => basculer(cle)}>
                  <span aria-hidden className="cnl-fleche">{ouvert ? '▾' : '▸'}</span><b>{g.chemin}</b><span className="cn-mono cnl-sd-n">{g.carnets.length}</span>
                  {!ouvert && <span className="cnl-sdres">{resumeReplie(g, p.maintenant)}</span>}
                </button>
                {ouvert && g.carnets.map(c => <LigneAutre key={c.id} c={c} maintenant={p.maintenant} messages={p.messages} trouve={trouves.get(c.id)} onOuvrir={p.onOuvrir} avecEtat={p.filtre !== null} />)}
              </React.Fragment>
            );
          })}
        </section>
      ))}
      {arbre.aRanger.length > 0 && (
        <section ref={sectionARanger} className="cnl-domaine cnl-aranger" aria-label="À ranger">
          <div className="cnl-dn cnl-dn-aranger"><HelpCircle size={18} aria-hidden /><span className="cnl-dn-nom">À ranger</span><span className="cn-mono cnl-dn-n">{arbre.aRanger.length}</span></div>
          {arbre.aRanger.map(c => <LigneARanger key={c.id} c={c} messages={p.messages} maintenant={p.maintenant} onOuvrir={p.onOuvrir} />)}
          {arbre.aRanger.filter(c => c.carnet.photos.length > 0 && !laissees.has(c.id)).map(c => {
            const texte = c.carnet.notes.map(n => n.texte).join(' ').trim();
            if (texte && !texteMince(texte)) return null;
            const element = { carnetId: c.id, ...(texte ? { texte } : {}), photo: c.carnet.photos[0].jpeg, le: c.carnet.creeLe };
            return (
              <CarteARanger key={`carte-${c.id}`} element={element} proposition={propositionARanger(element, p.tous, p.messages, p.maintenant)}
                onRattacher={vers => p.onRattacher(c.id, vers)} onNouveau={() => p.onNouveauProbleme(c.id)} onLaisser={() => setLaissees(s => new Set(s).add(c.id))} />
            );
          })}
        </section>
      )}
      {arbre.resolus.map(r => {
        const deplie = p.filtre === 'resolu';
        const nom = r.annee ? `Résolus ${r.annee}` : 'Résolus';
        return (
          <section key={r.annee ?? 'sans'} className="cnl-domaine cnl-resolus" aria-label={nom}>
            <button type="button" className="cnl-dn cnl-dn-resolus" onClick={p.onRelecture} aria-label={`${nom} : ouvrir la relecture`}>
              <Check size={18} aria-hidden /><span className="cnl-dn-nom">{nom}</span><span className="cn-mono cnl-dn-n">{r.carnets.length}</span>
            </button>
            {deplie
              ? r.carnets.map(c => <LigneAutre key={c.id} c={c} maintenant={p.maintenant} messages={p.messages} trouve={trouves.get(c.id)} onOuvrir={p.onOuvrir} avecEtat={p.filtre !== null} />)
              : <button type="button" className="cnl-sd cnl-sd-resolus" onClick={p.onRelecture}><span className="cnl-sdres cnl-sdres-resolus">{ligneResolus(r.carnets)}</span><ChevronRight size={16} aria-hidden /></button>}
          </section>
        );
      })}
      {rienDuTout && <p className="cn-mut cnl-rien">Aucun carnet ne correspond. <button type="button" className="cn-lien" onClick={() => { setQ(''); setRechercheOuverte(false); p.onFiltre(null); }}>Tout montrer</button></p>}
    </>
  );

  const corpsVeille = (
    <section className="cnl-domaine" aria-label="Veilles">
      {veilles.length === 0
        ? <p className="cn-mut cnl-rien">Aucune veille demandée.</p>
        : veilles.map(c => {
          const nom = c.carnet.facons.find(f => f.suivi?.etat === 'veille')?.nom ?? c.carnet.articles.find(a => a.veille?.active)?.nom;
          return (
            <button key={c.id} type="button" className="cnl-pb" data-etat={etatDe(c)} onClick={() => p.onOuvrir(c.id)}>
              <Picto c={c} />
              <span className="cnl-tx"><b className="cnl-t cn-carnet-titre">{liesParNbsp(titreLigne(c))}</b>
                <span className="cnl-sub"><span className="cnl-pas">{nom ? `${nom} · ` : ''}veille demandée · pas encore relevée</span></span></span>
            </button>
          );
        })}
    </section>
  );

  return (
    <div className="cn-page cn-liste cnl-liste" data-onglet={p.onglet}>
      <div className="cnl-haut">
        {p.enHaut}
        {p.supprime && <Bandeau enLigne bandeau={{ sorte: 'carnet-supprime', titre: p.supprime.titre }} onAnnuler={p.supprime.onAnnuler} />}
      </div>
      <CoupDOeil coup={coup} filtre={p.filtre} onFiltre={f => { p.onFiltre(f); if (p.onglet !== 'arbre') p.onOnglet('arbre'); }} />
      <div className="cnl-onglets" role="tablist" aria-label="Vue de la liste">
        <button type="button" role="tab" className="cnl-jt" aria-selected={p.onglet === 'arbre'} onClick={() => p.onOnglet('arbre')}>Arbre</button>
        <button type="button" role="tab" className="cnl-jt" aria-selected={p.onglet === 'afaire'} onClick={() => p.onOnglet('afaire')}>À faire <b className="cn-mono">{p.aFaire}</b></button>
        <button type="button" role="tab" className="cnl-jt" aria-selected={p.onglet === 'veille'} aria-label={`Veilles : ${veilles.length}`} onClick={() => p.onOnglet('veille')}><Bell size={16} aria-hidden /> <b className="cn-mono">{veilles.length}</b></button>
        <span className="cn-sp" />
        {rechercheOuverte || q
          ? <input type="search" className="cnl-recherche" placeholder="Chercher un carnet" aria-label="Chercher un carnet" value={q} autoFocus onChange={e => setQ(e.target.value)}
              onBlur={() => { if (!q.trim()) setRechercheOuverte(false); }} onKeyDown={e => { if (e.key === 'Escape') { setQ(''); setRechercheOuverte(false); } }} />
          : <button type="button" className="cnl-loupe" aria-label="Chercher un carnet" onClick={() => setRechercheOuverte(true)}><Search size={18} aria-hidden /></button>}
      </div>
      {p.filtre && p.onglet === 'arbre' && (
        <p className="cnl-filtre" role="status">Filtre : <b>{p.filtre === 'resolu' ? `résolus ${annee}` : p.filtre === 'cherche' ? 'je cherche' : p.filtre === 'decide' ? 'décidés' : 'notés'}</b>
          <button type="button" className="cn-lien" onClick={() => p.onFiltre(null)}>Tout montrer</button></p>
      )}
      <div className="cnl-corps">{p.onglet === 'afaire' ? p.corpsAFaire : p.onglet === 'veille' ? corpsVeille : corpsArbre}</div>
      <AnciennesNotes notes={p.anciennes ?? []} />
    </div>
  );
}
