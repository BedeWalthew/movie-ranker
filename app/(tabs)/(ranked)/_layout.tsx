import { TabStack } from "@/lib/tabStack";
import { TAB_NAMES } from "@/lib/constants";

export default function RankedStackLayout() {
  return <TabStack title={TAB_NAMES.ranked} searchPlaceholder="Search ranked films" />;
}
