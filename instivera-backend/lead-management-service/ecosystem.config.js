module.exports = {
        apps: [ {
                name: "lead-management-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9044 }
                }
        ]
};