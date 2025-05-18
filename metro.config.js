const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Додаємо підтримку .cjs
config.resolver.assetExts.push("cjs");

// Налаштування для react-native-svg-transformer
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// Виключення проблемних бібліотек (ws)
config.resolver.blockList = [
  /node_modules\/ws\/index\.js/,
  /node_modules\/ws\/lib\/.*/,
  /node_modules\/stream-browserify\//, // Якщо десь використовується
  /node_modules\/readable-stream\//, // Можлива залежність
];

module.exports = config;
