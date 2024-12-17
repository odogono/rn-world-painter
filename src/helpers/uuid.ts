import uuid from 'react-native-uuid';

export const generateUUID = () => {
  return uuid.v4();
};

export const generateShortUUID = () => {
  return uuid.v4().slice(0, 8);
};
