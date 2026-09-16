import React from 'react';
import { ChevronRight, ArrowLeft, User, Layers, Database } from 'lucide-react';
import { Route, UserRole } from '../types';

interface NavbarProps {
  route: Route;
  totalProjects: number;
  userRole: UserRole;
  dbStatus?: 'connected' | 'syncing' | 'error';
  onSetUserRole: (role: UserRole) => void;
  onNavigateToPortfolio: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  route,
  totalProjects,
  userRole,
  dbStatus = 'connected',
  onSetUserRole,
  onNavigateToPortfolio,
  onToggleMobileSidebar
}) => {
  return (
    <header className="bg-white border-b border-grey-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Breadcrumbs / Context Path */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle sidebar button on mobile */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-full bg-grey-100 hover:bg-grey-200 text-grey-600 transition-colors shrink-0"
              title="Abrir menu de navegação lateral"
            >
              <Layers className="w-5 h-5" />
            </button>

            <nav className="min-w-0 flex items-center" aria-label="Navegação hierárquica">
              {route.name === 'portfolio' ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <span className="text-grey-500">Governança T.I</span>
                  <ChevronRight className="w-3.5 h-3.5 text-grey-400 shrink-0" />
                  <span className="text-grey-900 font-bold">Portfólio de Soluções</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-lighter text-brand-dark border border-brand-light ml-1">
                    {totalProjects} {totalProjects === 1 ? 'Solução' : 'Soluções'}
                  </span>
                </div>
              ) : route.name === 'settings' ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <button
                    onClick={onNavigateToPortfolio}
                    className="hover:text-brand-dark font-semibold transition-colors shrink-0 flex items-center gap-1 text-brand-main"
                    title="Voltar ao Portfólio Geral"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Portfólio</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-grey-400 shrink-0" />
                  <span className="text-grey-900 font-bold">Parametrização & Regras</span>
                </div>
              ) : route.name === 'new-project' ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <button
                    onClick={onNavigateToPortfolio}
                    className="hover:text-brand-dark font-semibold transition-colors shrink-0 flex items-center gap-1 text-brand-main"
                    title="Voltar ao Portfólio Geral"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Portfólio</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-grey-400 shrink-0" />
                  <span className="text-grey-900 font-bold">Cadastro de Nova Solução</span>
                </div>
              ) : (
                /* route.name === 'project' */
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <button
                    onClick={onNavigateToPortfolio}
                    className="hover:text-brand-dark font-semibold transition-colors shrink-0 flex items-center gap-1 text-brand-main"
                    title="Voltar ao Portfólio Geral"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Portfólio</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-grey-400 shrink-0" />
                  <span className="text-grey-900 font-bold">Espaço da Solução</span>
                </div>
              )}
            </nav>
          </div>

          {/* Right: Database Status & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Database Status Indicator */}
            {dbStatus === 'connected' ? (
              <div
                id="firestore-status-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800"
                title="Banco de dados Cloud Firestore conectado em tempo real"
              >
                <Database className="w-3 h-3 text-emerald-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Firestore Conectado</span>
                <span className="sm:hidden">Firestore</span>
              </div>
            ) : dbStatus === 'syncing' ? (
              <div
                id="firestore-status-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-800"
                title="Sincronizando com Firestore..."
              >
                <Database className="w-3 h-3 text-amber-600 animate-spin" />
                <span className="hidden sm:inline">Sincronizando...</span>
                <span className="sm:hidden">Sync...</span>
              </div>
            ) : (
              <div
                id="firestore-status-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-grey-100 border border-grey-300 text-grey-700"
                title="Operando com cache local"
              >
                <Database className="w-3 h-3 text-grey-500" />
                <span>Cache Local</span>
              </div>
            )}

            {/* User Role Simulator Selector */}
            <div
              className="flex items-center gap-1.5 bg-grey-100 hover:bg-grey-200 px-3 py-1 rounded-full border border-grey-300 transition-colors"
              title="Simulação de perfil de acesso"
            >
              <User className="w-3.5 h-3.5 text-grey-500" />
              <span className="text-[11px] text-grey-500 font-medium hidden sm:inline">Perfil:</span>
              <select
                value={userRole}
                onChange={(e) => onSetUserRole(e.target.value as UserRole)}
                className="text-xs font-bold text-grey-900 bg-transparent cursor-pointer focus:outline-hidden"
              >
                <option value="admin">Admin ▾</option>
                <option value="padrao">Padrão</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
