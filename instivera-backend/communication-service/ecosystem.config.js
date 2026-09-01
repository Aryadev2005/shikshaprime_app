module.exports = {
        apps: [ {
                name: "communication-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9046 }
                }
        ]
};