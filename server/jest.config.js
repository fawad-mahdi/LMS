module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test/setup.js'],
  globalTeardown: '<rootDir>/src/test/teardown.js',
  testMatch: ['**/__tests__/**/*.test.js'],
  forceExit: true,
  testTimeout: 15000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/migrate.js',
    '!src/db/seed.js',
    '!src/test/**',
  ],
  coverageReporters: ['text', 'lcov'],
  // Run integration suites serially to avoid DB race conditions
  maxWorkers: 1,
};
