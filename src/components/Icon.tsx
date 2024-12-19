import { ComponentProps } from 'react';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type BaseIconProps = Omit<
  ComponentProps<typeof MaterialIcons> &
    ComponentProps<typeof MaterialCommunityIcons>,
  'name'
>;

export type IconName =
  | `material-community:${keyof typeof MaterialCommunityIcons.glyphMap}`
  | keyof typeof MaterialIcons.glyphMap
  | keyof typeof MaterialCommunityIcons.glyphMap;

type IconProps = BaseIconProps & {
  name: IconName;
};

export const Icon = ({ name, ...props }: IconProps) => {
  let isMaterialCommunityIcon = false;
  if (name?.startsWith('material-community:')) {
    name = name.replace(
      'material-community:',
      ''
    ) as keyof typeof MaterialCommunityIcons.glyphMap;
    isMaterialCommunityIcon = true;
  }

  const IconComponent = isMaterialCommunityIcon
    ? MaterialCommunityIcons
    : MaterialIcons;

  return <IconComponent name={name as any} {...props} />;
};
