import { SymbolView, type SFSymbol, type SymbolWeight } from "expo-symbols";
import { theme } from "@/lib/theme";

/** SF Symbols, the platform's own icon set. */
export function Icon({
  name,
  size = 20,
  color = theme.colors.text,
  weight = "semibold",
  testID,
}: {
  name: SFSymbol;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  testID?: string;
}) {
  return (
    <SymbolView
      testID={testID}
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
