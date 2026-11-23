import { describe, expect, it } from 'vitest';
import { analyserLigne } from '../../src/domain/carnets/analyseLocale';
import { fixtureCarnets, ID_VENTILATION, NOTE_COMME_CRITERE } from '../../src/domain/carnets/fixture';
import { carnetProche } from '../../src/domain/carnets/rattacher';
describe('explo', () => {
  it('x', () => {
    console.log('PCN19', JSON.stringify(analyserLigne(NOTE_COMME_CRITERE)));
    const F = fixtureCarnets({ g35: true }).filter(d => d.type === 'carnet') as never[];
    const V = F.find((d: { id: string }) => d.id === ID_VENTILATION)!;
    console.log('PCN20', JSON.stringify(carnetProche(V, F)), (F as { title: string }[]).map(d => d.title));
  });
});
