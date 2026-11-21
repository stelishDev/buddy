module.exports = function (api) {
  api.cache(true);
  // Home screen widget files (src/widgets/MeMateWidget.*.tsx) are compiled into an
  // isolated widget runtime by expo-widgets, so they must use React's standard JSX,
  // not NativeWind's. Everything else gets NativeWind.
  const widgetFiles = /[\\/]src[\\/]widgets[\\/]MeMateWidget\./;
  return {
    overrides: [
      {
        exclude: widgetFiles,
        presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
      },
      {
        test: widgetFiles,
        presets: ["babel-preset-expo"],
      },
    ],
  };
};
