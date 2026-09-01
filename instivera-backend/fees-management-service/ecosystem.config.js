module.exports = {
        apps: [ {
                name: "fees-management-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9059 }
                }
        ]
};