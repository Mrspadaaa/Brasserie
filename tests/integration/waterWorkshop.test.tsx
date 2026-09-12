import React, { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SaltSolver, WaterState } from "../../src/ui/SaltSolver";
import { ZERO, DEFAULT_WATER_SOURCE } from "../../src/domain/water";
import type { WaterSource } from "../../src/types";
import { changeWaterRatio } from "../helpers/waterRatio";

afterEach(cleanup);

const source: WaterSource = {
  ...ZERO,
  id: "test",
  name: "Analyse de test",
  ca: 50,
  hco3: 100,
};
function mount(target: WaterState["customTarget"], waterSource = source) {
  let current: WaterState;
  function Host() {
    const [state, setState] = useState<WaterState>({
      styleCode: "—",
      diRatioPct: 0,
      doses: {},
      disabled: [],
      acidId: "lactique",
      mashWaterL: 30,
      spargeWaterL: 0,
      customTarget: target,
    });
    current = state;
    return (
      <SaltSolver
        state={state}
        onChange={setState}
        source={waterSource}
        onSourceChange={() => {}}
        beerEbc={8}
        beerVolumeL={25}
        noSparge
        onNoSpargeChange={() => {}}
      />
    );
  }
  render(<Host />);
  return () => current;
}

describe("Atelier : cibles explicites et commandes", () => {
  it("distingue les objectifs de Ttt et actualise le HCO₃ quand l’acide de rinçage change", () => {
    function Ttt() {
      const [state, setState] = useState<WaterState>({
        styleCode: "20C", diRatioPct: 20,
        doses: { gypse: 3.1, cacl2: 1.5, nacl: 0.5, kcl: 3 },
        disabled: [], acidId: "lactique", allSaltsInMash: true,
        mashWaterL: 10.8, spargeWaterL: 21.5,
        acidOverride: { mash: 1.2, sparge: 6.2 },
      });
      return <SaltSolver state={state} onChange={setState}
        source={DEFAULT_WATER_SOURCE} onSourceChange={() => {}}
        beerEbc={3.6} beerVolumeL={24} noSparge={false} onNoSpargeChange={() => {}}
        brew={{ style: "Imperial stout", targetPh: 5.4, totalGristKg: 2.2,
          grist: [{ name: "Pilsner Malz", kind: "grain", use: "empatage", weightKg: 2.2, colorEbc: 3.5 }],
          hops: [{ weightG: 14, stage: "boil", timeMin: 95 }, { weightG: 20, stage: "dryHop" }],
          og: 1.021, ibu: 12 }} />;
    }
    render(<Ttt />);
    expect(screen.getByText("Profil non atteint : 5/6 ions dans les plages.")).toBeInTheDocument();
    expect(screen.getByLabelText("Bilan du bicarbonate des eaux")).toHaveTextContent("62,5");
    expect(screen.getByLabelText("Bilan des objectifs de l’eau")).toHaveTextContent(/5[,.]70/);
    const sparge = screen.getByRole("textbox", { name: /Dose d’acide lactique.*au rinçage/ });
    fireEvent.change(sparge, { target: { value: "0" } });
    fireEvent.blur(sparge);
    // 133.333 ppm × 10.8 L + untreated 200 ppm × 21.5 L, divided by 32.3 L.
    expect(screen.getByRole("img", { name: /Profil ionique/ })).toHaveAccessibleName(/177,7 ppm/);
    expect(screen.getByLabelText("HCO₃ après acide — rinçage")).toHaveTextContent("200 ppm");
    expect(screen.queryByLabelText("Comprendre le bicarbonate")).not.toBeInTheDocument();
    expect(screen.getByText("Profil atteint : 6/6 ions dans les plages.")).toBeInTheDocument();
    expect(screen.getByLabelText("Bilan des objectifs de l’eau")).toHaveTextContent(/5[,.]70/);
  });

  it("traite une cible HCO₃ partielle avec l’acide et conserve les autres ions", () => {
    const state = mount({ name: "Bicarbonate seul", ions: { hco3: 40 } });
    fireEvent.click(screen.getByRole("button", { name: "Proposer les doses" }));
    expect(
      screen.getByLabelText("HCO₃ après acide — empâtage"),
    ).toHaveTextContent("40 ppm");
    expect(
      screen.getByLabelText("Cible HCO₃ après traitement"),
    ).toHaveTextContent("cible 40 ppm atteinte");
    expect(
      screen.getByRole("textbox", { name: /Dose d’acide.*à l’empâtage/ }),
    ).toHaveValue("3");
    expect(Object.values(state().doses).every((g) => g > 0)).toBe(true);
    expect(
      screen.getByRole("img", { name: /Profil ionique/ }),
    ).toHaveAccessibleName(/Calcium.*50 ppm/);
  });

  it("conserve une cible sans chlorure puis autorise un vrai ratio nul au slider", () => {
    const state = mount(
      { name: "Sans chlorure", ions: { so4: 70, cl: 0 } },
      { ...source, ...ZERO },
    );
    fireEvent.click(screen.getByRole("button", { name: "Proposer les doses" }));
    const slider = screen.getByRole("slider", { name: "SO₄ ⇄ Cl" });
    expect(slider).toHaveAttribute(
      "aria-valuetext",
      expect.stringMatching(/sans chlorure/i),
    );
    expect(
      screen.getByRole("img", { name: /Profil ionique/ }),
    ).toHaveAccessibleName(/Chlorure[^)]*\) 0 ppm/);
    changeWaterRatio(slider, 0);
    expect(state().ratioOverride).toBe(0);
    const so4 = Number(screen.getByRole("img", { name: /Profil ionique/ })
      .getAttribute('aria-label')!.match(/Sulfate[^)]*\) ([\d.]+) ppm/)![1]);
    expect(so4).toBeGreaterThanOrEqual(56);
    expect(so4).toBeLessThanOrEqual(84);
    expect(screen.getByLabelText('Rapport obtenu')).toHaveTextContent(/\d/);
  });

  it("réserve le changement de produit au recalcul des doses dans la bonne unité", () => {
    mount({ name: "Bicarbonate seul", ions: { hco3: 40 } });
    const dose = screen.getByRole("textbox", {
      name: /Dose d’acide lactique.*à l’empâtage/,
    });
    fireEvent.change(dose, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /Acidifiant/ }));
    expect(
      screen.getByText(/Produit changé : doses recalculées/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Revenir aux doses d’acide calculées",
      }),
    ).not.toBeInTheDocument();
  });
});
