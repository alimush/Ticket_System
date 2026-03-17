/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    env: {
      MONGODB_URI: process.env.MONGODB_URI,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
    },
  };
  
  export default nextConfig;