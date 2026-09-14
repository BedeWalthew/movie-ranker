import { NativeTabs } from "expo-router/unstable-native-tabs";
import { theme } from "@/lib/theme";
import { TAB_NAMES } from "@/lib/constants";
import { RefreshProvider } from "@/lib/refreshContext";

export default function TabLayout() {
  return (
    <RefreshProvider>
      <NativeTabs
        tintColor={theme.colors.primary}
        backgroundColor={theme.colors.tabBar}
        iconColor={{ default: theme.colors.textSecondary, selected: theme.colors.primary }}
        labelStyle={{
          default: { color: theme.colors.textSecondary },
          selected: { color: theme.colors.primary },
        }}
      >
        <NativeTabs.Trigger name="(ranked)">
          <NativeTabs.Trigger.Icon sf={{ default: "film.stack", selected: "film.stack.fill" }} />
          <NativeTabs.Trigger.Label>{TAB_NAMES.ranked}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(unranked)">
          <NativeTabs.Trigger.Icon sf={{ default: "tray", selected: "tray.fill" }} />
          <NativeTabs.Trigger.Label>{TAB_NAMES.unranked}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </RefreshProvider>
  );
}
