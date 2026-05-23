const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-simple-vars": { variables: { NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "" } }
  },
};

export default config;
