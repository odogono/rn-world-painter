import { makeMutable } from 'react-native-reanimated';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';

import { createLog } from '@helpers/log';
import { mmkvStorage } from '@model/storage';
import { Mutable, Vector2 } from '@types';

const log = createLog('FlowerMenuPersist');

export const appStorage = createJSONStorage(
  () => {
    return {
      getItem: async (key: string): Promise<string | null> => {
        const data = mmkvStorage.getString(key) ?? null;
        return data ?? null;
      },

      setItem: async (key: string, value: any) => {
        // log.debug('[storage] setItem', key, value);
        return mmkvStorage.set(key, value);
      },
      removeItem: async (key: string) => {
        // log.debug('[storage] removeItem', key);

        return mmkvStorage.delete(key);
      }
    };
  },
  {
    reviver: (key, value) => {
      return value;
    },
    replacer: (key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        value.hasOwnProperty('_isReanimatedSharedValue')
      ) {
        return (value as Mutable<Vector2>).value;
      }
      return value;
    }
  }
);

// const storage: StateStorage = {
//   getItem: async (name: string): Promise<string | null> => {
//     log.debug('[storage] getItem', name);
//     return null;
//   },
//   setItem: async (name: string, value: string): Promise<void> => {
//     log.debug('[storage] setItem', name, value);
//   },
//   removeItem: async (name: string): Promise<void> => {
//     log.debug('[storage] removeItem', name);
//   }
// };
