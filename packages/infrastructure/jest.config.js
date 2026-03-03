module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: {
        types: ['jest', 'node']
      }
    }]
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.test.ts',
    '!lib/**/*.d.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
