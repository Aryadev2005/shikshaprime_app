module.exports = {
        apps: [ {
                name: "student-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9051 }
                }
        ]
};