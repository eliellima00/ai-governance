import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Compass, PartyPopper } from 'lucide-react';
import { Button } from '../ui/Button';

interface TourStep {
  selector: string | null;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Etapas que dependem da barra lateral fixa, indisponível em telas estreitas. */
  desktopOnly?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: null,
    title: 'Bem-vindo à Governança de Soluções ATTO',
    content:
      'Este painel organiza o cadastro, o diagnóstico de risco e o plano de ação de cada solução ou ativo de T.I da ATTO Sementes. Vamos fazer um tour rápido pelas principais áreas.'
  },
  {
    selector: '[data-tour="sidebar-portfolio-btn"]',
    title: 'Gestão de Demandas',
    content:
      'Aqui fica o portfólio geral: a lista de todas as soluções cadastradas, com indicadores, filtros e diferentes visões (planilha, alinhamento e kanban).',
    placement: 'right',
    desktopOnly: true
  },
  {
    selector: '[data-tour="sidebar-new-solution-btn"]',
    title: 'Cadastrar uma Nova Solução',
    content:
      'Use este atalho a qualquer momento para iniciar o cadastro de uma nova solução ou ativo de T.I e começar o fluxo de governança.',
    placement: 'right',
    desktopOnly: true
  },
  {
    selector: '[data-tour="sidebar-settings-btn"]',
    title: 'Parametrização & Regras',
    content:
      'Área para configurar pesos de risco, limites de criticidade, catálogos de estimativa e checklists de governança (acesso restrito ao perfil Admin).',
    placement: 'right',
    desktopOnly: true
  },
  {
    selector: '[data-tour="navbar-db-status"]',
    title: 'Status da Conexão',
    content:
      'Este indicador mostra se os dados estão sincronizados em tempo real com o banco (Supabase) ou operando com cache local de segurança.',
    placement: 'bottom'
  },
  {
    selector: '[data-tour="navbar-role-switch"]',
    title: 'Simulador de Perfil de Acesso',
    content:
      'Alterne entre os perfis Admin e Padrão para simular o que cada tipo de usuário pode ver e editar no sistema.',
    placement: 'bottom'
  },
  {
    selector: '[data-tour="portfolio-new-solution-btn"]',
    title: 'Nova Solução',
    content:
      'Este botão abre o formulário de cadastro: dados do ativo GLPI, responsáveis, tipo de arquitetura e objetivo da solução.',
    placement: 'bottom'
  },
  {
    selector: '[data-tour="portfolio-kpis"]',
    title: 'Indicadores do Portfólio',
    content:
      'Acompanhe rapidamente o total de soluções, os itens priorizados pela gestão, impedimentos ativos e agendamentos marcados.',
    placement: 'bottom'
  },
  {
    selector: '[data-tour="portfolio-view-switcher"]',
    title: 'Visões & Filtros',
    content:
      'Alterne entre Planilha Executiva, Alinhamento 1:1 e Kanban, e use os filtros de área, etapa e prioridade para focar no que importa.',
    placement: 'bottom'
  },
  {
    selector: null,
    title: 'Pronto para começar!',
    content:
      'Cadastre sua primeira solução para iniciar o diagnóstico de risco, montar o plano de ação e acompanhar a evolução na esteira de governança de T.I.'
  }
];

interface AppTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPortfolio: () => void;
}

const TOOLTIP_WIDTH = 336;
const TOOLTIP_HEIGHT_ESTIMATE = 220;
const VIEWPORT_MARGIN = 16;
const SPOTLIGHT_PADDING = 8;
const MAX_LOCATE_ATTEMPTS = 6;
const LOCATE_RETRY_MS = 80;

function computeTooltipPosition(
  rect: DOMRect | null,
  placement: TourStep['placement']
): React.CSSProperties {
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: TOOLTIP_WIDTH };
  }

  let top: number;
  let left: number;

  switch (placement || 'bottom') {
    case 'top':
      top = rect.top - TOOLTIP_HEIGHT_ESTIMATE - 16;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
      left = rect.left - TOOLTIP_WIDTH - 16;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
      left = rect.right + 16;
      break;
    case 'bottom':
    default:
      top = rect.bottom + 16;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
  }

  top = Math.min(Math.max(top, VIEWPORT_MARGIN), window.innerHeight - TOOLTIP_HEIGHT_ESTIMATE - VIEWPORT_MARGIN);
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN);

  return { top, left, width: TOOLTIP_WIDTH };
}

export const AppTour: React.FC<AppTourProps> = ({ isOpen, onClose, onNavigateToPortfolio }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // A barra lateral fixa não existe em telas estreitas; filtra essas etapas nesse caso.
  const steps = useMemo(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    return isDesktop ? TOUR_STEPS : TOUR_STEPS.filter((s) => !s.desktopOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;

  const goNext = useCallback(() => {
    setStepIndex((idx) => {
      if (idx >= steps.length - 1) {
        onClose();
        return idx;
      }
      return idx + 1;
    });
  }, [onClose, steps.length]);

  const goPrev = useCallback(() => {
    setStepIndex((idx) => Math.max(0, idx - 1));
  }, []);

  // Ao abrir o tour, garante que estamos no Portfólio (onde vive a maior parte das etapas)
  useEffect(() => {
    if (isOpen) {
      onNavigateToPortfolio();
      setStepIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Localiza o elemento-alvo da etapa atual e mantém a posição em sincronia
  useEffect(() => {
    if (!isOpen || !step) return;

    if (!step.selector) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const locate = () => {
      if (cancelled) return;
      const el = document.querySelector(step.selector as string);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) setRect(el.getBoundingClientRect());
          });
        });
      } else if (attempts < MAX_LOCATE_ATTEMPTS) {
        attempts += 1;
        setTimeout(locate, LOCATE_RETRY_MS);
      } else if (!cancelled) {
        // Elemento indisponível (ex: ação restrita ao perfil atual) — pula a etapa
        setRect(null);
        setStepIndex((idx) => (idx < steps.length - 1 ? idx + 1 : idx));
      }
    };

    locate();

    const reposition = () => {
      const el = step.selector ? document.querySelector(step.selector as string) : null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stepIndex, steps]);

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen || !step) return null;

  const tooltipStyle = computeTooltipPosition(rect, step.placement);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Tour guiado da aplicação">
      {/* Bloqueia interação com o restante da página enquanto o tour está ativo */}
      <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight: escurece tudo, exceto o elemento em destaque */}
      {rect ? (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)',
            border: '2px solid rgba(255,255,255,0.9)'
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-grey-900/72 pointer-events-none" />
      )}

      {/* Cartão de conteúdo da etapa */}
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-grey-200 p-5 transition-all duration-300 ease-out"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-dark uppercase tracking-wider">
            {isLastStep ? <PartyPopper className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
            <span>
              Etapa {stepIndex + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-grey-400 hover:text-grey-700 transition-colors shrink-0"
            title="Fechar tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-sm font-black text-grey-900 mb-1.5">{step.title}</h3>
        <p className="text-xs text-grey-600 leading-relaxed">{step.content}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-grey-100">
          <button
            onClick={onClose}
            className="text-[11px] font-semibold text-grey-400 hover:text-grey-600 transition-colors"
          >
            Pular tour
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button size="sm" color="secondary" onClick={goPrev} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Voltar
              </Button>
            )}
            <Button size="sm" color="primary" onClick={goNext} rightIcon={!isLastStep ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}>
              {isLastStep ? 'Concluir' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
