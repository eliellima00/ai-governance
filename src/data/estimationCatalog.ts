import { GovStage, ProjectType } from '../types';

export interface StageBaseDefinition {
  stageId: GovStage;
  name: string;
  description: string;
  hours: number;
  meetings: number;
  externalDeps: number;
}

export interface ModuleDefinition {
  id: string;
  label: string;
  hours: number;
  stageId: GovStage;
  meetings: number;
  externalDeps: number;
  description?: string;
}

export interface DiscountDefinition {
  id: string;
  label: string;
  hours: number;
  stageId: GovStage;
  description?: string;
}

export const ESTIMATION_CONFIG = {
  horasPorManha: 4,
  fatorOtimista: 0.8, // 3.2 horas ativas/dia
  fatorRealista: 0.6, // 2.4 horas ativas/dia
  leadReuniaoOtimista: 1, // dias de espera/overhead por reunião
  leadReuniaoRealista: 2,
  bufferDepOtimista: 2, // dias de espera por dependência externa
  bufferDepRealista: 4,
};

export const PROJECT_TYPE_INFO: Record<
  ProjectType,
  { label: string; shortDesc: string; technologyHint: string; statusBadge?: string }
> = {
  A: {
    label: 'Google Workspace / Apps Script',
    shortDesc: 'Planilhas Google, formulários, automações Apps Script e portais Google Apps.',
    technologyHint: 'Apps Script, Google Sheets, Google Drive, Google Forms'
  },
  B: {
    label: 'Container / VPS / Backend',
    shortDesc: 'Aplicações web, Docker, Node.js, Python, PostgreSQL/MySQL, AWS/Cloudflare ou VPS.',
    technologyHint: 'Docker, VPS, Node/React, Python, Fastify, Next.js, Banco de dados dedicado'
  },
  C: {
    label: 'No-Code / Plataformas Externas',
    shortDesc: 'Plataformas como Blip, n8n, Zapier, Make, Bubble ou soluções SaaS proprietárias.',
    technologyHint: 'Blip, n8n, Make, Zapier, Bubble, Power Apps',
    statusBadge: 'A calibrar (Base Workspace)'
  }
};

export const GOV_STAGES_CATALOG: GovStage[] = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'Concluído'];

export const STAGE_NAMES: Record<GovStage, string> = {
  E0: 'Cadastro e Triagem',
  E1: 'Diagnóstico (reunião/roteiro)',
  E2: 'Documentação mínima e acessos',
  E3: 'Correção das críticas',
  E4: 'Backup e restore',
  E5: 'Repasse / dependência',
  E6: 'POP / Encerramento',
  Concluído: 'Esteira Concluída'
};

export const STAGE_DESCRIPTIONS: Record<GovStage, string> = {
  E0: 'Entrada da solicitação, conferência de metadados iniciais e enquadramento do tipo técnico.',
  E1: 'Reunião de entendimento técnico com o mantenedor, preenchimento do roteiro e validação de declarações.',
  E2: 'Publicação da ficha técnica, links de repositório, grupos corporativos e inventário de dados.',
  E3: 'Resolução direta de riscos e vulnerabilidades críticas (segredos, permissões, contas pessoais).',
  E4: 'Implementação de rotina de backup de código/dados e execução com evidência de restore testado.',
  E5: 'Treinamento de desenvolvedor secundário, repasse técnico e alinhamento com ponto focal de T.I.',
  E6: 'Elaboração do Procedimento Operacional Padrão (POP), entrega de acessos à T.I e encerramento.',
  Concluído: 'Esteira técnica de governança 100% finalizada e homologada pela T.I.'
};

// Base hours and meeting/external dependency flags per Stage
export const STAGES_BASE_CONFIG: Record<ProjectType, Record<GovStage, { hours: number; meetings: number; externalDeps: number }>> = {
  A: {
    E0: { hours: 0.5, meetings: 0, externalDeps: 0 },
    E1: { hours: 4.5, meetings: 1, externalDeps: 0 },
    E2: { hours: 2.0, meetings: 0, externalDeps: 0 },
    E3: { hours: 2.0, meetings: 0, externalDeps: 1 },
    E4: { hours: 1.5, meetings: 0, externalDeps: 0 },
    E5: { hours: 2.0, meetings: 1, externalDeps: 0 },
    E6: { hours: 3.0, meetings: 1, externalDeps: 0 },
    Concluído: { hours: 0, meetings: 0, externalDeps: 0 }
  },
  B: {
    E0: { hours: 0.5, meetings: 0, externalDeps: 0 },
    E1: { hours: 4.5, meetings: 1, externalDeps: 1 },
    E2: { hours: 2.0, meetings: 0, externalDeps: 0 },
    E3: { hours: 3.0, meetings: 0, externalDeps: 0 },
    E4: { hours: 1.5, meetings: 0, externalDeps: 1 },
    E5: { hours: 5.5, meetings: 1, externalDeps: 1 },
    E6: { hours: 2.0, meetings: 1, externalDeps: 0 },
    Concluído: { hours: 0, meetings: 0, externalDeps: 0 }
  },
  C: {
    // Tipo C replica A como ponto de partida (a calibrar)
    E0: { hours: 0.5, meetings: 0, externalDeps: 0 },
    E1: { hours: 4.5, meetings: 1, externalDeps: 0 },
    E2: { hours: 2.0, meetings: 0, externalDeps: 0 },
    E3: { hours: 2.0, meetings: 0, externalDeps: 1 },
    E4: { hours: 1.5, meetings: 0, externalDeps: 0 },
    E5: { hours: 2.0, meetings: 1, externalDeps: 0 },
    E6: { hours: 3.0, meetings: 1, externalDeps: 0 },
    Concluído: { hours: 0, meetings: 0, externalDeps: 0 }
  }
};

// Módulos adicionais (somam à etapa quando applied === true)
export const MODULES_CATALOG: ModuleDefinition[] = [
  {
    id: 'M1',
    label: 'Ambiente dev do mantenedor (WSL/Ubuntu/Git/VSCode/Claude Code) + avaliação',
    hours: 3.25,
    stageId: 'E5',
    meetings: 1,
    externalDeps: 0,
    description: 'Padronização do ambiente local de desenvolvimento e testes do mantenedor com T.I.'
  },
  {
    id: 'M2',
    label: 'Exploração / decisão de infra (tunnel, subdomínio, arquitetura)',
    hours: 2.0,
    stageId: 'E5',
    meetings: 1,
    externalDeps: 1,
    description: 'Avaliação de DNS, subdomínio institucional, WAF ou tuneis Cloudflare/AWS.'
  },
  {
    id: 'M3',
    label: 'Integração adicional a mapear (RD Station, ERP Senior, API externa)',
    hours: 1.0,
    stageId: 'E1',
    meetings: 0,
    externalDeps: 0,
    description: 'Levantamento de payloads, endpoints e credenciais de integração com terceiros.'
  },
  {
    id: 'M4',
    label: 'Migração de dados volumosa + política de retenção / descarte',
    hours: 1.5,
    stageId: 'E4',
    meetings: 0,
    externalDeps: 0,
    description: 'Saneamento e transferência segura de bases históricas e conformidade de guarda.'
  },
  {
    id: 'M5',
    label: 'Provisionar conta corporativa paga (OpenAI, Codex, Claude, licenças)',
    hours: 0.5,
    stageId: 'E3',
    meetings: 0,
    externalDeps: 1,
    description: 'Abertura de chamado de faturamento corporativo para desvincular cartão pessoal.'
  },
  {
    id: 'M6',
    label: 'Solicitar ambiente a outro time / fornecedor (ECS, EC2, servidor)',
    hours: 1.0,
    stageId: 'E5',
    meetings: 1,
    externalDeps: 1,
    description: 'Alinhamento com equipe de Cloud / Infraestrutura da T.I para provisionamento.'
  }
];

// Descontos "itens já atendidos" (subtraem apenas quando confirmed === true na E1)
export const DISCOUNTS_CATALOG: DiscountDefinition[] = [
  {
    id: 'D1',
    label: 'Código já em repositório corporativo (@grupoatto)',
    hours: 1.5,
    stageId: 'E5',
    description: 'Repositório GitHub oficial configurado com permissões corporativas.'
  },
  {
    id: 'D2',
    label: 'Backup de código e dados com restore testado',
    hours: 1.0,
    stageId: 'E4',
    description: 'Rotina de salvamento testada com evidência de recuperação operacional.'
  },
  {
    id: 'D3',
    label: 'Documentação / localização de ativos já existente',
    hours: 1.0,
    stageId: 'E2',
    description: 'Ficha preliminar de contatos, links e inventário já preenchidos.'
  },
  {
    id: 'D4',
    label: 'Contas e serviços já corporativos (não pessoais)',
    hours: 1.0,
    stageId: 'E3',
    description: 'Nenhum e-mail ou cartão de crédito pessoal associado à solução.'
  }
];

// Reuniões por tipo técnico (checklist operacional)
export const MEETINGS_CHECKLIST: Record<ProjectType, string[]> = {
  A: [
    'Apresentação do sistema com usuário mantenedor',
    'Levantamento técnico detalhado (roteiro de perguntas)',
    'Plano de ação com gestores da área de negócio',
    'Configuração do Git corporativo com o técnico',
    'Elaboração e validação do POP de recuperação',
    '(+ chamado assíncrono à Infra de T.I quando necessário)'
  ],
  B: [
    'Entendimento inicial da arquitetura (roteiro)',
    'Solicitação de infraestrutura (Cloud / Arquitetura T.I)',
    'Decisão de arquitetura e estratégia de deploy',
    'Alinhamento do fluxo de desenvolvimento com o mantenedor',
    'Avaliação e configuração da máquina/ambiente',
    'Plano de ação e repasse técnico aos gestores',
    '(+ ECS por fornecedor, variáveis de ambiente por outro time)'
  ],
  C: [
    'Apresentação do fluxo no-code com o criador',
    'Mapeamento de acessos corporativos e conectores',
    'Plano de contingência e exportação de dados',
    'POP de acionamento de suporte do fornecedor'
  ]
};

// Achados críticos típicos por tipo técnico (checklist a validar na E1)
export const CRITICAL_FINDINGS_CHECKLIST: Record<ProjectType, string[]> = {
  A: [
    'Conta pessoal dona da planilha ou script → migrar propriedade para conta corporativa institucional (@attosementes.com.br)',
    'Base de dados ou pasta com permissão "qualquer um com o link" → restringir para usuários e grupos autenticados',
    'Token ou credencial do ERP Senior exposta no código-fonte → migrar para Script Properties e rotacionar o segredo',
    'Sem rotina de backup independente do histórico → programar rotina automatizada e comprovar restore',
    'PDFs com dados pessoais salvos em Drive pessoal → transferir pasta para repositório corporativo seguro com expurgo'
  ],
  B: [
    'IA ou APIs pagas sob conta pessoal de desenvolvedor → transferir para faturamento corporativo centralizado da T.I',
    'Credenciais e segredos em arquivo .env ou JSON local → migrar para AWS Parameter Store / Vault corporativo',
    'Sem backup automatizado de banco e código → repositório Git corporativo + rotina de backup com restore homologado',
    'Dados pessoais enviados para APIs de IA sem base legal → validar adequação com a política LGPD da ATTO',
    'Deploy manual direto em servidor de produção → estruturar esteira dev/hml/prd com pipelines de CI/CD',
    'Planilhas-fonte auxiliares em conta pessoal → transferir propriedade para o Google Drive corporativo'
  ],
  C: [
    'Fluxo ou conector autenticado em conta pessoal de colaborador → migrar para conta corporativa de serviço',
    'Ausência de rotina de exportação ou backup dos dados mantidos na nuvem do fornecedor terceiro',
    'Tratamento de dados confidenciais ou pessoais sem conformidade contratual com o fornecedor',
    'Inexistência de chave de contingência manual caso o serviço externo fique indisponível'
  ]
};

// Critério de saída da Esteira de Governança (4 itens obrigatórios)
export const EXIT_CRITERIA_CHECKLIST = [
  {
    id: 'crit-1',
    title: '1. Críticas resolvidas',
    description: 'Todas as pendências e vulnerabilidades críticas mapeadas na E1 e E3 foram remediadas.'
  },
  {
    id: 'crit-2',
    title: '2. Backup + restore testado',
    description: 'Rotina de salvamento independente ativa e evidência de teste de restauração validada pela T.I.'
  },
  {
    id: 'crit-3',
    title: '3. Fora da mão de uma só pessoa',
    description: 'Desenvolvedor secundário treinado, ponto focal da T.I nomeado, conta ti.dev@attosementes.com.br com acesso total e T.I habilitada a realizar deploy.'
  },
  {
    id: 'crit-4',
    title: '4. Documentação mínima de localização e contato',
    description: 'Ficha cadastral viva atualizada no GLPI com repositório, contatos, POP de emergência e canais de acionamento.'
  }
];
