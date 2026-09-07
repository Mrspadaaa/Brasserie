import React, { useState } from 'react';
import { NumberInput } from './NumberInput';
import { WaterSource, WaterIons } from '../types';
import { ION_LABEL } from '../domain/water';
import { Pencil, Check, X, Info } from 'lucide-react';
import { useSyncedDraft } from '../hooks/useLiveData';

/**
 * L'analyse de l'eau, telle qu'on la recopie de la feuille du distributeur.
 *
 * ⚠️ Pourquoi c'est saisi à la main : il n'existe **aucune API suisse**
 * d'analyse d'eau potable. Hub'Eau, qui alimente les calculateurs français,
 * ne couvre que la France ; côté suisse, la plateforme du SVGW est alimentée
 * sur base volontaire et Fribourg ne publie que la dureté. On recopie donc
 * l'analyse une fois, on la nomme, et elle sert pour tous les brassins.
 *
 * `note` garde la provenance et la date : une analyse de 2019 ne vaut pas
 * celle de cette année, et il faut pouvoir s'en apercevoir.
 */

const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];

const SYMBOL: Record<keyof WaterIons, string> = {
  cl: 'Cl',
  so4: 'SO₄',
  ca: 'Ca',
  mg: 'Mg',
  na: 'Na',
  hco3: 'HCO₃'
};

interface WaterAnalysisTableProps {
  source: WaterSource;
  onChange: (source: WaterSource) => void;
  /**
   * L'eau réellement versée, si elle diffère de la source.
   *
   * ⚠️ Ce que ça règle : la feuille affichait DEUX rangs des mêmes six ions —
   * l'analyse du réseau, puis la même eau une fois coupée à l'osmosée — et dans
   * deux ordres différents par-dessus le marché. Or ce qui compte au brassin,
   * c'est ce qui entre dans la cuve ; l'analyse brute est une donnée
   * d'installation, qu'on ne relit qu'en la modifiant. Quand cette prop est
   * fournie, elle remplace le rang de la source en lecture — et la source
   * reste visible dans l'éditeur, là où on en a besoin.
   */
  display?: { ions: WaterIons; caption: string };
}

export const WaterAnalysisTable: React.FC<WaterAnalysisTableProps> = ({
  source,
  onChange,
  display
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useSyncedDraft(source, source.id);

  const save = () => {
    onChange({ ...draft, updatedAt: new Date().toISOString() });
    setEditing(false);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        {/* Aligné sur les autres titres de bloc de la feuille : le rang
            `text-base` en faisait le plus gros titre de l’écran, pour la
            donnée qu’on regarde le moins. */}
        <h2 className="text-xs font-semibold text-cave-300">Eau de départ</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="touch-target px-3 rounded-control text-sm text-cave-300
                       hover:text-ebc-straw flex items-center gap-1.5"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </button>
        ) : (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setDraft(source);
                setEditing(false);
              }}
              aria-label="Annuler"
              className="touch-target rounded-control text-cave-400"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={save}
              aria-label="Enregistrer l’analyse"
              className="touch-target rounded-control text-hop"
            >
              <Check className="w-5 h-5" />
            </button>
          </span>
        )}
      </div>

      {editing && (
        <input
          type="text"
          name="water_analysis_source_label"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          className="w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700
                     text-cave-100 text-base focus:outline-none focus:border-ebc-straw"
          value={draft.name}
          aria-label="Nom du réseau ou de la source"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      )}

      {/*
        ⚠️ EN LECTURE, une ligne qui passe à la ligne — pas un tableau.

        Le tableau était le même dans les deux états. En lecture, ça donnait sur
        un téléphone sept colonnes dans un conteneur à défilement HORIZONTAL :
        il fallait pousser le doigt de côté pour voir le HCO₃ et le pH, sur des
        valeurs qu'on ne consulte que pour vérifier qu'elles n'ont pas bougé.
        Un défilement latéral pour six chiffres figés, c'est du travail rendu au
        lecteur sans rien lui apprendre.

        En SAISIE le tableau reste : chaque ion y a sa colonne, son en-tête et
        son champ, et c'est là que la disposition en grille sert vraiment.
      */}
      {!editing ? (
        /*
          ⚠️ PLUS DE CHIFFRES ICI quand un `display` est fourni.
          Le rang d'ions faisait maintenant doublon avec la comparaison
          départ → corrigé posée juste en dessous, qui montre les mêmes valeurs
          de départ ET ce qu'elles deviennent. Ne reste que ce que la
          comparaison ne dit pas : de QUELLE eau on part, et comment elle a été
          coupée. Sans `display`, le rang revient — l'appelant n'a alors rien
          d'autre pour montrer l'analyse.

          Pas de `truncate` : à 320 px, la légende perdait « coupée à 70 %
          d'osmosée », l'information la plus utile des deux. Passer à la ligne
          coûte moins qu'effacer.
        */
        <div className="panel px-2.5 py-2 space-y-0.5">
          <p className="text-2xs text-cave-500 leading-snug">{display?.caption ?? source.name}</p>
          {!display && (
            <p className="text-2xs text-cave-400 flex flex-wrap gap-x-2.5 gap-y-1">
              {IONS.map((ion) => (
                <span key={ion} title={ION_LABEL[ion]}>
                  {SYMBOL[ion]} <span className="reading text-cave-100">{source[ion]}</span>
                </span>
              ))}
              <span>
                pH <span className="reading text-cave-100">{source.ph ?? '—'}</span>
              </span>
              <span className="reading-unit">ppm</span>
            </p>
          )}
        </div>
      ) : (
      <div className="overflow-x-auto panel">
        <table className="w-full text-sm">
          <caption className="sr-only">Analyse ionique de l’eau, en milligrammes par litre</caption>
          <thead>
            <tr className="bg-cave-850">
              <th scope="col" className="text-left font-normal text-cave-400 py-2 px-3 whitespace-nowrap">
                Réseau
              </th>
              {IONS.map((ion) => (
                <th
                  key={ion}
                  scope="col"
                  className="font-normal text-cave-400 py-2 px-2 text-right whitespace-nowrap"
                  title={ION_LABEL[ion]}
                >
                  {SYMBOL[ion]}
                </th>
              ))}
              <th scope="col" className="font-normal text-cave-400 py-2 px-2 text-right">
                pH
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                scope="row"
                className="text-left font-normal text-cave-100 py-2 px-3 max-w-[9rem] truncate"
                title={source.name}
              >
                {editing ? '—' : source.name}
              </th>

              {IONS.map((ion) => (
                <td key={ion} className="py-1.5 px-2 text-right">
                  {editing ? (
                    <NumberInput
                      min={0}
                      value={draft[ion]}
                      onValue={(v) =>
                        setDraft({ ...draft, [ion]: v })}
                      pad
                      className="w-16 min-h-touch px-1 rounded-control bg-cave-950
                                 border border-cave-700 reading text-sm text-center
                                 focus:outline-none focus:border-ebc-straw
                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                                 [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <span className="reading text-cave-100">{source[ion]}</span>
                  )}
                </td>
              ))}

              <td className="py-1.5 px-2 text-right">
                {editing ? (
                  <NumberInput
                    min={0}
                    max={14}
                    value={draft.ph}
                    onValue={(v) => setDraft({ ...draft, ph: v })}
                    emptyValue={undefined}
                    pad
                    className="w-16 min-h-touch px-1 rounded-control bg-cave-950
                               border border-cave-700 reading text-sm text-center
                               focus:outline-none focus:border-ebc-straw
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                               [&::-webkit-inner-spin-button]:appearance-none"
                  />
                ) : (
                  <span className="reading text-cave-100">{source.ph ?? '—'}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      )}

      {editing ? (
        <>
          {/*
            ⚠️ Le tableau attend des ppm d'ION. Les feuilles suisses donnent
            couramment la dureté et le TAC en DEGRÉS FRANÇAIS : recopier un
            °fH dans une case de ppm se trompe d'un facteur 2.4 à 12, et le
            chiffre reste parfaitement crédible. On donne donc les conversions
            là où la saisie se fait, plutôt que d'espérer qu'on les connaisse.
          */}
          <p className="flex items-start gap-2 text-sm text-cave-500 leading-snug px-1">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Des degrés français sur l’analyse ? 1 °fH de TAC = 12.2 ppm de HCO₃ ; 1 °fH de
              dureté calcique = 4.0 ppm de Ca ; 1 °fH de dureté magnésienne = 2.4 ppm de Mg.
            </span>
          </p>
          <input
            type="text"
            name="water_analysis_provenance_note"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            className="w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700
                       text-cave-100 text-base placeholder-cave-600
                       focus:outline-none focus:border-ebc-straw"
            placeholder="Provenance et date de l’analyse"
            aria-label="Provenance de l’analyse"
            value={draft.note ?? ''}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
        </>
      ) : null}
      {/*
        ⚠️ La note (« Valeurs de départ, à remplacer par l'analyse du
        distributeur ») ne s'affiche plus qu'en SAISIE. C'est une consigne de
        premier réglage : la relire à chaque brassin, sur deux lignes, pendant
        des années, n'apprend rien de plus — et elle apparaît maintenant là où
        l'on peut agir dessus.
      */}
    </section>
  );
};
