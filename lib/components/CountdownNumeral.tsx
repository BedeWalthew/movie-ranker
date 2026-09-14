import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/lib/theme";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { ring: number; font: number; tick: number }> = {
  sm: { ring: 36, font: 20, tick: 4 },
  md: { ring: 56, font: 30, tick: 6 },
  lg: { ring: 96, font: 54, tick: 9 },
};

/**
 * A rank set like an Academy leader countdown: a heavy numeral inside a
 * hairline ring with four register ticks.
 */
export function CountdownNumeral({
  value,
  size = "md",
  lit = true,
  testID,
}: {
  value: number | string;
  size?: Size;
  lit?: boolean;
  testID?: string;
}) {
  const s = SIZES[size];
  const ink = lit ? theme.colors.lamp : theme.colors.textSecondary;
  const ring = lit ? "rgba(244,227,178,0.55)" : "rgba(154,149,138,0.35)";
  const digits = String(value);
  // Long numerals shrink so 3 or 4 digits still sit inside the ring.
  const font = digits.length >= 4 ? s.font * 0.68 : digits.length === 3 ? s.font * 0.8 : s.font;

  return (
    <View
      testID={testID}
      style={[
        styles.ring,
        { width: s.ring, height: s.ring, borderRadius: s.ring / 2, borderColor: ring },
      ]}
    >
      <View style={[styles.tick, { backgroundColor: ring, width: 1, height: s.tick, top: 0 }]} />
      <View style={[styles.tick, { backgroundColor: ring, width: 1, height: s.tick, bottom: 0 }]} />
      <View style={[styles.tick, { backgroundColor: ring, height: 1, width: s.tick, left: 0 }]} />
      <View style={[styles.tick, { backgroundColor: ring, height: 1, width: s.tick, right: 0 }]} />
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: theme.fonts.display,
          fontSize: font,
          lineHeight: font * 1.05,
          color: ink,
          includeFontPadding: false,
          marginTop: font * 0.06,
        }}
      >
        {digits}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  tick: { position: "absolute", alignSelf: "center" },
});
