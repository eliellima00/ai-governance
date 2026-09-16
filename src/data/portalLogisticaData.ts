import { SolutionProject } from '../types';

export const PORTAL_LOGISTICA_PROJECT: SolutionProject = {
  id: 'portal-logistica-atto',
  name: 'Portal Logística Atto',
  glpiTicketId: 'CH-2026-0842',
  assetId: 'ATIVO-LOG-004',
  department: 'Logística / Adm Comercial',
  businessResponsible: 'DIEGO CAVALCANTE GOMES',
  technicalResponsible: 'ROGER (Apoio: Diego Cavalcante)',
  status: 'Uso',
  stage: 'Plano de Ação / Adequação',
  executivePriority: 'P1 - Alta Prioridade',
  isPriorityForManagement: true,
  notes: 'Sessão de mitigação em andamento. Segredo de API do Senior ERP migrado para Script Properties. Faltando revisar política de expurgo LGPD de 2 safras.',
  notificationStatus: 'Alertas automáticos via Gmail e Webhook de fechamento ativos',
  hasImpediment: false,
  scheduledDate: '22/09/2026 14:00',
  scheduledSubject: 'Apresentação executiva para homologação definitiva do ativo com TI e Logística',
  createdAt: '23/06/2026 14:35',
  lastUpdated: '10/07/2026 16:45',
  registeredBy: 'MARCO ANTONIO BOZELLI GONZALEZ MORAES',
  groupEncargado: 'TI - Sistemas Corporativos & Governança',
  userGroup: 'Dir. Comercial > Adm. Comercial',
  objective: `A solução é uma evolução da ferramenta do google sheets desenvolvida em 2023 destinada a interface entre nós e os transportadores, que já tinha por objetivo facilitar o acesso as nossas demandas de fretes por parte dos transportadores, bem como de facilitar a operação de negociação e fechamento de frete.

As atividades que a atual ferramenta executa basicamente são:
• Visualização das cargas disponíveis para cotação.
• Gerenciamento de fluxo de cargas.
• Mecanismo de contra proposta de cotações.
• Acompanhamento Carga a Carga do Fluxo de embarque e descarga.
• Start automático de e-mail de fechamento.
• Start automático de e-mail de envio de autorização de embarque.
• Disparo de e-mail à transportadora funcionando como contrato/aceite.
• Geração automática de PDFs de autorização e comprovante de carga.`,
  initialDoc: `Solução em Apps Script vinculada a Google Sheets e Google Drive. Possui integração via API com o ERP Senior (Sapiens) para módulo de embarque e montagem de cargas, alimentada também por planilha de CTVs e expedição. Utilizada por Diego, Andreia, Simone, Roger, Marcio e +20 transportadores externos cadastrados.`,
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://glpi.attosementes.com.br/front/computer.form.php?id=ATIVO-LOG-004',
  links: {
    spreadsheet: 'https://docs.google.com/spreadsheets/d/1Spox1kD3yl7VqMC36y9ME6hwYYRG5Hg6Ph3bJ-_HygU/edit?gid=0#gid=0',
    script: 'https://script.google.com/u/0/home/projects/1qQOacO5PM40Egb226AcPpq-0zVADsSIoijOF9-6V8PcM8Mi9fXQ-nTUi/edit',
    internalPanel: 'https://script.google.com/a/macros/attosementes.com.br/s/AKfycbxoi5FCvxHxaEXlxBwWRpq_rZN5ZMXKVlODiI2qfGN3j1yoRj2OBm4hlG_hMonk8v2c/exec?page=interno',
    externalPortal: 'https://script.google.com/a/macros/attosementes.com.br/s/AKfycbxoi5FCvxHxaEXlxBwWRpq_rZN5ZMXKVlODiI2qfGN3j1yoRj2OBm4hlG_hMonk8v2c/exec',
    githubRepo: 'https://github.com/grupoatto/portal-logistica'
  },
  initialScore: 34,
  initialRisk: 'CRITICO',
  dimensionsInitial: {
    seguranca: 17,
    lgpd: 5,
    operacional: 12
  },
  criteria: [
    {
      id: 'crit-1',
      criterion: 'Utiliza dados pessoais (LGPD)',
      evidence: 'Sim (CNH de motoristas, placas de veículos, dados de identificação em PDFs)',
      points: 5,
      dimension: 'LGPD',
      mitigatedByActionIds: [11, 12, 13]
    },
    {
      id: 'crit-2',
      criterion: 'Utiliza dados confidenciais',
      evidence: 'Sim (Valores de fretes de cargas, margens, volume negociado, rotas comerciais)',
      points: 5,
      dimension: 'Segurança',
      mitigatedByActionIds: [2, 3, 11]
    },
    {
      id: 'crit-3',
      criterion: 'Integra com sistemas corporativos',
      evidence: 'Sim (ERP Senior Sapiens - Módulo de Embarque e planilhas operacionais CTV)',
      points: 4,
      dimension: 'Operacional',
      mitigatedByActionIds: [1, 9, 10]
    },
    {
      id: 'crit-4',
      criterion: 'Altera dados em sistemas',
      evidence: 'Não informado / Leitura e disparo de fechamentos',
      points: 0,
      dimension: 'Operacional'
    },
    {
      id: 'crit-5',
      criterion: 'Utiliza armazenamento próprio (Google Sheets)',
      evidence: 'Sim (Planilha Google Sheets com +25 abas operacionais)',
      points: 3,
      dimension: 'Segurança',
      mitigatedByActionIds: [2, 4, 5, 6]
    },
    {
      id: 'crit-6',
      criterion: 'Utiliza conta/plataforma externa (Apps Script / Drive pessoal)',
      evidence: 'Sim (Google Apps Script e Drive de conta pessoal Roger inicialmente)',
      points: 3,
      dimension: 'Segurança',
      mitigatedByActionIds: [6, 7, 10]
    },
    {
      id: 'crit-7',
      criterion: 'Documentação inexistente no início',
      evidence: 'Não existia documentação formal nem mapa de rotinas (~30k linhas de script)',
      points: 2,
      dimension: 'Operacional',
      mitigatedByActionIds: [7, 8, 9, 10]
    },
    {
      id: 'crit-8',
      criterion: 'Backup dos dados',
      evidence: 'Sim (Nativo Drive, aprimorado para script automatizado)',
      points: 0,
      dimension: 'Operacional',
      mitigatedByActionIds: [4, 5]
    },
    {
      id: 'crit-9',
      criterion: 'Backup do código',
      evidence: 'Sim (Nativo Apps Script + repositório Git criado no GitHub)',
      points: 0,
      dimension: 'Operacional',
      mitigatedByActionIds: [10]
    },
    {
      id: 'crit-10',
      criterion: 'Mais de 20 usuários ativos',
      evidence: 'Sim (Equipe ATTO Adm Comercial + mais de 20 transportadoras parceiras)',
      points: 3,
      dimension: 'Operacional',
      mitigatedByActionIds: [3, 15]
    },
    {
      id: 'crit-11',
      criterion: 'Impacto alto/crítico em caso de indisponibilidade',
      evidence: 'Crítico (Paralisação de negociações, fechamento de fretes e expedição)',
      points: 5,
      dimension: 'Operacional',
      mitigatedByActionIds: [5, 8, 9, 10]
    },
    {
      id: 'crit-12',
      criterion: 'Processo continua manualmente se parar',
      evidence: 'Sim (Fallback por e-mail e planilhas antigas manuais)',
      points: 0,
      dimension: 'Operacional'
    },
    {
      id: 'crit-13',
      criterion: 'Processo financeiro/fiscal/regulatório direto',
      evidence: 'Não diretamente (subsidiário à contratação de frete)',
      points: 0,
      dimension: 'Operacional'
    },
    {
      id: 'crit-14',
      criterion: 'Utilizado por terceiros externos à organização',
      evidence: 'Sim (Transportadores acessam link web sem login robusto)',
      points: 4,
      dimension: 'Segurança',
      mitigatedByActionIds: [2, 3, 6, 15]
    },
    {
      id: 'crit-15',
      criterion: 'Uso de IA externa sem governança',
      evidence: 'Não em produção / Apoio de IA via Codex para desenvolvimento',
      points: 0,
      dimension: 'Segurança',
      mitigatedByActionIds: [16]
    }
  ],
  actionPlan: [
    {
      id: 1,
      title: 'Remover o bearer token do código (Script Properties) e rotacionar o token do ERP',
      responsible: 'TI',
      deadline: 'A definir (Prioritário)',
      priority: 'Crítica',
      status: 'Aguardando',
      riskPointsImpact: 4,
      dimension: 'Segurança',
      notes: 'O token de integração com o Senior Sapiens estava fixo no code.gs. Deve ser migrado para PropertiesService seguro da conta corporativa.'
    },
    {
      id: 2,
      title: "Restringir compartilhamento da planilha base (encerrar 'qualquer pessoa com o link')",
      responsible: 'Roger + TI',
      deadline: 'Avaliar / Imediato',
      priority: 'Crítica',
      status: 'Aguardando',
      riskPointsImpact: 3,
      dimension: 'Segurança',
      notes: 'Limitar acesso à planilha central apenas para os e-mails corporativos do Adm Comercial e conta de serviço.'
    },
    {
      id: 3,
      title: 'Implementar login/controle de acesso e perfis (painel interno e visão transportador)',
      responsible: 'Roger + TI',
      deadline: 'Avaliar',
      priority: 'Crítica',
      status: 'Aguardando',
      riskPointsImpact: 3,
      dimension: 'Segurança',
      notes: 'Criar barreira de autenticação para o painel interno e tokens dinâmicos por transportadora.'
    },
    {
      id: 4,
      title: 'Backup automático das planilhas via Apps Script, armazenado no Drive corporativo',
      responsible: 'Roger',
      deadline: '13/07/2026',
      priority: 'Crítica',
      status: 'Concluído',
      completionDate: '13/07/2026',
      riskPointsImpact: 2,
      dimension: 'Operacional',
      evidence: 'Rotina de snapshot diário com retenção de 30 dias gerada em pasta segura do Google Drive.',
      notes: 'Implementado com sucesso.'
    },
    {
      id: 5,
      title: 'Validar restore / estratégia de recuperação independente do histórico do Drive',
      responsible: 'Roger + TI',
      deadline: '10/07/2026',
      priority: 'Alta',
      status: 'Concluído',
      completionDate: '10/07/2026',
      riskPointsImpact: 2,
      dimension: 'Operacional',
      evidence: 'Testes de resiliência e restauração de dados realizados com sucesso na reunião técnica.',
      notes: 'Testado procedimento de restore em planilha duplicada.'
    },
    {
      id: 6,
      title: 'Migrar a solução p/ conta corporativa mantendo o acesso externo (transportadoras)',
      responsible: 'TI + Roger',
      deadline: '29/07/2026',
      priority: 'Alta',
      status: 'Em andamento',
      riskPointsImpact: 2,
      dimension: 'Segurança',
      notes: 'Transferir a propriedade do projeto Apps Script e pastas de Drive para a conta ti.dev / grupoatto corporativa.'
    },
    {
      id: 7,
      title: 'Compartilhar o projeto (script) com ti.dev e validar (planilha já enviada)',
      responsible: 'Roger + TI',
      deadline: '29/07/2026',
      priority: 'Alta',
      status: 'Concluído',
      completionDate: '29/07/2026',
      riskPointsImpact: 1,
      dimension: 'Governança',
      evidence: 'Acesso total concedido à equipe de TI para auditoria e governança.',
      notes: 'Concluído.'
    },
    {
      id: 8,
      title: 'Definir responsável oficial de sustentação (principal + secundário + TI)',
      responsible: 'Gestão TI + Logística',
      deadline: '10/07/2026',
      priority: 'Alta',
      status: 'Concluído',
      completionDate: '10/07/2026',
      riskPointsImpact: 2,
      dimension: 'Operacional',
      evidence: 'Matriz RACI formalizada: Roger (Mantenedor 1), Diego Cavalcante (Negócio), TI Dev (Sustentação N3/Contingência).',
      notes: 'Elimina risco de ponto único de falha desassistido.'
    },
    {
      id: 9,
      title: 'Implantar fluxo de homologação (cópia → validar → produção)',
      responsible: 'Roger + TI',
      deadline: '10/07/2026',
      priority: 'Alta',
      status: 'Concluído',
      completionDate: '10/07/2026',
      riskPointsImpact: 2,
      dimension: 'Operacional',
      evidence: 'Ambiente de Staging/Homologação configurado para validação antes de publicar em produção.',
      notes: 'Evita que alterações quebrem a operação ao vivo.'
    },
    {
      id: 10,
      title: 'Publicar código no GitHub (grupoatto/portal-logistica) e definir política de branches/PR/merge',
      responsible: 'TI + Roger',
      deadline: 'A definir',
      priority: 'Crítica',
      status: 'Aguardando',
      riskPointsImpact: 3,
      dimension: 'Governança',
      notes: 'TI faz merge; Roger cria PRs via Codex. Repositório criado, aguardando automação de deploy contínuo.'
    },
    {
      id: 11,
      title: 'Mover PDFs com dados pessoais (doc. motorista/veículo) p/ repositório corporativo',
      responsible: 'Roger',
      deadline: '29/07/2026',
      priority: 'Alta',
      status: 'Em andamento',
      riskPointsImpact: 2,
      dimension: 'LGPD',
      notes: 'Armazenar os arquivos gerados em Shared Drive corporativo com regras restritas de acesso.'
    },
    {
      id: 12,
      title: 'Implementar política de retenção/descarte dos dados por ciclo',
      responsible: 'TI + Logística',
      deadline: 'Definir',
      priority: 'Alta',
      status: 'Aguardando',
      riskPointsImpact: 2,
      dimension: 'LGPD',
      notes: 'Definir rotina de expurgo anual para cotações antigas e documentos de motoristas que não são mais necessários.'
    },
    {
      id: 13,
      title: 'Avaliar aderência à LGPD (base legal do aceite por e-mail, categorias, retenção)',
      responsible: 'TI / Compliance',
      deadline: 'Avaliar',
      priority: 'Alta',
      status: 'Aguardando',
      riskPointsImpact: 2,
      dimension: 'LGPD',
      notes: 'Parecer do DPO/Compliance sobre o aceite contratual gerado automaticamente por e-mail.'
    },
    {
      id: 14,
      title: 'Melhorar logs de auditoria (além de data de criação/modificação)',
      responsible: 'Roger',
      deadline: 'Definir',
      priority: 'Média',
      status: 'Aguardando',
      riskPointsImpact: 1,
      dimension: 'Segurança',
      notes: 'Reativar e normalizar a aba LOG_EVENTOS com IP, usuário, timestamp e ação realizada.'
    },
    {
      id: 15,
      title: 'Registrar domínio corporativo / padronizar URL amigável',
      responsible: 'Roger + Eliel',
      deadline: 'A definir',
      priority: 'Média',
      status: 'Aguardando',
      riskPointsImpact: 1,
      dimension: 'Governança',
      notes: 'Configurar URL amigável interna (ex: logistica.attosementes.com.br).'
    },
    {
      id: 16,
      title: 'Avaliar conta corporativa paga para o GPT/Codex',
      responsible: 'TI',
      deadline: '09/10/2026',
      priority: 'Média',
      status: 'Concluído',
      completionDate: '09/10/2026',
      riskPointsImpact: 1,
      dimension: 'Governança',
      evidence: 'Licença corporativa de IA ativada com conformidade e zero retenção para treinamento de modelos.',
      notes: 'Concluído com conta corporativa da ATTO.'
    },
    {
      id: 17,
      title: 'Ajustar ícone e título da aba do navegador',
      responsible: 'Roger + Eliel',
      deadline: '30/10/2026',
      priority: 'Baixa',
      status: 'Aguardando',
      riskPointsImpact: 0.5,
      dimension: 'Governança',
      notes: 'Favicon oficial da ATTO e title sem URLs cruas do Google Apps Script.'
    }
  ],
  sheetsCatalog: [
    { name: 'CARGAS', category: 'Operacional', purpose: 'Base operacional central das cargas. Consolida programação, volumes, frete-alvo, publicação, status, transportadora vencedora, PDF e acompanhamento operacional.', sensitivity: 'Alta', linesEstimated: '~4.500 linhas' },
    { name: 'COTACOES_ATIVAS', category: 'Operacional', purpose: 'Mantém a cotação vigente de cada transportadora por carga, usada no portal, na contraproposta e na análise interna; é limpa no fechamento e restaurada na reabertura.', sensitivity: 'Alta', linesEstimated: '~8.000 linhas' },
    { name: 'BASE_EXPEDICAO_NORMALIZADA', category: 'Origem / Normalização', purpose: 'Base padronizada das cargas montadas pelos CTVs, por pedido, item e entrega. Alimenta a criação das cargas e as validações de montagem.', sensitivity: 'Média', linesEstimated: '~12.000 linhas' },
    { name: 'BASE_FORMULA_NORMALIZADA', category: 'Origem / Normalização', purpose: 'Base padronizada das cargas Fórmula, com fornecedor, rota, produto, volumes, bags e datas. Alimenta cargas, agrupamentos, autorizações e PDFs.', sensitivity: 'Média', linesEstimated: '~6.000 linhas' },
    { name: 'BASE_FORMULA', category: 'Origem / Normalização', purpose: 'Origem bruta das cargas Fórmula, recebida por IMPORTRANGE da planilha de planejamento antes da normalização.', sensitivity: 'Média', linesEstimated: '~6.000 linhas' },
    { name: 'CONTROLE_MONTAGEM_SISTEMA', category: 'Integrações / ERP', purpose: 'Registra o status da montagem das cargas no Sapiens, incluindo bloqueios, observações, responsáveis e datas de atualização.', sensitivity: 'Média', linesEstimated: '~3.200 linhas' },
    { name: 'TABELA_FRETE_ALVO_TOLERADO', category: 'Operacional', purpose: 'Tabela de referência por cidade, estado e classificação do produto, com os valores de frete-alvo e frete tolerado por tonelada.', sensitivity: 'Alta', linesEstimated: '~1.500 linhas' },
    { name: 'PDF_CARGAS_ATTO', category: 'Operacional', purpose: 'Controle dos PDFs de carga gerados no Drive, com arquivo, link, status, tamanho, datas e assinatura dos dados para identificar necessidade de atualização.', sensitivity: 'Alta', linesEstimated: '~2.800 linhas' },
    { name: 'CADASTRO_PRODUTOS', category: 'Operacional', purpose: 'Relaciona cultivar/produto à sua classificação logística, usada para definir o tipo de frete e localizar os valores alvo e tolerado.', sensitivity: 'Baixa', linesEstimated: '~300 linhas' },
    { name: 'TRANSPORTADORAS', category: 'Operacional', purpose: 'Cadastro das transportadoras, com identificadores, código Rondoline, contatos, e-mails de acesso e fechamento, situação e último login.', sensitivity: 'Alta', linesEstimated: '~120 registros' },
    { name: 'PARAMETROS', category: 'Operacional', purpose: 'Tabela auxiliar de tipos, valores, embalagens e pesos. Sem consumo direto desta aba no código atual.', sensitivity: 'Baixa', linesEstimated: '~50 linhas' },
    { name: 'BASE-CARGAS MONTADA SAPIENS', category: 'Integrações / ERP', purpose: 'Base das cargas já montadas no Sapiens, com pedidos, produtos, clientes, transportadora e valores. Usada para conferir vínculos e montagem.', sensitivity: 'Alta', linesEstimated: '~5.000 linhas' },
    { name: 'BASE-PEDIDOS INDICADORES', category: 'Integrações / ERP', purpose: 'Indicadores dos pedidos no Sapiens (financeiro, reserva, preparação, pendência administrativa e liberação), usados nas regras de bloqueio.', sensitivity: 'Alta', linesEstimated: '~9.000 linhas' },
    { name: 'BASE-PEDIDOS CANCELADOS SAPIENS', category: 'Integrações / ERP', purpose: 'Relação de pedidos cancelados no Sapiens, usada para impedir ou sinalizar a montagem de cargas com pedidos cancelados.', sensitivity: 'Média', linesEstimated: '~800 linhas' },
    { name: 'Base_Fila', category: 'Operacional', purpose: 'Base detalhada dos eventos de fila e carregamento. Funciona também como fonte alternativa para atualizar chegada, carregamento e saída dos veículos.', sensitivity: 'Média', linesEstimated: '~3.000 linhas' },
    { name: 'fila_descarga', category: 'Operacional', purpose: 'Base de movimentação da fila de descarga, por placa, com datas de chegada e saída. É a fonte preferencial para atualizar chegada e conclusão da descarga.', sensitivity: 'Média', linesEstimated: '~2.100 linhas' },
    { name: 'TRANSFERENCIAS_CARGAS', category: 'Transferências', purpose: 'Cadastro principal das transferências contratadas, com transportadora, origem, fornecedor, volumes programados e carregados, saldos, status e finalização.', sensitivity: 'Alta', linesEstimated: '~1.100 linhas' },
    { name: 'TRANSFERENCIAS_VEICULOS', category: 'Transferências', purpose: 'Controle de cada veículo/subcarga: placas, motorista, documentos, autorização, Rondoline, notas fiscais, carregamento, saída, chegada, fila e descarga.', sensitivity: 'Alta', linesEstimated: '~3.400 linhas' },
    { name: 'TRANSFERENCIAS_DOCUMENTOS', category: 'Transferências', purpose: 'Repositório e histórico dos documentos enviados por veículo, com link do Drive, tipo, versão, situação, rejeição e substituição.', sensitivity: 'Alta', linesEstimated: '~4.000 linhas' },
    { name: 'TRANSFERENCIAS_POSICOES', category: 'Transferências', purpose: 'Histórico das atualizações de posição de cada veículo, registrando período, localização, status, observação, remetente e data/hora.', sensitivity: 'Média', linesEstimated: '~15.000 linhas' },
    { name: 'TRANSFERENCIAS_SOLICITACOES_EXCLUSAO', category: 'Transferências', purpose: 'Registra solicitações da transportadora para excluir veículos, com motivo, situação, solicitante, análise interna e trilha de auditoria.', sensitivity: 'Média', linesEstimated: '~200 linhas' },
    { name: 'FORMULA_AUTORIZACOES', category: 'Fórmula', purpose: 'Cabeçalho das autorizações de embarque das cargas Fórmula por veículo e fornecedor, com volumes, bags, PDF, envio de e-mail, status e cancelamento.', sensitivity: 'Alta', linesEstimated: '~1.800 linhas' },
    { name: 'FORMULA_AUTORIZACAO_ITENS', category: 'Fórmula', purpose: 'Detalhamento dos itens de cada autorização Fórmula, vinculando cargas de origem, pedidos, cultivares, volumes autorizados, notas lançadas e saldos.', sensitivity: 'Alta', linesEstimated: '~3.500 linhas' },
    { name: 'FORMULA_AGRUPAMENTOS', category: 'Fórmula', purpose: 'Cadastro dos agrupamentos de cargas Fórmula, com carga agrupada, cargas de origem, totais, fornecedores, locais, destino e situação.', sensitivity: 'Média', linesEstimated: '~900 linhas' },
    { name: 'FORMULA_AGRUPAMENTO_ITENS', category: 'Fórmula', purpose: 'Composição detalhada dos agrupamentos Fórmula, ligando cada carga original ao grupo e mantendo fornecedor, rota, produto, volume, bags e valor.', sensitivity: 'Média', linesEstimated: '~2.200 linhas' },
    { name: 'FORMULA_NF_BAIXAS', category: 'Fórmula', purpose: 'Registra as notas fiscais lançadas por autorização, veículo e carga de origem, usadas para baixar volumes e bags autorizados e calcular saldos.', sensitivity: 'Alta', linesEstimated: '~4.000 linhas' },
    { name: 'COTACOES', category: 'Histórico / Logs', purpose: 'Histórico completo das cotações recebidas, incluindo propostas, contrapropostas, status, observações, origem e identificação da cotação mais recente.', sensitivity: 'Alta', linesEstimated: '~25.000 linhas' },
    { name: 'ENVIOS', category: 'Histórico / Logs', purpose: 'Registro dos e-mails e alertas enviados pelo sistema, com carga, transportadora, destinatários, tipo de envio, situação e data/hora.', sensitivity: 'Média', linesEstimated: '~18.000 linhas' },
    { name: 'LOG_ACIONADORES_LOGISTICA', category: 'Histórico / Logs', purpose: 'Log das rotinas automáticas e manuais da logística, com início, fim, duração, resultado, mensagem, detalhes, usuário e origem da execução.', sensitivity: 'Média', linesEstimated: '~30.000 linhas' },
    { name: 'Instruções Rondoline', category: 'Operacional', purpose: 'Modelo temporário preenchido pelo sistema e exportado em XLSX para solicitar o cadastro da instrução de embarque no Rondoline.', sensitivity: 'Média', linesEstimated: '~400 linhas' },
    { name: 'LOG_EVENTOS (oculta)', category: 'Histórico / Logs', purpose: 'Aba oculta de auditoria dos eventos do portal, como cotação, aceite, contraproposta e redirecionamento de e-mail. Inativada no momento.', sensitivity: 'Alta', linesEstimated: '~5.000 linhas' }
  ],
  technicalDoc: {
    version: '2.4.0-governance',
    classification: 'Solução Corporativa (Crítica - em adequação)',
    frontend: 'Apps Script Web App com HTML/JS (interno.html para visão ATTO e portal cotações externo segmentado por transportadora_id)',
    backend: 'Google Apps Script (~30.000 linhas de código estruturadas em code.gs, módulos de cotação, PDF engine e integração ERP)',
    database: 'Google Sheets (31 abas operacionais interconectadas via fórmulas dinâmicas e scripts)',
    integrations: 'ERP Senior (Sapiens) via API Módulo Embarque (Migrando de Bearer fixo para Script Properties criptografadas)',
    pdfGeneration: 'Rotina em lote (20 PDFs por ciclo de 20 min) armazenando em Google Drive com hash de alteração',
    emailDispatch: 'Disparos automatizados de fechamento e autorização (Migrado para envio autenticado corporativo)',
    hosting: 'Google Workspace Corporativo Grupo ATTO (migrado da conta pessoal do desenvolvedor)',
    environments: 'Desenvolvimento (Codex/Git) → Homologação (Staging Sheet/Script) → Produção (Apps Script Web App)',
    domain: 'script.google.com (Em processo de mapeamento para proxy/domínio interno ATTO)',
    aiAssistance: 'Codex / GPT com conta corporativa empresarial (zero retenção de dados e conformidade corporativa)',
    backupData: 'Snapshot diário automatizado via Apps Script + histórico nativo de versões do Google Drive',
    backupCode: 'Repositório GitHub corporativo (grupoatto/portal-logistica) com controle de branches e PRs',
    incidentHandling: 'Triagem via chamado GLPI + sustentação primária Roger com escalonamento para TI Dev',
    featureRollout: 'Fluxo padronizado: Branch de Feature → Validação em Homologação com dados mockados → PR revisado pela TI → Deploy',
    versionControl: 'Git + GitHub com Semantic Versioning',
    contingency: 'Procedimento documentado de fallback manual em planilhas modelo e e-mails estruturados',
    maturity: 'Solução madura em produção com processo de governança e sustentação em implementação ativa',
    personalDataSummary: 'Trata CNH de motoristas e placas em comprovantes PDF gerados no embarque',
    pdfStorageSummary: 'Migração para Google Shared Drive restrito da Logística ATTO com permissões granulares',
    legalBasis: 'Execução de contrato / legítimo interesse com ciência formal no aceite eletrônico',
    confidentialDataSummary: 'Valores de frete alvo, tabelas de negociação, clientes de destino e margens',
    retentionPolicy: 'Regra de expurgo automatizado para histórico de cotações e documentos com mais de 2 safras/ciclos',
    logsSummary: 'Log centralizado na aba LOG_ACIONADORES_LOGISTICA e reativação da trilha de auditoria LOG_EVENTOS',
    accessControlSummary: 'Segmentação por ID de transportador + restrição de planilha para usuários autenticados @attosementes.com.br',
    accountsSummary: 'Contas institucionais de serviço e e-mails corporativos dos operadores',
    credentialsSummary: 'PropertiesService para chaves de API e tokens rotativos do Senior Sapiens'
  },
  artifacts: [
    {
      id: 'art-001',
      title: 'Ata de Alinhamento Técnico de Homologação GLPI',
      category: 'Pauta / Ata de Reunião',
      fileType: 'pdf',
      url: 'https://docs.google.com/document/d/1Spox1kD3yl7VqMC36y9ME6hwYYRG5Hg6Ph3bJ-_HygU/edit',
      fileName: 'Ata_Alinhamento_Tecnico_Portal_Logistica_2026.pdf',
      fileSize: '420 KB',
      version: 'v1.2',
      author: 'Roger & Diego Cavalcante',
      createdAt: '12/07/2026',
      description: 'Definição do escopo da esteira de T.I, migração de credenciais para Script Properties e validação dos 31 sheets operacionais.'
    },
    {
      id: 'art-002',
      title: 'Especificação de Arquitetura & Integração Senior Sapiens',
      category: 'Arquitetura & Segurança',
      fileType: 'drive',
      url: 'https://drive.google.com/drive/folders/1Spox1kD3yl7VqMC36y9ME6hwYYRG5Hg6Ph3bJ-_HygU',
      fileName: 'Arquitetura_Integracao_Sapiens_PortalLogistica.docx',
      fileSize: '1.8 MB',
      version: 'v2.4',
      author: 'TI - Sistemas Corporativos',
      createdAt: '28/06/2026',
      description: 'Mapeamento de rotas de integração do ERP Senior, política de retenção LGPD e armazenamento seguro de comprovantes PDF no Shared Drive.'
    }
  ],
  meetingLogs: [
    {
      id: 'meet-001',
      date: '2026-07-12',
      subject: 'Alinhamento da Esteira de T.I e Mitigação de Riscos de Integração',
      entryType: 'Ponto de Controle T.I',
      participants: 'Diego Cavalcante (Logística), Roger (Dev), Marco Antonio (TI Governança)',
      summary: 'Revisão das credenciais do ERP Senior. Decidido retirar o token hardcoded do Apps Script e mover integralmente para PropertiesService corporativo. Validado o plano de ação de 11 tarefas.',
      nextSteps: 'Roger: finalizar migração de credenciais e configurar expurgo de cotações com mais de 2 safras. Marco: validar permissões no Shared Drive.',
      registeredBy: 'Marco Antonio Bozelli',
      hoursSpent: 1.5,
      linkedArtifactId: 'art-001',
      linkedArtifactTitle: 'Ata de Alinhamento Técnico de Homologação GLPI',
      createdAt: '12/07/2026 15:30'
    },
    {
      id: 'meet-002',
      date: '2026-06-25',
      subject: 'Kickoff de Governança e Cadastro do Ativo no GLPI',
      entryType: 'Reunião de Alinhamento',
      participants: 'Diego Cavalcante, Equipe de Adm Comercial, TI Governança',
      summary: 'Apresentação dos critérios de risco e necessidade de registro do ativo GLPI (ATIVO-LOG-004). Alinhado que o portal permanecerá no Workspace com suporte dedicado de TI.',
      nextSteps: 'Criar repositório institucional no GitHub e espelhar versão estável do Apps Script.',
      registeredBy: 'Marco Antonio Bozelli',
      hoursSpent: 2.0,
      createdAt: '25/06/2026 10:00'
    }
  ]
};

export const BOT_WHATSAPP_PROJECT: SolutionProject = {
  id: 'bot-whatsapp-logistica-notificacoes',
  name: 'Bot WhatsApp - Notificações de Carga & Atendimento',
  glpiTicketId: 'CH-2026-1450',
  assetId: 'ATIVO-COM-032',
  department: 'Logística / Comercial',
  businessResponsible: 'DIEGO CAVALCANTE GOMES',
  technicalResponsible: 'ROGER (Apoio: TI Dev)',
  status: 'Homologação',
  stage: 'Homologação TI',
  executivePriority: 'P1 - Alta Prioridade',
  isPriorityForManagement: true,
  notes: 'Disparo automatizado de mensagens WhatsApp para motoristas com link de confirmação, placa, local de carregamento e QR Code. Permite aceite formal de frete pelo motorista em trânsito.',
  notificationStatus: 'Bot WhatsApp ativo (Webhook em tempo real) com confirmação de entrega e leitura',
  hasImpediment: true,
  impedimentDetails: 'Aguardando validação jurídica do termo de aceite de frete via mensagem e liberação de verba mensal de disparos pela diretoria.',
  actionRequiredFromManagement: 'Aprovar aditivo contratual com provedor oficial do WhatsApp (Z-API/Meta) e cobrar parecer final do Jurídico.',
  scheduledDate: '18/09/2026 10:30',
  scheduledSubject: 'Reunião com Diretor Comercial e Jurídico para destravar aceite eletrônico WhatsApp',
  createdAt: '28/07/2026 14:00',
  lastUpdated: '14/08/2026 17:00',
  registeredBy: 'MARCO ANTONIO BOZELLI GONZALEZ MORAES',
  groupEncargado: 'TI - Sistemas Corporativos & Governança',
  userGroup: 'Dir. Comercial > Logística Operacional',
  objective: 'Automatizar o fluxo de notificação para motoristas de frete de sementes, enviando localização do armazém, dados da carga, horários de janela e coletando aceite legal e CNH.',
  initialDoc: 'Fluxo em Node.js com Webhook conectado à planilha base do Portal Logística e ao ERP Senior.',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://glpi.attosementes.com.br/front/computer.form.php?id=ATIVO-COM-032',
  links: {
    githubRepo: 'https://github.com/grupoatto/bot-whatsapp-logistica'
  },
  initialScore: 26,
  initialRisk: 'CRITICO',
  dimensionsInitial: { seguranca: 12, lgpd: 8, operacional: 6 },
  criteria: [
    { id: 'bw1', criterion: 'Uso de dados pessoais de motoristas (LGPD)', evidence: 'Número de WhatsApp, Nome, CPF e CNH em tráfego de mensageria', points: 5, dimension: 'LGPD' },
    { id: 'bw2', criterion: 'Uso de API externa de terceiros (Meta/Z-API)', evidence: 'Chaves de API conectadas a broker de mensageria externo', points: 4, dimension: 'Segurança' },
    { id: 'bw3', criterion: 'Aceite de contratos via canal informal', evidence: 'Necessário respaldo jurídico para aceite de fretes de alto valor', points: 4, dimension: 'Operacional' }
  ],
  actionPlan: [
    { id: 301, title: 'Validar minuta jurídica de aceite eletrônico no WhatsApp', responsible: 'Jurídico + Diego', deadline: '20/08/2026', priority: 'Crítica', status: 'Em andamento', riskPointsImpact: 4, dimension: 'LGPD' },
    { id: 302, title: 'Configurar retenção de 90 dias para logs de conversa', responsible: 'TI Dev', deadline: '25/08/2026', priority: 'Alta', status: 'Concluído', completionDate: '10/08/2026', riskPointsImpact: 3, dimension: 'Segurança' },
    { id: 303, title: 'Implantar autenticação 2FA no painel de gestão do Bot', responsible: 'TI Segurança', deadline: '15/08/2026', priority: 'Alta', status: 'Concluído', completionDate: '08/08/2026', riskPointsImpact: 3, dimension: 'Segurança' }
  ],
  sheetsCatalog: [],
  technicalDoc: {
    version: '1.0.0-rc',
    classification: 'Solução de Comunicação & Mobilidade',
    frontend: 'Interface do WhatsApp + Painel Administrativo Web',
    backend: 'Node.js / Express Webhooks e Cloud Run',
    database: 'Google Sheets (Base Portal Logística) e Cloud Firestore para sessões',
    integrations: 'API Meta WhatsApp Cloud, ERP Senior Sapiens e Portal Logística',
    pdfGeneration: 'Envio de comprovante PDF de agendamento via link seguro com expiração',
    emailDispatch: 'Notificação para equipe de tráfego em caso de recusa de carga',
    hosting: 'Google Cloud Platform (Cloud Run)',
    environments: 'Homologação e Produção',
    domain: 'whatsapp.attosementes.com.br',
    aiAssistance: 'LLM para classificação de respostas de motoristas',
    backupData: 'Replicação nativa GCP',
    backupCode: 'GitHub grupoatto/bot-whatsapp-logistica',
    incidentHandling: 'Fila GLPI Suporte Logística',
    featureRollout: 'Canary rollout com 3 transportadoras parceiras',
    versionControl: 'Git Flow',
    contingency: 'Atendimento manual via telefone e e-mail',
    maturity: 'Em fase de homologação controlada',
    personalDataSummary: 'Trata telefone celular, nome, placa e CNH',
    pdfStorageSummary: 'Bucket seguro com URLs pré-assinadas de 1 hora',
    legalBasis: 'Execução de contrato de transporte e legítimo interesse',
    confidentialDataSummary: 'Cotações de frete e rotas de embarque',
    retentionPolicy: '90 dias para histórico de mensagens e 5 anos para aceites formais',
    logsSummary: 'Log estruturado no Cloud Logging',
    accessControlSummary: 'Acesso restrito à equipe de tráfego e expedição',
    accountsSummary: 'Conta de serviço WABA verificada pela Meta',
    credentialsSummary: 'Secret Manager GCP'
  }
};

export const OTHER_SAMPLE_PROJECTS: SolutionProject[] = [
  BOT_WHATSAPP_PROJECT
];

