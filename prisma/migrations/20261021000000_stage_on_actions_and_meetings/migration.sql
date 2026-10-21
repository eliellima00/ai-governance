-- AlterTable: tarefas (ações) e reuniões passam a pertencer a uma etapa da esteira (E0–E6).
-- Registros antigos ficam com NULL; o app infere a etapa na leitura até alguém salvar o projeto.
ALTER TABLE "project_actions" ADD COLUMN     "stage" VARCHAR(10);
ALTER TABLE "project_meeting_logs" ADD COLUMN     "stage" VARCHAR(10);
