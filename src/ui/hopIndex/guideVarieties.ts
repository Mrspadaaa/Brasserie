import { assertHopDocument, type HopVariety } from '../../../functions/src/hopIndexSchema';
import studyPack from '../../data/hopStudyBootstrap.json';
import trialPack from '../../data/hopTrialBootstrap.json';

/** Read-only hop references used by the index and its search controls.
 * Keep this loader independent from guideData: the latter also owns the
 * sourced yeast catalogue and must not be pulled into the index shell. */
export async function loadGuideVarieties(): Promise<HopVariety[]> {
  const [manufacturer, guide, styleReferences] = await Promise.all([
    import('../../data/hopManufacturerBootstrap.json'),
    import('../../data/hopGuideVarietyBootstrap.json'),
    import('../../data/hopStyleVarietyBootstrap.json'),
  ]);
  return [...manufacturer.default.hopVarieties, ...guide.default.hopVarieties, ...styleReferences.default.hopVarieties, ...studyPack.hopVarieties, ...trialPack.hopVarieties].map(row => {
    assertHopDocument('hopVarieties', row);
    return row as HopVariety;
  });
}
