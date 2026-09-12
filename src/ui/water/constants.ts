import { SaltId, AcidId, WaterIons } from "../../types";

export const RADAR_IONS: Array<keyof WaterIons> = [
  "cl",
  "so4",
  "ca",
  "mg",
  "na",
  "hco3",
];

export const SALT_SHORT: Record<SaltId, string> = {
  gypse: "Gypse",
  cacl2: "CaCl₂",
  epsom: "Epsom",
  mgcl2: "MgCl₂",
  nacl: "Sel",
  nahco3: "Bicarb.",
  caco3: "Craie",
  chaux: "Chaux",
  kcl: "KCl",
};

export const ACID_SHORT: Record<AcidId, string> = {
  lactique: "Lactique",
  phosphorique: "Phosphorique",
  maltAcidule: "Malt acidulé",
};
