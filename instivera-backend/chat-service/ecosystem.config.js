module.exports = {
        apps: [ {
                name: "chat-service",
                script: "dist/server.js",
                env_production: { NODE_ENV: "production", PORT: 9054 }
                }
        ]
};