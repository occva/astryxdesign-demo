import {readdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve('@phosphor-icons/react/package.json'));
const iconFiles = readdirSync(`${packageRoot}/dist/csr`);

const phosphorIconNames = iconFiles
  .filter(fileName => fileName.endsWith('.d.ts'))
  .map(fileName => `${fileName.slice(0, -5)}Icon`);

export const validMenuIconNames = [
  'i-chart',
  'i-setting',
  'i-settings',
  'i-user',
  'i-role',
  'i-department',
  'i-menu',
  'i-table',
  ...phosphorIconNames,
];
