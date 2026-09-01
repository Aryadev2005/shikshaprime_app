module.exports = {
        apps: [ {
                name: "examination-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9056 }
                }
        ]
};