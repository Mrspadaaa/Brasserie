import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import '../../src/index.css';

// Same water boundary case already used by waterManualImpact.test.tsx.
const fixture: WaterState = {
  styleCode: '20C', diRatioPct: 20, spargeDiRatioPct: 20,
  mashWaterL: 10.8, spargeWaterL: 21.5, allSaltsInMash: true,
  doses: { gypse: 2.5, cacl2: 5.2, nahco3: 1.6 },
  disabled: [], acidId: 'lactique', acidOverride: { mash: 0, sparge: 6.2 },
  ratioOverride: 0.7,
};

function Fixture() {
  const [water, setWater] = useState<WaterState>(structuredClone(fixture));
  return <main className="min-h-screen bg-cave-950 px-2 py-2 text-cave-50 sm:mx-auto sm:max-w-4xl sm:px-4 sm:py-4">
    <h1 className="mb-2 text-base font-semibold">Atelier de l’eau · fixture locale</h1>
    <p className="mb-2 text-xs text-cave-400">Source projet : {DEFAULT_WATER_SOURCE.name} · cas de régression des effets de dose.</p>
    <SaltSolver
      source={DEFAULT_WATER_SOURCE}
      onSourceChange={() => {}}
      beerEbc={3.6}
      beerVolumeL={24}
      brew={{
        style: 'Imperial Stout',
        totalGristKg: 2.2,
        grist: [{ name: 'Pilsner Malz', kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }],
      }}
      state={water}
      onChange={setWater}
      noSparge={false}
      onNoSpargeChange={() => {}}
    />
  </main>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
