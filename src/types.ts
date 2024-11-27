import { makeMutable } from 'react-native-reanimated';

export type Mutable<T> = ReturnType<typeof makeMutable<T>>;
