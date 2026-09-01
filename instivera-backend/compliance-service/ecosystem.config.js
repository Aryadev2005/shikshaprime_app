module.exports = {
        apps: [ {
                name: "compliance-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9045 }
                }
        ]
};