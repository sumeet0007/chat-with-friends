const appConfig = require('./app.json');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON || appConfig.expo.android.googleServicesFile;

module.exports = {
  ...appConfig,
  expo: {
    ...appConfig.expo,
    android: {
      ...appConfig.expo.android,
      googleServicesFile,
    },
  },
};
