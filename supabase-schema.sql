-- ==============================================================================
-- SCHEMA RELACIONAL POSTGRESQL PARA O SUPABASE
-- Sistema de Governança de Soluções e Ativos GLPI - ATTO Sementes
--
-- USO: referência para provisionar um projeto Supabase NOVO do zero (rode este
-- arquivo uma única vez). Para alterações num banco que já existe, NÃO edite
-- este arquivo — crie uma migration em prisma/migrations/ (veja README.md) e
-- rode `npx prisma migrate dev` (dev) ou `npx prisma migrate deploy` (produção).
-- ==============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela Principal: Projetos e Soluções (Ativos GLPI)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    glpi_ticket_id VARCHAR(50),
    asset_id VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    business_responsible VARCHAR(150),
    technical_responsible VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Diagnóstico',
    stage VARCHAR(50) DEFAULT 'E0 - Triagem',
    project_type VARCHAR(10) DEFAULT 'A',
    gov_stage VARCHAR(10) DEFAULT 'E0',
    executive_priority VARCHAR(50) DEFAULT 'P2 - Média Prioridade',
    is_priority_for_management BOOLEAN DEFAULT FALSE,
    has_impediment BOOLEAN DEFAULT FALSE,
    scheduled_meetings JSONB DEFAULT '[]',
    registered_by VARCHAR(150),
    group_encargado VARCHAR(150),
    user_group VARCHAR(150),
    notes TEXT,
    objective TEXT,
    initial_doc TEXT,
    notification_status TEXT,
    qr_code_url TEXT,
    initial_score NUMERIC DEFAULT 0,
    initial_risk VARCHAR(50) DEFAULT 'BAIXO',
    dimensions_initial JSONB DEFAULT '{}'::jsonb,
    links JSONB DEFAULT '{}'::jsonb,
    technical_doc JSONB DEFAULT '{}'::jsonb,
    estimation JSONB DEFAULT '{}'::jsonb,
    custom_hourly_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated VARCHAR(50)
);

-- 3. Tabela Relacional: Critérios de Risco
CREATE TABLE IF NOT EXISTS project_criteria (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criterion TEXT NOT NULL,
    evidence TEXT,
    points NUMERIC NOT NULL DEFAULT 1,
    dimension VARCHAR(50) NOT NULL,
    mitigated_by_action_ids JSONB DEFAULT '[]'::jsonb
);

-- 4. Tabela Relacional: Itens do Plano de Ação
CREATE TABLE IF NOT EXISTS project_actions (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    responsible VARCHAR(150) NOT NULL,
    deadline VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Média',
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    risk_points_impact NUMERIC DEFAULT 1,
    dimension VARCHAR(50) NOT NULL,
    notes TEXT,
    evidence TEXT,
    completion_date VARCHAR(50)
);

-- 5. Tabela Relacional: Artefatos e Documentos Anexados
CREATE TABLE IF NOT EXISTS project_artifacts (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    url TEXT,
    file_name VARCHAR(255),
    file_size VARCHAR(50),
    file_data TEXT,
    version VARCHAR(50) DEFAULT 'v1.0',
    author VARCHAR(150) NOT NULL,
    created_at VARCHAR(50) NOT NULL,
    description TEXT
);

-- 6. Tabela Relacional: Diário de Bordo & Atas de Reunião
CREATE TABLE IF NOT EXISTS project_meeting_logs (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    entry_type VARCHAR(100) NOT NULL,
    participants TEXT,
    summary TEXT NOT NULL,
    next_steps TEXT,
    registered_by VARCHAR(150) NOT NULL,
    hours_spent NUMERIC DEFAULT 1,
    linked_artifact_id VARCHAR(100),
    linked_artifact_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Configurações Globais de Governança
CREATE TABLE IF NOT EXISTS governance_settings (
    id VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas de alta performance
CREATE INDEX IF NOT EXISTS idx_criteria_project ON project_criteria(project_id);
CREATE INDEX IF NOT EXISTS idx_actions_project ON project_actions(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_project ON project_artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON project_meeting_logs(project_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_meeting_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para leitura e gravação (Anônimo / Autenticado corporativo)
CREATE POLICY "Permitir leitura total para projetos" ON projects FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao total para projetos" ON projects FOR ALL USING (true);

CREATE POLICY "Permitir leitura total para criterios" ON project_criteria FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao total para criterios" ON project_criteria FOR ALL USING (true);

CREATE POLICY "Permitir leitura total para acoes" ON project_actions FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao total para acoes" ON project_actions FOR ALL USING (true);

CREATE POLICY "Permitir leitura total para artefatos" ON project_artifacts FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao total para artefatos" ON project_artifacts FOR ALL USING (true);

CREATE POLICY "Permitir leitura total para reunioes" ON project_meeting_logs FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao total para reunioes" ON project_meeting_logs FOR ALL USING (true);

CREATE POLICY "Permitir leitura total para configuracoes" ON governance_settings FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao total para configuracoes" ON governance_settings FOR ALL USING (true);
