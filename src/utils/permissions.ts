import { UserRole } from '../types';

export type PermissionAction =
  | 'edit_settings'
  | 'manage_settings'
  | 'delete_project'
  | 'create_project'
  | 'create_solution'
  | 'manage_backup'
  | 'reset_data'
  | 'edit_project_glpi'
  | 'advance_stage'
  | 'edit_estimation'
  | 'toggle_action_item'
  | 'add_activity_log'
  | 'add_notes'
  | 'toggle_priority'
  | 'manage_impediment'
  | 'view_project';

/**
 * Centralizador de regras de permissão para simulação de perfis (Admin e Padrão).
 * Suporta can(action, role), can(role, action) ou strings arbitrárias de forma segura.
 */
export function can(arg1?: string, arg2?: string): boolean {
  if (!arg1) return false;

  const isFirstRole = arg1 === 'admin' || arg1 === 'padrao';
  const role: UserRole = (isFirstRole ? arg1 : (arg2 || 'admin')) as UserRole;
  let action: string = isFirstRole ? (arg2 || '') : arg1;

  if (role === 'admin') {
    return true; // Admin tem acesso irrestrito
  }

  // Normalizar aliases
  if (action === 'manage_settings') action = 'edit_settings';
  if (action === 'create_solution') action = 'create_project';

  // Perfil Padrão: consulta e anotações/marcações operacionais
  switch (action) {
    case 'view_project':
    case 'toggle_action_item':
    case 'add_activity_log':
    case 'add_notes':
      return true;

    case 'edit_settings':
    case 'delete_project':
    case 'create_project':
    case 'manage_backup':
    case 'reset_data':
    case 'edit_project_glpi':
    case 'advance_stage':
    case 'edit_estimation':
    case 'toggle_priority':
    case 'manage_impediment':
    default:
      return false;
  }
}
