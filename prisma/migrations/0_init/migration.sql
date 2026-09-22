-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "projects" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "glpi_ticket_id" VARCHAR(50),
    "asset_id" VARCHAR(50),
    "department" VARCHAR(100) NOT NULL,
    "business_responsible" VARCHAR(150),
    "technical_responsible" VARCHAR(150),
    "status" VARCHAR(50) DEFAULT 'Diagnóstico',
    "stage" VARCHAR(50) DEFAULT 'E0 - Triagem',
    "project_type" VARCHAR(10) DEFAULT 'A',
    "gov_stage" VARCHAR(10) DEFAULT 'E0',
    "executive_priority" VARCHAR(50) DEFAULT 'P2 - Média Prioridade',
    "is_priority_for_management" BOOLEAN DEFAULT false,
    "has_impediment" BOOLEAN DEFAULT false,
    "scheduled_date" VARCHAR(50),
    "scheduled_subject" TEXT,
    "registered_by" VARCHAR(150),
    "group_encargado" VARCHAR(150),
    "user_group" VARCHAR(150),
    "notes" TEXT,
    "objective" TEXT,
    "initial_doc" TEXT,
    "notification_status" TEXT,
    "qr_code_url" TEXT,
    "initial_score" DECIMAL DEFAULT 0,
    "initial_risk" VARCHAR(50) DEFAULT 'BAIXO',
    "dimensions_initial" JSONB DEFAULT '{}',
    "links" JSONB DEFAULT '{}',
    "technical_doc" JSONB DEFAULT '{}',
    "sheets_catalog" JSONB DEFAULT '[]',
    "custom_hourly_rate" DECIMAL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "last_updated" VARCHAR(50),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_criteria" (
    "id" VARCHAR(100) NOT NULL,
    "project_id" VARCHAR(100) NOT NULL,
    "criterion" TEXT NOT NULL,
    "evidence" TEXT,
    "points" DECIMAL NOT NULL DEFAULT 1,
    "dimension" VARCHAR(50) NOT NULL,
    "mitigated_by_action_ids" JSONB DEFAULT '[]',

    CONSTRAINT "project_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_actions" (
    "id" SERIAL NOT NULL,
    "project_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "responsible" VARCHAR(150) NOT NULL,
    "deadline" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(50) NOT NULL DEFAULT 'Média',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    "risk_points_impact" DECIMAL DEFAULT 1,
    "dimension" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "evidence" TEXT,
    "completion_date" VARCHAR(50),

    CONSTRAINT "project_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_artifacts" (
    "id" VARCHAR(100) NOT NULL,
    "project_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "url" TEXT,
    "file_name" VARCHAR(255),
    "file_size" VARCHAR(50),
    "file_data" TEXT,
    "version" VARCHAR(50) DEFAULT 'v1.0',
    "author" VARCHAR(150) NOT NULL,
    "created_at" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "project_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_meeting_logs" (
    "id" VARCHAR(100) NOT NULL,
    "project_id" VARCHAR(100) NOT NULL,
    "date" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "entry_type" VARCHAR(100) NOT NULL,
    "participants" TEXT,
    "summary" TEXT NOT NULL,
    "next_steps" TEXT,
    "registered_by" VARCHAR(150) NOT NULL,
    "hours_spent" DECIMAL DEFAULT 1,
    "linked_artifact_id" VARCHAR(100),
    "linked_artifact_title" VARCHAR(255),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_meeting_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_settings" (
    "id" VARCHAR(50) NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_criteria_project" ON "project_criteria"("project_id");

-- CreateIndex
CREATE INDEX "idx_actions_project" ON "project_actions"("project_id");

-- CreateIndex
CREATE INDEX "idx_artifacts_project" ON "project_artifacts"("project_id");

-- CreateIndex
CREATE INDEX "idx_meetings_project" ON "project_meeting_logs"("project_id");

-- AddForeignKey
ALTER TABLE "project_criteria" ADD CONSTRAINT "project_criteria_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_actions" ADD CONSTRAINT "project_actions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_artifacts" ADD CONSTRAINT "project_artifacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_meeting_logs" ADD CONSTRAINT "project_meeting_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

