module.exports = {
        apps: [ {
                name: "inventory-management-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9042 }
                }
        ]
};