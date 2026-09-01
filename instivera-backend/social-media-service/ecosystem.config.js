module.exports = {
        apps: [ {
                        name: "social-media-service",
                        script: "dist/server.js",
                        env_production: { NODE_ENV: "production", PORT: 9043 }
                }
        ]
};