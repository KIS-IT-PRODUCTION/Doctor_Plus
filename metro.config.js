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

// !!! Важливо: Вимкнення unstable_enablePackageExports для вирішення проблем з 'ws' та подібними Node.js модулями
config.resolver.unstable_enablePackageExports = false;

module.exports = config;