import React from 'react';
import {
  FolderKanban,
  PlusCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { Route, UserRole } from '../types';
import { can } from '../utils/permissions';
import { AttoLogo } from './AttoLogo';

export interface SidebarProps {
  route: Route;
  onNavigateToPortfolio: () => void;
  onNavigateToSettings: () => void;
  onOpenNewProject: () => void;
  onNavigateToMyWeek: () => void;
  myWeekEnabled: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userRole: UserRole;
}

/**
 * Menu lateral puro: só navegação de topo (Gestão de Demandas / Nova Solução / Parametrização).
 * Não lista soluções, não tem busca, não tem abas de solução — isso vive na própria página da solução.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  route,
  onNavigateToPortfolio,
  onNavigateToSettings,
  onOpenNewProject,
  onNavigateToMyWeek,
  myWeekEnabled,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userRole
}) => {
  const canCreate = can('create_project', userRole);
  const canConfigure = can('edit_settings', userRole);

  const handleGoPortfolio = () => {
    onNavigateToPortfolio();
    onCloseMobile();
  };

  const handleCreateNew = () => {
    onOpenNewProject();
    onCloseMobile();
  };

  const handleGoSettings = () => {
    onNavigateToSettings();
    onCloseMobile();
  };

  const handleGoMyWeek = () => {
    onNavigateToMyWeek();
    onCloseMobile();
  };

  const isPortfolioActive = route.name === 'portfolio' || route.name === 'project';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white text-grey-700 flex flex-col transition-all duration-300 ease-in-out border-r border-grey-200 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-3 border-b border-grey-200 flex items-center justify-between">
          <div
            onClick={handleGoPortfolio}
            className="cursor-pointer select-none group min-w-0"
            title="Ir para a Gestão de Demandas (Industriatto ATTO Sementes)"
          >
            <AttoLogo isCollapsed={isCollapsed} subtitle="Governança T.I" />
          </div>

          {!isCollapsed && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                userRole === 'admin'
                  ? 'bg-brand-lighter text-brand-dark border border-brand-light'
                  : 'bg-grey-100 text-grey-500 border border-grey-200'
              }`}
            >
              {userRole}
            </span>
          )}
        </div>

        {/* Menu Principal */}
        <div className="p-2 space-y-1.5">
          {!isCollapsed && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-grey-400">
              Menu Principal
            </div>
          )}

          <button
            onClick={handleGoPortfolio}
            data-tour="sidebar-portfolio-btn"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
              isPortfolioActive
                ? 'bg-brand-dark text-white shadow-xs font-bold'
                : 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Gestão de Demandas Departamentais (Portfólio Geral)"
          >
            <FolderKanban className={`w-4 h-4 shrink-0 ${isPortfolioActive ? 'text-white' : 'text-brand-main'}`} />
            {!isCollapsed && <span className="truncate">Gestão de Demandas</span>}
          </button>

          {myWeekEnabled && (
            <button
              onClick={handleGoMyWeek}
              data-tour="sidebar-my-week-btn"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
                route.name === 'my-week'
                  ? 'bg-brand-dark text-white shadow-xs font-bold'
                  : 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Minha Semana (planner semanal) — beta"
            >
              <CalendarDays
                className={`w-4 h-4 shrink-0 ${route.name === 'my-week' ? 'text-white' : 'text-brand-main'}`}
              />
              {!isCollapsed && <span className="truncate">Minha Semana</span>}
            </button>
          )}

          {canCreate && (
            <button
              onClick={handleCreateNew}
              data-tour="sidebar-new-solution-btn"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
                route.name === 'new-project'
                  ? 'bg-brand-dark text-white shadow-xs font-bold'
                  : 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Cadastrar Nova Solução / Demanda"
            >
              <PlusCircle
                className={`w-4 h-4 shrink-0 ${route.name === 'new-project' ? 'text-white' : 'text-brand-main'}`}
              />
              {!isCollapsed && <span className="truncate">Nova Solução</span>}
            </button>
          )}

          {canConfigure && (
            <button
              onClick={handleGoSettings}
              data-tour="sidebar-settings-btn"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
                route.name === 'settings'
                  ? 'bg-brand-dark text-white shadow-xs font-bold'
                  : 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Parametrização & Regras de Governança T.I"
            >
              <SlidersHorizontal
                className={`w-4 h-4 shrink-0 ${route.name === 'settings' ? 'text-white' : 'text-grey-500'}`}
              />
              {!isCollapsed && <span className="truncate">Parametrização</span>}
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Collapse Sidebar Toggle (Desktop only) */}
        <div className="p-2.5 border-t border-grey-200 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-full text-grey-400 hover:text-grey-700 hover:bg-grey-100 transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
