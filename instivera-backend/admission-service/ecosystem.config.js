module.exports = {
        apps: [ {
                name: "admission-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9041 }
                }
        ]
};