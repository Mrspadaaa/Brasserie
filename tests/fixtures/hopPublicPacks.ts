import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import database from '../../src/data/hopDatabaseBootstrap.json';
import legacy from '../../src/data/hopLegacyBootstrap.json';
import maverick from '../../src/data/hopBeerMaverickBootstrap.json';
import study from '../../src/data/hopStudyBootstrap.json';
import publicLots from '../../src/data/hopPublicLotBootstrap.json';
import conventions from '../../src/data/hopKnowledgeBootstrap.json';
import notes from '../../src/data/hopResearchBootstrap.json';
import yeasts from '../../src/data/hopYeastBootstrap.json';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';

/** Real published inputs, deliberately separate from synthetic software fixtures. */
export const publicHopPacks = { manufacturer, database, legacy, maverick, study, publicLots };
export const publicHopData = (): HopEngineData => structuredClone({
  varieties: Object.values(publicHopPacks).flatMap(p => p.hopVarieties as unknown[]),
  lots: publicLots.hopLots, knowledge: [...conventions, ...study.hopKnowledge, ...notes, ...yeasts]
}) as HopEngineData;
