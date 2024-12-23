import { useEffect, useRef } from 'react';

import { createLog } from '@helpers/log';

const log = createLog('');

/**
 * Helps tracking the props changes made in a react functional component.
 *
 * Prints the name of the properties/states variables causing a render (or re-render).
 * For debugging purposes only.
 *
 * @usage You can simply track the props of the components like this:
 *  useRenderingTrace('MyComponent', props);
 *
 * @usage You can also track additional state like this:
 *  const [someState] = useState(null);
 *  useRenderingTrace('MyComponent', { ...props, someState });
 *
 * @param componentName Name of the component to display
 * @param propsAndStates
 * @param level
 *
 * @see https://stackoverflow.com/a/51082563/2391795
 */
export const useRenderingTrace = (
  componentName: string,
  propsAndStates: any,
  level: 'debug' | 'info' | 'log' = 'debug'
) => {
  const prev = useRef(propsAndStates);

  useEffect(() => {
    const changedProps: { [key: string]: { old: any; new: any } } =
      Object.entries(propsAndStates).reduce(
        (property: any, [key, value]: [string, any]) => {
          if (prev.current[key] !== value) {
            property[key] = {
              old: prev.current[key],
              new: value
            };
          }
          return property;
        },
        {}
      );

    if (Object.keys(changedProps).length > 0) {
      // const table = [];
      // for (const [key, value] of Object.entries(changedProps)) {
      //   table.push({ key, new: value.new, old: value.old });
      //   // table.push(`${key}: ${value.old} -> ${value.new}`);
      // }

      // eslint-disable-next-line no-console
      // log[level](`[${componentName}] Changed props:`);
      // console.table(table);
      // console.log('poop', table);
      log[level](`[${componentName}] Changed props:`, changedProps);
    }

    prev.current = propsAndStates;
  });
};
