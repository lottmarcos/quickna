import nextJest from 'next/jest.js';

import { configDotenv } from 'dotenv';

import type { Config } from '@jest/types';

configDotenv({ path: '.env.development' });

const createJestConfig = nextJest({ dir: '.' });

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>'],
};

export default createJestConfig(config);
