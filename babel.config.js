module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Removed react-native-dotenv to use Expo's native env handling
    ],
  };
};
