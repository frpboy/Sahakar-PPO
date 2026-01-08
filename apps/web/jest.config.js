const nextJest = require('next/jest')({
  dir: './',
})

const createJestConfig = nextJest({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
})

module.exports = createJestConfig()
