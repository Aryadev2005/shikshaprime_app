// module.exports = {
//         apps: [ {
//                 name: "identity-service",
//                 script: "dist/server.js",
//                 env_production: { NODE_ENV: "production", PORT: 9050 }
//                 }
//         ]
// };
module.exports = {
  apps: [
    {
      name: "identity-service",
      script: "dist/server.js",

      // Local development (your laptop)
      env_local: {
        NODE_ENV: "development",
        PORT: 9050
      },

      // Linux VM environment (.env.test)
      env_test: {
        NODE_ENV: "production",
        NEXT_PUBLIC_ENV: "production",
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        BASE_PATH: process.env.BASE_PATH,
        PORT: process.env.PORT || 9050
      },

      // AWS Lightsail environment (.env.demo)
      env_demo: {
        NODE_ENV: "production",
        NEXT_PUBLIC_ENV: "demo",
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        BASE_PATH: process.env.BASE_PATH,
        PORT: process.env.PORT || 9050
      }
    }
  ]
};