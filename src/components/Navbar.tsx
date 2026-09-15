import React from 'react';
import {
  Building2,
  ChevronRight,
  ArrowLeft,
  Sliders,
  PlusCircle,
  Shield,
  User,
  Sparkles,
  Info,
  Layers,
  Workflow
} from 'lucide-react';
import { Route, SolutionProject, UserRole } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { can } from '../utils/permissions';
import { AttoLogo } from './AttoLogo';

interface NavbarProps {
  route: Route;
  currentProject?: SolutionProject;
  totalProjects: number;
  residualScore: number;
  userRole: UserRole;
  onSetUserRole: (role: UserRole) => void;
  onNavigateToPortfolio: () => void;
  onNavigateToSettings: () => void;
  onOpenNewProject: () => void;
  onToggleMobileSidebar: () => void;
}

const tabLabels: Record<string, string> = {
  glpi: 'Ficha do Ativo & Doc Viva (GLPI)',
  diagnostic: 'Diagnóstico de Risco (regras)',
  action_plan: 'Plano de Ação & Mitigações',
  evolution: 'Evolução da Criticidade',
  estimation: 'Estimativa, Cronograma & Esteira (E0..E6)'
};

export const Navbar: React.FC<NavbarProps> = ({
  route,
  currentProject,
  totalProjects,
  residualScore,
  userRole,
  onSetUserRole,
  onNavigateToPortfolio,
  onNavigateToSettings,
  onOpenNewProject,
  onToggleMobileSidebar
}) => {
  const isAdmin = can(userRole, 'manage_settings');
  const currentRiskColor = getRiskColorClass(
    residualScore <= 5 ? 'BAIXO' : residualScore <= 12 ? 'MEDIO' : residualScore <= 20 ? 'ALTO' : 'CRITICO'
  );

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
              ) : (
                /* route.name === 'project' */
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-grey-500 font-medium truncate">
                    <button
                      onClick={onNavigateToPortfolio}
                      className="hover:text-white hover:bg-brand-dark font-bold transition-colors shrink-0 flex items-center gap-1 text-brand-main bg-brand-lighter px-2.5 py-0.5 rounded-full border border-brand-light"
                      title="Voltar ao Portfólio Geral de Soluções"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Portfólio</span>
                    </button>
                    <ChevronRight className="w-3 h-3 text-grey-400 shrink-0" />
                    <span className="truncate text-grey-600 font-medium max-w-[200px] sm:max-w-xs">
                      {currentProject?.name}
                    </span>
                    <ChevronRight className="w-3 h-3 text-grey-400 shrink-0" />
                    <span className="text-brand-main font-bold truncate">
                      {tabLabels[route.tab] || route.tab}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <h2 className="text-base font-bold text-grey-900 truncate max-w-sm sm:max-w-md">
                      {currentProject?.name}
                    </h2>
                    {currentProject && (
                      <>
                        <span className="font-mono px-2 py-0.5 rounded-full text-[10px] font-bold bg-info-50 text-info-700 border border-info-200">
                          {currentProject.assetId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-0.5">
                          <Workflow className="w-2.5 h-2.5" />
                          Tipo {currentProject.projectType || 'A'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-grey-100 text-grey-700 border border-grey-300">
                          Esteira {currentProject.govStage || 'E1'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Role Switcher & Header CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Project Residual Risk Pill (Only shown in project workspace) */}
            {route.name === 'project' && currentProject && (
              <div className="hidden md:flex items-center gap-2 bg-grey-100 px-3 py-1 rounded-full border border-grey-300">
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-grey-500 font-bold block leading-tight">
                    Risco Residual
                  </span>
                  <span className="text-xs font-black text-grey-900 font-mono">
                    {residualScore} pts
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentRiskColor.badge}`}>
                  {residualScore <= 5 ? 'Baixo' : residualScore <= 12 ? 'Médio' : residualScore <= 20 ? 'Alto' : 'Crítico'}
                </span>
              </div>
            )}

            {/* Quick Parametrização Button (Pill Button Industriatto) */}
            {route.name === 'portfolio' && (
              <button
                onClick={onNavigateToSettings}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-grey-600 hover:text-grey-900 bg-white hover:bg-grey-100 rounded-full border border-grey-300 transition-colors"
                title="Configurações e parâmetros de governança"
              >
                <Sliders className="w-3.5 h-3.5 text-grey-500" />
                <span>Parametrização</span>
              </button>
            )}

            {/* Quick Add Project Button (Primary Pill Button Industriatto) */}
            {route.name === 'portfolio' && (
              <button
                onClick={onOpenNewProject}
                disabled={!can(userRole, 'create_solution')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full shadow-xs transition-colors ${
                  can(userRole, 'create_solution')
                    ? 'bg-brand-main hover:bg-brand-dark text-white'
                    : 'bg-grey-400 text-white cursor-not-allowed'
                }`}
                title={
                  can(userRole, 'create_solution')
                    ? 'Cadastrar nova solução no portfólio'
                    : 'Criação restrita ao perfil Admin'
                }
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nova Solução</span>
              </button>
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
