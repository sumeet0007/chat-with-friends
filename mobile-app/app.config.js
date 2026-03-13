module.exports = ({ config }) => {
  return {
    ...config,
    // Disable New Architecture for better compatibility with CallKeep/InCallManager
    newArchEnabled: false,
    android: {
      ...config.android,
      // Priority for environment variable, fallback to app.json's value
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile || "./google-services.json",
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: "3ae4947f-b0cc-4c07-a0c7-002b08311a4c"
      }
    }
  };
};
