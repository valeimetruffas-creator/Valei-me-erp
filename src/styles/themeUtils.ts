import { theme } from './theme';

/**
 * Utilitário para usar cores do tema em className do Tailwind
 * Exemplo: `className={cn('p-4', tw.bg.primary)}`
 */
export const tw = {
  bg: {
    primary: `bg-[${theme.colors.primary}]`,
    primaryLight: `bg-[${theme.colors.primaryLight}]`,
    primaryDark: `bg-[${theme.colors.primaryDark}]`,
    background: `bg-[${theme.colors.background}]`,
    surface: `bg-[${theme.colors.surface}]`,
    surfaceAlt: `bg-[${theme.colors.surfaceAlt}]`,
    success: `bg-[${theme.colors.success}]`,
    warning: `bg-[${theme.colors.warning}]`,
    danger: `bg-[${theme.colors.danger}]`,
    info: `bg-[${theme.colors.info}]`,
  },
  text: {
    primary: `text-[${theme.colors.textPrimary}]`,
    secondary: `text-[${theme.colors.textSecondary}]`,
    light: `text-[${theme.colors.textLight}]`,
    primaryColor: `text-[${theme.colors.primary}]`,
    primaryLight: `text-[${theme.colors.primaryLight}]`,
  },
  border: {
    default: `border-[${theme.colors.border}]`,
  }
};

export default theme;
