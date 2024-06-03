import { delimiter } from 'path';
import { getEnvForPackageManager, getPathForPackageManager } from '../src';
import { getPathOverrideForPackageManager } from '../src/fs/run-user-scripts';

describe('Test `getEnvForPackageManager()`', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log');
    consoleWarnSpy = jest.spyOn(console, 'warn');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each<{
    name: string;
    args: Parameters<typeof getEnvForPackageManager>[0];
    want: unknown;
    /**
     * Expected output on `console.log`. Set to `null` when no output is
     * expected.
     */
    consoleLogOutput?: string | null;
    /**
     * Expected output on `console.warn`. Set to `null` when no output is
     * expected.
     */
    consoleWarnOutput?: string | null;
  }>([
    {
      name: 'should do nothing to env for npm < 6 and node < 16',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 1,
        env: {
          FOO: 'bar',
        },
      },
      want: {
        FOO: 'bar',
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should not set npm path if corepack enabled',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        packageJsonPackageManager: 'npm@*',
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        FOO: 'bar',
        ENABLE_EXPERIMENTAL_COREPACK: '1',
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should not prepend npm path again if already detected',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          PATH: `/node16/bin-npm7${delimiter}foo`,
        },
      },
      want: {
        FOO: 'bar',
        PATH: `/node16/bin-npm7${delimiter}foo`,
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should not set path if node is 16 and npm 7+ is detected',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        FOO: 'bar',
        PATH: 'foo',
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should set YARN_NODE_LINKER w/yarn if it is not already defined',
      args: {
        cliType: 'yarn',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
        },
      },
      want: {
        FOO: 'bar',
        YARN_NODE_LINKER: 'node-modules',
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should not set YARN_NODE_LINKER if it already exists',
      args: {
        cliType: 'yarn',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          YARN_NODE_LINKER: 'exists',
        },
      },
      want: {
        FOO: 'bar',
        YARN_NODE_LINKER: 'exists',
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should set path if pnpm 7+ is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        FOO: 'bar',
        PATH: `/pnpm7/node_modules/.bin${delimiter}foo`,
      },
      consoleLogOutput:
        'Detected `pnpm-lock.yaml` version 5.4 generated by pnpm@7.x',
      consoleWarnOutput: null,
    },
    {
      name: 'should set path if pnpm 8 is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 6.0,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        FOO: 'bar',
        PATH: `/pnpm8/node_modules/.bin${delimiter}foo`,
      },
      consoleLogOutput:
        'Detected `pnpm-lock.yaml` version 6 generated by pnpm@8.x',
      consoleWarnOutput: null,
    },
    {
      name: 'should set path if pnpm 8 is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 9.0,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        FOO: 'bar',
        PATH: `/pnpm9/node_modules/.bin${delimiter}foo`,
      },
      consoleLogOutput:
        'Detected `pnpm-lock.yaml` version 9 generated by pnpm@9.x',
      consoleWarnOutput: null,
    },
    {
      name: 'should set path if bun v1 is detected',
      args: {
        cliType: 'bun',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 0,
        env: {
          FOO: 'bar',
          PATH: '/usr/local/bin',
        },
      },
      want: {
        FOO: 'bar',
        PATH: `/bun1${delimiter}/usr/local/bin`,
      },
      consoleLogOutput: 'Detected `bun.lockb` generated by bun@1.x',
      consoleWarnOutput:
        'Warning: Bun is used as a package manager at build time only, not at runtime with Functions',
    },
    {
      name: 'should not set pnpm path if corepack is enabled',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: 'pnpm@*',
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        FOO: 'bar',
        ENABLE_EXPERIMENTAL_COREPACK: '1',
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
    {
      name: 'should not prepend pnpm path again if already detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          PATH: `/pnpm7/node_modules/.bin${delimiter}foo`,
        },
      },
      want: {
        FOO: 'bar',
        PATH: `/pnpm7/node_modules/.bin${delimiter}foo`,
      },
      consoleLogOutput: null,
      consoleWarnOutput: null,
    },
  ])('$name', ({ args, want, consoleLogOutput, consoleWarnOutput }) => {
    expect(
      getEnvForPackageManager({
        cliType: args.cliType,
        lockfileVersion: args.lockfileVersion,
        packageJsonPackageManager: args.packageJsonPackageManager,
        nodeVersion: args.nodeVersion,
        env: args.env,
      })
    ).toStrictEqual(want);

    // Check console.log output
    if (typeof consoleLogOutput === 'string') {
      expect(consoleLogSpy).toHaveBeenCalledWith(consoleLogOutput);
    } else if (consoleLogOutput === null) {
      expect(consoleLogSpy).not.toHaveBeenCalled();
    }

    // Check console.warn output
    if (typeof consoleWarnOutput === 'string') {
      expect(consoleWarnSpy).toHaveBeenCalledWith(consoleWarnOutput);
    } else if (consoleLogOutput === null) {
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    }
  });
});

describe('Test `getPathOverrideForPackageManager()`', () => {
  test.each<{
    name: string;
    args: Parameters<typeof getEnvForPackageManager>[0];
    want: unknown;
  }>([
    {
      name: 'should do nothing to env for npm < 6 and node < 16',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 1,
        env: {
          FOO: 'bar',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
      },
    },
    {
      name: 'should not set npm path if corepack enabled',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        packageJsonPackageManager: 'npm@*',
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
      },
    },

    {
      name: 'should not set path if node is 16 and npm 7+ is detected',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
      },
    },
    {
      name: 'should not set path if pnpm 6 is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 5.3, // detects as pnpm@6, which is the default
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
      },
    },
    {
      name: 'should set path if pnpm 7+ is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: 'pnpm-lock.yaml',
        detectedPackageManager: 'pnpm@7.x',
        path: '/pnpm7/node_modules/.bin',
      },
    },
    {
      name: 'should set path if pnpm 8 is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 6.1,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: 'pnpm-lock.yaml',
        detectedPackageManager: 'pnpm@8.x',
        path: '/pnpm8/node_modules/.bin',
      },
    },
    {
      name: 'should set path if pnpm 9 is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 7.0,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: 'pnpm-lock.yaml',
        detectedPackageManager: 'pnpm@9.x',
        path: '/pnpm9/node_modules/.bin',
      },
    },
    {
      name: 'should set path if bun v1 is detected',
      args: {
        cliType: 'bun',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        packageJsonPackageManager: undefined,
        lockfileVersion: 0,
        env: {
          FOO: 'bar',
          PATH: '/usr/local/bin',
        },
      },
      want: {
        detectedLockfile: 'bun.lockb',
        detectedPackageManager: 'bun@1.x',
        path: '/bun1',
      },
    },
    {
      name: 'should not set pnpm path if corepack is enabled',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: 'pnpm@*',
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
      },
    },
    {
      name: 'should not set pnpm path if corepack is enabled, pnpm 9 and valid lockfile version',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        packageJsonPackageManager: 'pnpm@9.*',
        lockfileVersion: 7.0,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
      },
    },
  ])('$name', ({ args, want }) => {
    expect(
      getPathOverrideForPackageManager({
        cliType: args.cliType,
        lockfileVersion: args.lockfileVersion,
        corepackPackageManager: args.packageJsonPackageManager,
        nodeVersion: args.nodeVersion,
      })
    ).toStrictEqual(want);
  });

  test('should throw error if corepack is enabled, pnpm 9 is set, and invalid lockfile version is used', () => {
    expect(() => {
      getPathOverrideForPackageManager({
        cliType: 'pnpm',
        lockfileVersion: 5.0,
        corepackPackageManager: 'pnpm@9.*',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
      });
    }).toThrow();
  });

  test('should throw error if corepack is enabled, pnpm 8 is set, and invalid lockfile version is used', () => {
    expect(() => {
      getPathOverrideForPackageManager({
        cliType: 'pnpm',
        lockfileVersion: 5.1,
        corepackPackageManager: 'pnpm@8.*',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
      });
    }).toThrow();
  });

  test('should throw error if corepack package manager does not match cliType', () => {
    expect(() => {
      getPathOverrideForPackageManager({
        cliType: 'npm',
        lockfileVersion: 9.0,
        corepackPackageManager: 'pnpm@9.*',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
      });
    }).toThrow();
  });
  test('should throw error if corepack package manager has invalid semver version', () => {
    expect(() => {
      getPathOverrideForPackageManager({
        cliType: 'pnpm',
        lockfileVersion: 9.0,
        corepackPackageManager: 'pnpm@invalid',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
      });
    }).toThrow();
  });
});

describe('Test `getPathForPackageManager()`', () => {
  test.each<{
    name: string;
    args: Parameters<typeof getPathForPackageManager>[0];
    want: unknown;
  }>([
    {
      name: 'should do nothing to env for npm < 6 and node < 16',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        lockfileVersion: 1,
        env: {
          FOO: 'bar',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should not set npm path if corepack enabled',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should not prepend npm path again if already detected',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 14, range: '14.x', runtime: 'nodejs14.x' },
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          PATH: `/node16/bin-npm7${delimiter}foo`,
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should not set path if node is 16 and npm 7+ is detected',
      args: {
        cliType: 'npm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should set YARN_NODE_LINKER w/yarn if it is not already defined',
      args: {
        cliType: 'yarn',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: 'node-modules',
      },
    },
    {
      name: 'should not set YARN_NODE_LINKER if it already exists',
      args: {
        cliType: 'yarn',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        lockfileVersion: 2,
        env: {
          FOO: 'bar',
          YARN_NODE_LINKER: 'exists',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should set path if pnpm 7+ is detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          PATH: 'foo',
        },
      },
      want: {
        detectedLockfile: 'pnpm-lock.yaml',
        detectedPackageManager: 'pnpm@7.x',
        path: '/pnpm7/node_modules/.bin',
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should set path if bun v1 is detected',
      args: {
        cliType: 'bun',
        nodeVersion: { major: 18, range: '18.x', runtime: 'nodejs18.x' },
        lockfileVersion: 0,
        env: {
          FOO: 'bar',
          PATH: '/usr/local/bin',
        },
      },
      want: {
        detectedLockfile: 'bun.lockb',
        detectedPackageManager: 'bun@1.x',
        path: '/bun1',
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should not set pnpm path if corepack is enabled',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          ENABLE_EXPERIMENTAL_COREPACK: '1',
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
    {
      name: 'should not prepend pnpm path again if already detected',
      args: {
        cliType: 'pnpm',
        nodeVersion: { major: 16, range: '16.x', runtime: 'nodejs16.x' },
        lockfileVersion: 5.4,
        env: {
          FOO: 'bar',
          PATH: `/pnpm7/node_modules/.bin${delimiter}foo`,
        },
      },
      want: {
        detectedLockfile: undefined,
        detectedPackageManager: undefined,
        path: undefined,
        yarnNodeLinker: undefined,
      },
    },
  ])('$name', ({ args, want }) => {
    expect(
      getPathForPackageManager({
        cliType: args.cliType,
        lockfileVersion: args.lockfileVersion,
        nodeVersion: args.nodeVersion,
        env: args.env,
      })
    ).toStrictEqual(want);
  });
});
