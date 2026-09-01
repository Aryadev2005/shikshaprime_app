module.exports = {
        apps: [ {
                name: "accreditation-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9057 }
                }
        ]
};