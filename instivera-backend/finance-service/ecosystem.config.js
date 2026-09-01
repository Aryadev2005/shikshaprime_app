module.exports = {
        apps: [ {
                name: "finance-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9058 }
                }
        ]
};