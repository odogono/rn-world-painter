import { makeMutable } from 'react-native-reanimated';

export type Mutable<T> = ReturnType<typeof makeMutable<T>>;

export type vec2 = [number, number];
