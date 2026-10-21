-- AlterTable: histórico de versões dos textos da Ficha (objetivo e documentação inicial)
ALTER TABLE "projects" ADD COLUMN     "text_versions" JSONB DEFAULT '[]';
