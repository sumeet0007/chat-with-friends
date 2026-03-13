module.exports = ({ config }) => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    config.android?.googleServicesFile ||
    "./google-services.json";

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile,
    },
  };
};
