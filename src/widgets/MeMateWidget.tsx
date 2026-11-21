import type { MeMateWidgetProps } from "./types";

/**
 * Fallback for platforms without home screen widgets (web).
 * Metro picks MeMateWidget.android.tsx / MeMateWidget.ios.tsx on phones.
 */
const MeMateWidget = {
  updateSnapshot: (_props: MeMateWidgetProps) => {},
  reload: () => {},
};

export default MeMateWidget;
