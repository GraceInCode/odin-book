module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!@faker-js|tr46|whatwg-url|punycode)', // Add if more ESM deps
  ],
};