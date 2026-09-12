import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render as testingRender, screen, within } from "@testing-library/react";
import { WaterTargetStatus } from "../../src/ui/water/WaterTargetStatus";
import { calculateWaterTreatment, DEFAULT_WATER_SOURCE, estimateMashPh, targetRaForGrist } from "../../src/domain/water";
import type { TreatmentInput } from "../../src/domain/water/treatment";
import { styleByCode, styleFromTargetIons } from "../../src/domain/waterStyles";

afterEach(cleanup);

const input: TreatmentInput = {
  diRatioPct: 20,
  mashWaterL: 10.8,
  spargeWaterL: 21.5,
  allSaltsInMash: true,
  doses: { gypse: 3.1, cacl2: 1.5, nacl: 0.5, kcl: 3 },
  acidId: "lactique",
  acidOverride: { mash: 1.2, sparge: 6.2 },
};

const grist = [{
  name: "Pilsner Malz", weightKg: 2.2, kind: "grain", use: "empatage", colorEbc: 3.5,
}];
const raBand = targetRaForGrist(3.6, grist, 10.8 / 2.2);

function props(patch: Partial<TreatmentInput> = {}) {
  const retained = { ...input, ...patch };
  const treatment = calculateWaterTreatment(DEFAULT_WATER_SOURCE, retained, raBand);
  return {
    style: styleByCode("20C"),
    treatment,
    phEstimate: estimateMashPh(grist, treatment.mashPhRa, retained.mashWaterL / 2.2),
    raBand,
    beerEbc: 3.6,
    mashWaterL: retained.mashWaterL,
    spargeWaterL: retained.spargeWaterL,
  };
}

describe("Water target status", () => {
  it("marks the saved Ttt profile incomplete because its bicarbonate is below the required range", () => {
    const scenario = props();
    expect(scenario.treatment.treatedTotal).toEqual({
      ca: 103, mg: 11.2, na: 12.5, so4: 75.9, cl: 93.6, hco3: 62.5,
    });
    render(<WaterTargetStatus {...scenario} />);

    expect(screen.getByText("Profil non atteint : 5/6 ions dans les plages.")).toBeInTheDocument();
    const explanation = screen.getByLabelText("Comprendre le bicarbonate");
    expect(explanation).toHaveTextContent("Imperial Stout indique 120–250 ppm");
    expect(explanation).toHaveTextContent("3,6 EBC : elle est pâle");
    expect(screen.getByText("Empâtage (10,8 L)").parentElement).toHaveTextContent("133,3 ppm");
    expect(screen.getByText("Rinçage (21,5 L)").parentElement).toHaveTextContent("27 ppm");
    expect(screen.getByText("Moyenne sur 32,3 L").parentElement).toHaveTextContent("62,5 ppm");
    expect(screen.getByLabelText("Bilan du bicarbonate des eaux")).toHaveTextContent("pondérée par les volumes");
    expect(explanation).toHaveTextContent("Après acide : -21 ppm CaCO₃");
    expect(explanation).toHaveTextContent("-43 à 0 ppm CaCO₃");
    expect(explanation).toHaveTextContent("L’alcalinité de l’empâtage est dans cette plage");
    expect(explanation).not.toHaveTextContent(/pH.*atteint/i);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const details = explanation.querySelector("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("Moyenne sur 32,3 L").closest("details")).toHaveAttribute("open");
    const ph = screen.getByLabelText("Bilan du pH estimé");
    expect(ph).toHaveTextContent("pH estimé : 5,70 ±0,15. Consigne : 5,4");
    expect(ph).toHaveTextContent("Estimation au-dessus de la plage 5,2–5,5");
    expect(ph).toHaveTextContent("la correction du pH se décide après mesure");
    expect(ph.closest("details")).toHaveAttribute("open");
  });

  it("does not invent a bicarbonate discrepancy when it is already in the style's range", () => {
    render(<WaterTargetStatus {...props({ acidOverride: { mash: 0, sparge: 0 } })} />);
    expect(screen.getByText("Profil atteint : 6/6 ions dans les plages.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Comprendre le bicarbonate")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Bilan du pH estimé")).toHaveTextContent("Estimation au-dessus");
    expect(screen.getByText("Moyenne sur 32,3 L").parentElement).toHaveTextContent("200 ppm");
    expect(screen.getByText("Moyenne sur 32,3 L").closest("details")).toHaveAttribute("open");
  });

  it("keeps the photo's two waters and weighted result available on request", () => {
    render(<WaterTargetStatus {...props({
      doses: { gypse: 2.6, cacl2: 2.1, nacl: 0.5, kcl: 3 },
      acidOverride: { mash: 0, sparge: 6.2 },
    })} />);
    const balance = screen.getByLabelText("Bilan du bicarbonate des eaux");
    expect(within(balance).getByText("Empâtage (10,8 L)").parentElement).toHaveTextContent("200 ppm");
    expect(within(balance).getByText("Rinçage (21,5 L)").parentElement).toHaveTextContent("27 ppm");
    const average = within(balance).getByText("Moyenne sur 32,3 L");
    expect(average.parentElement).toHaveTextContent("84,8 ppm");
    expect(average.closest("details")).toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "HCO₃ sous la cible" })).toBeVisible();
    expect(screen.getByLabelText("Écart HCO₃ à la cible")).toHaveTextContent("84,8 ppm : 35,2 ppm sous le minimum de 120 ppm");
    expect(screen.getByLabelText("Comprendre le bicarbonate")).toHaveTextContent("Le dosage automatique cherche cette plage après les deux doses d’acide");
    fireEvent.click(within(balance).getByText("Départ, sels et acide"));
    const table = within(balance).getByRole("table", { name: "Évolution du bicarbonate par eau" });
    expect(within(table).getByRole("row", { name: /Dose d’acide/ })).toHaveTextContent("0 mL6,2 mL");
  });

  it("shows each dilution independently and refreshes a zero acid dose in a personal profile", () => {
    const profile = styleFromTargetIons({ hco3: 90.9 });
    const scenario = props({ spargeDiRatioPct: 80, acidOverride: { mash: 0, sparge: 0.5 } });
    const view = render(<WaterTargetStatus {...scenario} style={profile} customTarget />);
    fireEvent.click(screen.getByText("Départ, sels et acide"));
    const table = screen.getByRole("table", { name: "Évolution du bicarbonate par eau" });
    const readings = (name: string) => within(within(table).getByRole("row", { name: new RegExp(name) }))
      .getAllByRole("cell").map((cell) => cell.textContent);
    expect(readings("Après dilution")).toEqual(["200", "50"]);
    expect(readings("Après acide")).toEqual(["200", "36"]);
    expect(screen.getByText("Moyenne sur 32,3 L").parentElement).toHaveTextContent("90,9 ppm");

    view.rerender(<WaterTargetStatus {...props({ spargeDiRatioPct: 80, acidOverride: { mash: 0, sparge: 0 } })}
      style={profile} customTarget />);
    expect(readings("Dose d’acide")).toEqual(["0 mL", "0 mL"]);
    expect(readings("Après acide")).toEqual(["200", "50"]);
    expect(screen.getByText("Moyenne sur 32,3 L").parentElement).toHaveTextContent("100,2 ppm");
  });

  it("does not count omitted minerals or replace an explicit personal bicarbonate diagnostic", () => {
    const scenario = props({ hco3Target: 200 });
    expect(scenario.treatment.hco3Target?.reached).toBe(false);
    render(<WaterTargetStatus {...scenario}
      style={styleFromTargetIons({ cl: 93.6, hco3: 200 })} customTarget />);
    expect(screen.getByText("Profil non atteint : 1/2 ions dans les plages personnelles.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Comprendre le bicarbonate")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Écart HCO₃ à la cible")).not.toBeInTheDocument();
    expect(screen.queryByText(/repère/)).not.toBeInTheDocument();
  });

  it("includes bicarbonate together with the other mineral deviations", () => {
    render(<WaterTargetStatus {...props({ doses: { ...input.doses, gypse: 20 } })} />);
    expect(screen.getByText("Profil non atteint : 3/6 ions dans les plages.")).toBeInTheDocument();
    expect(screen.getByText(/Calcium : .*Sulfate :/)).toBeInTheDocument();
    expect(screen.queryByText("Profil non atteint : 5/6 ions dans les plages.")).not.toBeInTheDocument();
  });

  it("reports bicarbonate above the style's upper reference without reversing the gap", () => {
    const scenario = props({ acidOverride: { mash: 0, sparge: 0 } });
    render(<WaterTargetStatus {...scenario} style={styleByCode("21A")} />);
    expect(screen.getByRole("heading", { name: "HCO₃ au-dessus de la cible" })).toBeVisible();
    expect(screen.getByLabelText("Écart HCO₃ à la cible")).toHaveTextContent("200 ppm : 140 ppm au-dessus du maximum de 60 ppm");
  });

  it("does not claim the mash alkalinity is met when a retained acid dose leaves it too high", () => {
    render(<WaterTargetStatus {...props({ acidOverride: { mash: 0, sparge: 6.2 } })} />);
    expect(screen.getByLabelText("Comprendre le bicarbonate")).toHaveTextContent(
      "L’alcalinité de l’empâtage est hors de cette plage",
    );
    expect(screen.queryByText("L’alcalinité de l’empâtage est dans cette plage.")).not.toBeInTheDocument();
  });

  it("omits sparge readings and mixing claims when the recipe has no sparge water", () => {
    render(<WaterTargetStatus {...props({ spargeWaterL: 0, acidOverride: { mash: 4 } })} />);
    expect(screen.getByLabelText("Comprendre le bicarbonate")).toBeInTheDocument();
    expect(screen.queryByText(/^Rinçage/)).not.toBeInTheDocument();
    expect(screen.queryByText(/pondérée par les volumes/)).not.toBeInTheDocument();
  });

  it("keeps the recipe's pH setpoint visible without treating an estimate as a measurement", () => {
    render(<WaterTargetStatus {...props()} targetPh={5.3} />);
    expect(screen.getByLabelText("Bilan du pH estimé")).toHaveTextContent("Consigne : 5,3");
    expect(screen.getByLabelText("Bilan du pH estimé")).not.toHaveTextContent(/atteint/i);
  });

  it("does not show mash readings, pH or an empty mash objective for sparge water alone", () => {
    render(<WaterTargetStatus {...props({ mashWaterL: 0 })} />);
    expect(screen.getByLabelText("Bilan du bicarbonate des eaux")).toHaveTextContent("27 ppm");
    expect(screen.queryByText(/^Empâtage/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Bilan du pH estimé")).not.toBeInTheDocument();
    expect(screen.queryByText("Voir l’objectif d’empâtage")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Comprendre le bicarbonate")).toHaveTextContent("uniquement le rinçage");
  });

  it("shows missing pH information without claiming a zero or hiding mineral results", () => {
    render(<WaterTargetStatus {...props()} phEstimate={estimateMashPh(undefined, 0, 4)} />);
    expect(screen.getByLabelText("Bilan du pH estimé")).toHaveTextContent("pH non estimé");
    expect(screen.getByLabelText("Bilan du pH estimé")).not.toHaveTextContent("pH estimé : 0");
    expect(screen.getByText("Profil non atteint : 5/6 ions dans les plages.")).toBeInTheDocument();
  });

  it.each([0, NaN, Infinity, -1])("does not claim targets are met without valid water volumes (%s)", (mashWaterL) => {
    render(<WaterTargetStatus {...props()} mashWaterL={mashWaterL} spargeWaterL={0} />);
    expect(screen.queryByLabelText("Bilan des objectifs de l’eau")).not.toBeInTheDocument();
  });
});

function render(...args:Parameters<typeof testingRender>){const view=testingRender(...args);const summary=screen.queryByText('Détail des diagnostics et hypothèses');if(summary)fireEvent.click(summary);return view;}
