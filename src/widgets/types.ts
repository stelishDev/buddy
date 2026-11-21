/** Data the home screen widget shows. Must be plain JSON (it crosses into the widget runtime). */
export type MeMateWidgetProps = {
  hasMeeting: boolean;
  title: string;
  summary: string;
  /** Open action items, already trimmed to a short length. */
  actions: string[];
  openActions: number;
  updatedLabel: string;
};

export const EMPTY_WIDGET_PROPS: MeMateWidgetProps = {
  hasMeeting: false,
  title: "No meetings yet",
  summary: "Open MeMate and start a session to see notes and action items here.",
  actions: [],
  openActions: 0,
  updatedLabel: "",
};
