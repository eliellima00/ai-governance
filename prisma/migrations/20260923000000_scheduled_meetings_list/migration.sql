-- AlterTable: scheduledDate/scheduledSubject (um único agendamento) -> scheduledMeetings (lista)
ALTER TABLE "projects" ADD COLUMN     "scheduled_meetings" JSONB DEFAULT '[]';

UPDATE "projects" SET "scheduled_meetings" = jsonb_build_array(
  jsonb_build_object('id', 'm1', 'date', "scheduled_date", 'subject', COALESCE("scheduled_subject", 'Reunião'))
) WHERE "scheduled_date" IS NOT NULL;

ALTER TABLE "projects" DROP COLUMN "scheduled_date";
ALTER TABLE "projects" DROP COLUMN "scheduled_subject";
