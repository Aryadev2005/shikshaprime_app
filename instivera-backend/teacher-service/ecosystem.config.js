module.exports = {
        apps: [ {
                name: "teacher-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9052 }
                }
        ]
};