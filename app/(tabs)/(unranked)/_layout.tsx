import { TabStack } from "@/lib/tabStack";
import { TAB_NAMES } from "@/lib/constants";

export default function UnrankedStackLayout() {
  return <TabStack title={TAB_NAMES.unranked} searchPlaceholder="Search unranked films" />;
}
