import React from "react";
import CanvasConstellationField from "./ConstellationField.jsx";

export type ConstellationFieldVariant =
  | "constellation-field"
  | "particle-drift"
  | "particle-network"
  | "gateway-flow"
  | "connectivity-graph"
  | "interface-lines"
  | "defense-lines"
  | "topo-field";

export type ConstellationFieldProps = {
  variant?: ConstellationFieldVariant;
  mode?: "dark" | "light" | "auto";
  speed?: number;
  size?: number;
  density?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function ConstellationField(props: ConstellationFieldProps) {
  return <CanvasConstellationField {...props} />;
}

export default ConstellationField;

