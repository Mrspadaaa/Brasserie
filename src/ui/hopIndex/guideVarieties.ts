import { assertHopDocument, type HopVariety } from '../../../functions/src/hopIndexSchema';
import studyPack from '../../data/hopStudyBootstrap.json';
import trialPack from '../../data/hopTrialBootstrap.json';

/** Read-only hop references used by the index and its search controls.
 * Keep this loader independent from guideData: the latter also owns the
 * sourced yeast catalogue and must not be pulled into the index shell. */
let catalogue: HopVariety[] | undefined;
let loading: Promise<HopVariety[]> | undefined;
/** Bundled references are immutable during this module's lifetime. Saved rows
 * are merged separately by useHopCatalogue and continue following the repository. */
export const peekGuideVarieties = () => catalogue;
export function loadGuideVarieties(): Promise<HopVariety[]> {
  if (catalogue) return Promise.resolve(catalogue);
  return loading ??= Promise.all([
    import('../../data/hopManufacturerBootstrap.json'),
    import('../../data/hopGuideVarietyBootstrap.json'),
    import('../../data/hopStyleVarietyBootstrap.json'),
  ]).then(([manufacturer, guide, styleReferences]) => {
    const rows = [...manufacturer.default.hopVarieties, ...guide.default.hopVarieties, ...styleReferences.default.hopVarieties, ...studyPack.hopVarieties, ...trialPack.hopVarieties].map(row => {
      assertHopDocument('hopVarieties', row);
      return row as HopVariety;
    });
    catalogue = rows;
    return rows;
  }).catch(error => { loading = undefined; throw error; });
}
