-- =============================================
-- Learn IO - Schema para Supabase
-- Ejecutar en: Supabase > SQL Editor
-- =============================================

CREATE SCHEMA IF NOT EXISTS "public";

-- Tabla: Problem
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemType" TEXT NOT NULL DEFAULT 'MAX',
    "method" TEXT NOT NULL DEFAULT 'AUTO',
    "variables" INTEGER NOT NULL DEFAULT 2,
    "constraints" INTEGER NOT NULL DEFAULT 2,
    "objective" TEXT NOT NULL,
    "constraintsData" TEXT NOT NULL,
    "variableTypes" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "result" TEXT,
    "scenarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- Tabla: Scenario
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- Tabla: Exercise
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "type" TEXT NOT NULL DEFAULT 'MAX',
    "description" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "constraints" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- Tabla: Tutorial
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- Tabla: HistoryEntry
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "problemId" TEXT,
    "title" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE UNIQUE INDEX "Tutorial_slug_key" ON "Tutorial"("slug");

-- Relaciones
ALTER TABLE "Problem"
    ADD CONSTRAINT "Problem_scenarioId_fkey"
    FOREIGN KEY ("scenarioId")
    REFERENCES "Scenario"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
