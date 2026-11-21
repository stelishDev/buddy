import type { EavesWidgetProps } from "./types";

/**
 * Fallback for platforms without home screen widgets (web).
 * Metro picks EavesWidget.android.tsx / EavesWidget.ios.tsx on phones.
 */
const EavesWidget = {
  updateSnapshot: (_props: EavesWidgetProps) => {},
  reload: () => {},
};

export default EavesWidget;
