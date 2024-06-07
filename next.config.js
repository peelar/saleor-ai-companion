const saleorInstanceHostname = process.env.SALEOR_INSTANCE_HOSTNAME;

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: saleorInstanceHostname,
      },
    ],
  },
};
