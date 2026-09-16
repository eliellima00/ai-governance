import React from 'react';
import { ChevronRight, ArrowLeft, User, Layers } from 'lucide-react';
import { Route, UserRole } from '../types';
import { AttoLogo } from './AttoLogo';

interface NavbarProps {
  route: Route;
  totalProjects: number;
  userRole: UserRole;
  onSetUserRole: (role: UserRole) => void;
  onNavigateToPortfolio: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  route,
  totalProjects,
  userRole,
  onSetUserRole,
  onNavigateToPortfolio,
  onToggleMobileSidebar
}) => {
  return (
    <header className="bg-white border-b border-grey-300 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Breadcrumbs & Return buttons */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle sidebar button on mobile for all routes */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-full bg-grey-100 hover:bg-grey-200 text-grey-600 transition-colors shrink-0"
              title="Abrir menu de navegação lateral"
            >
              <Layers className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              {route.name === 'portfolio' ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-grey-500 font-medium">
                    <span className="flex items-center gap-1 text-brand-wordmark font-bold">
                      <AttoLogo className="scale-75 origin-left" isCollapsed={false} subtitle="Governança" />
                    </span>
                    <ChevronRight className="w-3 h-3 text-grey-400 shrink-0" />
                    <span className="text-brand-main font-semibold truncate">
                      Portfólio de Soluções
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <h1 className="text-base font-bold text-grey-900 truncate">
                      Gestão de Demandas Departamentais
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-lighter text-brand-dark border border-brand-light">
                      {totalProjects} Soluções Ativas
                    </span>
                  </div>
                </div>
              ) : route.name === 'settings' ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-grey-500 font-medium">
                    <button
                      onClick={onNavigateToPortfolio}
                      className="hover:text-brand-dark font-semibold transition-colors shrink-0 flex items-center gap-1 text-brand-main"
                      title="Voltar ao Portfólio Geral"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Portfólio</span>
                    </button>
                    <ChevronRight className="w-3 h-3 text-grey-400 shrink-0" />
                    <span className="text-grey-900 font-bold">Administração & Parametrização</span>
                  </div>
                  <h1 className="text-base font-bold text-grey-900 mt-0.5">
                    Configuração de Regras de Governança
                  </h1>
                </div>
              ) : route.name === 'new-project' ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-grey-500 font-medium">
                    <button
                      onClick={onNavigateToPortfolio}
                      className="hover:text-brand-dark font-semibold transition-colors shrink-0 flex items-center gap-1 text-brand-main"
                      title="Voltar ao Portfólio Geral"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Portfólio</span>
                    </button>
                    <ChevronRight className="w-3 h-3 text-grey-400 shrink-0" />
                    <span className="text-grey-900 font-bold">Cadastro de Nova Solução</span>
                  </div>
                  <h1 className="text-base font-bold text-grey-900 mt-0.5">
                    Triagem & Diagnóstico Inicial
                  </h1>
                </div>
              ) : (
                /* route.name === 'project' */
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-grey-500 font-medium">
                    <button
                      onClick={onNavigateToPortfolio}
                      className="hover:text-brand-dark font-semibold transition-colors shrink-0 flex items-center gap-1 text-brand-main"
                      title="Voltar ao Portfólio Geral"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Portfólio</span>
                    </button>
                    <ChevronRight className="w-3 h-3 text-grey-400 shrink-0" />
                    <span className="text-grey-900 font-bold">Solução Departamental</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Role Switcher & Header CTAs */}
          <div className="flex items-center gap-3 shrink-0">
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
