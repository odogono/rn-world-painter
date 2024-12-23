/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

type LogTypes =
  | 'assert'
  | 'log'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'dir'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'table';

const logTypes: LogTypes[] = [
  'assert',
  'log',
  'debug',
  'info',
  'warn',
  'error',
  'dir',
  'table',
  'group',
  'groupCollapsed',
  'groupEnd'
];

const ignorePrefixTypes = ['group', 'groupCollapsed', 'groupEnd', 'table'];

export type Logger = Record<LogTypes, (...args: any[]) => void>;

export const createLog = (
  prefix: string | null = null,
  disabled: LogTypes[] = []
) => {
  const prefixTxt = prefix && prefix.length > 0 ? `[${prefix}]` : '';

  const result: Logger = {} as Logger;

  let logTime = Date.now();

  for (const logType of logTypes) {
    result[logType] = (...args: any[]) => {
      const now = Date.now();
      if (now - logTime > 10000) {
        logTime = now;
      }
      const delta = now - logTime;

      const logPrefix = `[${delta}]${prefixTxt}`;

      if (!disabled.includes(logType)) {
        if (logType === 'assert') {
          const assertion = args[0];
          const rest = args.slice(1);
          console.assert(assertion, [logPrefix, ...rest].join(' '));
        } else if (ignorePrefixTypes.includes(logType)) {
          console[logType](...args);
        } else {
          console[logType](...[logPrefix, ...args]);
        }
      }
    };
  }

  if (disabled.length > 0) {
    // console.warn(`[${prefix}] some logs are disabled: ${disabled.join(', ')}`);
  }

  return result;
};
