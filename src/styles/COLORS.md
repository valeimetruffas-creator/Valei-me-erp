/**
 * GUIA DE CORES - VALEI-ME CONFEITARIA
 * =====================================
 * 
 * ESTRUTURA DE CORES DO SISTEMA
 */

import { theme } from './theme';

/**
 * MAPEAMENTO DE CORES ANTIGAS PARA NOVAS
 * 
 * Substitua:
 * - bg-[#784E23] → bg-[${theme.colors.primary}]
 * - text-[#784E23] → text-[${theme.colors.primary}]
 * - bg-[#CDA85B] → bg-[${theme.colors.primaryLight}]
 * - text-[#FDEDD2] → text-[${theme.colors.background}]
 * - bg-[#FDEDD2] → bg-[${theme.colors.background}]
 * - bg-[#676C3C] → bg-[${theme.colors.primaryDark}] (alternativa: criar verde/cinza no tema)
 * - bg-[#565A30] → hover state
 * - bg-[#B8935A] → hover state (primaryLight)
 * - bg-[#5A391A] → bg-[${theme.colors.primaryDark}]
 */

// Mapeamento de referência
export const colorMapping = {
  marromPrincipal: {
    old: '#784E23',
    new: theme.colors.primary,
    uso: 'Background principal, textos em contraste'
  },
  douradoClaro: {
    old: '#CDA85B',
    new: theme.colors.primaryLight,
    uso: 'Botões, headers, destaques'
  },
  marromEscuro: {
    old: '#5A391A',
    new: theme.colors.primaryDark,
    uso: 'Botões secundários, hovers'
  },
  fundoClaro: {
    old: '#FDEDD2',
    new: theme.colors.background,
    uso: 'Cards, backgrounds alternativos'
  },
  branco: {
    old: '#FFFFFF',
    new: theme.colors.surface,
    uso: 'Superfícies brancas, inputs'
  },
  cinzaVerde: {
    old: '#676C3C',
    new: 'USAR: theme.colors.primaryDark ou novo tom',
    uso: 'Botões secundários'
  }
};

/**
 * PADRÕES DE USO
 * 
 * PRIMÁRIO (Marrom #784E23):
 * - Page backgrounds
 * - Texto principal
 * - Borders
 * 
 * PRIMARY LIGHT (Dourado #CDA85B):
 * - Botões principais
 * - Headers de seções
 * - Destaques
 * 
 * PRIMARY DARK (Marrom Escuro #5A391A):
 * - Hover states
 * - Elementos secundários
 * - Variações de sombra
 * 
 * BACKGROUND (Creme #FDEDD2):
 * - Cards
 * - Formulários
 * - Backgrounds alternativos
 * - Texto claro
 * 
 * SURFACE (Branco #FFFFFF):
 * - Inputs
 * - Cards principais
 * 
 * SUCCESS (#2E7D32):
 * - Confirmações
 * - Estados positivos
 * 
 * WARNING (#ED6C02):
 * - Atenções
 * - Estados de cautela
 * 
 * DANGER (#C62828):
 * - Erros
 * - Deletions
 * - Estados críticos
 * 
 * INFO (#1565C0):
 * - Informações
 * - Notificações
 */

export const usagePatterns = {
  primaryContainer: `bg-[${theme.colors.primary}] text-[${theme.colors.background}]`,
  button: `bg-[${theme.colors.primaryLight}] text-[${theme.colors.primary}] hover:opacity-90`,
  secondaryButton: `bg-[${theme.colors.primaryDark}] text-white hover:opacity-90`,
  card: `bg-[${theme.colors.surface}] border border-[${theme.colors.border}]`,
  input: `bg-[${theme.colors.surface}] border-2 border-[${theme.colors.primary}] text-[${theme.colors.primary}]`,
  header: `text-[${theme.colors.primaryLight}]`,
  alert: {
    success: `bg-[${theme.colors.success}] bg-opacity-10 border-l-4 border-[${theme.colors.success}]`,
    warning: `bg-[${theme.colors.warning}] bg-opacity-10 border-l-4 border-[${theme.colors.warning}]`,
    danger: `bg-[${theme.colors.danger}] bg-opacity-10 border-l-4 border-[${theme.colors.danger}]`,
    info: `bg-[${theme.colors.info}] bg-opacity-10 border-l-4 border-[${theme.colors.info}]`,
  }
};
