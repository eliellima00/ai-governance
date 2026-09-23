import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectTab, RiskLevel, SolutionProject } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { addDays, formatShortPtBr, getWeekStart, isSameDate, parseKnownDate, toIsoDate } from '../utils/date';
import { PageHeader } from './ui';

export interface MyWeekViewProps {
  projects: SolutionProject[];
  onUpdateProject: (project: SolutionProject) => void;
  onNavigateToProject: (projectId: string, tab: ProjectTab) => void;
}

interface PlanItem {
  id: string; // `meeting:{projectId}` ou `action:{projectId}:{actionId}`
  kind: 'meeting' | 'action';
  projectId: string;
  projectName: string;
  title: string;
  date: Date | null;
  riskLevel: RiskLevel;
}

const NO_DATE_COL = 'sem-data';

/**
 * Board semanal (Seg-Sex + "Sem data") com arrastar-e-soltar, reunindo reuniões agendadas
 * (SolutionProject.scheduledMeetings) e ações pendentes do plano de ação de todos os projetos
 * (ActionItem.deadline). Arrastar um card pra um dia sobrescreve a data dele; arrastar pra
 * "Sem data" limpa. Só cobre os projetos cadastrados na governança — chamados de suporte GLPI
 * e trabalho em outros projetos não entram aqui, pois o modelo de dados atual não tem esse conceito.
 */
export const MyWeekView: React.FC<MyWeekViewProps> = ({ projects, onUpdateProject, onNavigateToProject }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => addDays(getWeekStart(new Date()), weekOffset * 7), [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const items: PlanItem[] = useMemo(() => {
    const list: PlanItem[] = [];
    projects.forEach((project) => {
      (project.scheduledMeetings || []).forEach((meeting) => {
        list.push({
          id: `meeting:${project.id}:${meeting.id}`,
          kind: 'meeting',
          projectId: project.id,
          projectName: project.name,
          title: meeting.subject || 'Reunião / Alinhamento',
          date: parseKnownDate(meeting.date),
          riskLevel: project.initialRisk
        });
      });
      project.actionPlan
        .filter((a) => a.status === 'Aguardando' || a.status === 'Em andamento')
        .forEach((action) => {
          list.push({
            id: `action:${project.id}:${action.id}`,
            kind: 'action',
            projectId: project.id,
            projectName: project.name,
            title: action.title,
            date: parseKnownDate(action.deadline),
            riskLevel: project.initialRisk
          });
        });
    });
    return list;
  }, [projects]);

  const columns = useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    weekDays.forEach((d) => map.set(toIsoDate(d), []));
    map.set(NO_DATE_COL, []);

    items.forEach((item) => {
      if (!item.date) {
        map.get(NO_DATE_COL)!.push(item);
        return;
      }
      const day = weekDays.find((d) => isSameDate(d, item.date as Date));
      if (!day) return; // data real fora da semana visível — não aparece nesta view
      map.get(toIsoDate(day))!.push(item);
    });

    return map;
  }, [items, weekDays]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const targetKey = String(over.id);
    const [kind, projectId, itemIdRaw] = String(active.id).split(':');
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    if (kind === 'meeting') {
      const updatedMeetings = (project.scheduledMeetings || []).map((m) =>
        m.id === itemIdRaw ? { ...m, date: targetKey === NO_DATE_COL ? '' : targetKey } : m
      );
      onUpdateProject({ ...project, scheduledMeetings: updatedMeetings });
    } else if (kind === 'action') {
      const actionIdRaw = itemIdRaw;
      const actionId = Number(actionIdRaw);
      const updatedPlan = project.actionPlan.map((a) =>
        a.id === actionId ? { ...a, deadline: targetKey === NO_DATE_COL ? 'A definir' : targetKey } : a
      );
      onUpdateProject({ ...project, actionPlan: updatedPlan });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Semana"
        subtitle="Arraste reuniões e ações pendentes dos projetos departamentais para organizar sua semana. Chamados de suporte GLPI e trabalho em outros projetos não entram aqui."
        actions={
          <div className="flex items-center gap-1.5 bg-white border border-grey-200 rounded-full px-1.5 py-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-full hover:bg-grey-100 text-grey-600"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-grey-700 font-mono px-1 min-w-32 text-center">
              {formatShortPtBr(weekDays[0])} – {formatShortPtBr(weekDays[4])}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-1.5 rounded-full hover:bg-grey-100 text-grey-600"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[11px] font-bold text-brand-dark hover:underline px-2"
              >
                Hoje
              </button>
            )}
          </div>
        }
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {weekDays.map((day) => (
            <DayColumn
              key={toIsoDate(day)}
              id={toIsoDate(day)}
              label={formatShortPtBr(day)}
              isToday={isSameDate(day, new Date())}
              items={columns.get(toIsoDate(day)) || []}
              onNavigateToProject={onNavigateToProject}
            />
          ))}
          <DayColumn
            id={NO_DATE_COL}
            label="Sem data"
            items={columns.get(NO_DATE_COL) || []}
            onNavigateToProject={onNavigateToProject}
          />
        </div>
      </DndContext>
    </div>
  );
};

interface DayColumnProps {
  id: string;
  label: string;
  isToday?: boolean;
  items: PlanItem[];
  onNavigateToProject: (projectId: string, tab: ProjectTab) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ id, label, isToday, items, onNavigateToProject }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border p-2.5 space-y-2 min-h-44 transition-colors ${
        isOver ? 'border-brand-main bg-brand-lighter/40' : 'border-grey-200 bg-grey-50/60'
      }`}
    >
      <div className="flex items-center justify-between px-0.5">
        <span
          className={`text-[11px] font-bold uppercase tracking-wide ${
            isToday ? 'text-brand-dark' : 'text-grey-500'
          }`}
        >
          {label}
        </span>
        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-brand-main" />}
      </div>

      {items.length === 0 && <p className="text-[11px] text-grey-400 px-0.5">Nada por aqui.</p>}

      {items.map((item) => (
        <PlanCard key={item.id} item={item} onNavigateToProject={onNavigateToProject} />
      ))}
    </div>
  );
};

interface PlanCardProps {
  item: PlanItem;
  onNavigateToProject: (projectId: string, tab: ProjectTab) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ item, onNavigateToProject }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const riskColor = getRiskColorClass(item.riskLevel);

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20, position: 'relative' }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-md border border-grey-200 shadow-xs p-2 cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${riskColor.dot}`} />
        <span className="text-[9px] font-bold uppercase tracking-wide text-grey-400">
          {item.kind === 'meeting' ? 'Reunião' : 'Ação'}
        </span>
      </div>
      <p className="text-[11px] font-semibold text-grey-800 leading-snug line-clamp-2">{item.title}</p>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onNavigateToProject(item.projectId, item.kind === 'meeting' ? 'glpi' : 'action_plan')}
        className="text-[10px] text-brand-dark hover:underline mt-1 truncate block"
      >
        {item.projectName} →
      </button>
    </div>
  );
};
