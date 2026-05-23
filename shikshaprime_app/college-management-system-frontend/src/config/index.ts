type Env = "development" | "qa" | "production"; 
const env = (process.env.NEXT_PUBLIC_ENV as Env) || "development"; 
const configs: Record<Env, { apiUrl: string; debug: boolean }> = { 
    development: { apiUrl: process.env.NEXT_PUBLIC_API_URL!, debug: true }, 
    qa: { apiUrl: process.env.NEXT_PUBLIC_API_URL!, debug: false }, 
    production: { apiUrl: process.env.NEXT_PUBLIC_API_URL!, debug: false }, 
}; 
export default configs[env];