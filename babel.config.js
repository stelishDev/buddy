module.exports = function (api) {
  api.cache(true);
  // Home screen widget files (src/widgets/EavesWidget.*.tsx) are compiled into an
  // isolated widget runtime by expo-widgets, so they must use React's standard JSX,
  // not NativeWind's. Everything else gets NativeWind.
  // Functions (not RegExp) are used because Metro loads this config without a filename
  // when computing its cache key, and Babel rejects RegExp patterns in that case.
  const widgetFiles = /[\\/]src[\\/]widgets[\\/]EavesWidget\./;
  const isWidget = (filename) => typeof filename === "string" && widgetFiles.test(filename);
  return {
    overrides: [
      {
        test: (filename) => !isWidget(filename),
        presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
      },
      {
        test: (filename) => isWidget(filename),
        presets: ["babel-preset-expo"],
      },
    ],
  };
};
