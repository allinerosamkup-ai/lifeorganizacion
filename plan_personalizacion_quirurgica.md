# 💎 Plan de Implementación: Motor de Personalización Quirúrgica

Este documento traza la hoja de ruta para elevar la inteligencia de **LifeOrganizer AI** de un simple tracker a un **Sistema Operacional Personal Adaptativo**.

## 🎯 Objetivo

Hacer que cada insight y tarefa sugerida por la IA sea única para la usuaria, basándose en la intersección de su ciclo biológico, su estado diario (humor/sueño) e informes históricos de productividad.

## 🛠️ Squad de Expertos Propuesto

1. **@ai-engineer**: Responsable de la ingeniería de prompts y capas de contexto.
2. **@database-architect**: Optimización de tablas de aprendizaje y logs de comportamiento.
3. **@ui-ux-pro-max**: Validación de la estética premium y feedback loop de la usuaria.

---

## 📅 Fase 1: Memoria Adaptativa (Back-end)

**Meta:** Transformar los `weekly_learnings` de métricas frías a "Notas de Calibración" inteligentes.

- [ ] **Evolución Schema SQL:**
  - Añadir columna `calibration_insights` (JSONB) a la tabla `weekly_learnings`.
  - Añadir columna `execution_delta` a `tasks` (diferencia entre energía sugerida y real).
- [ ] **Refactor de Edge Function `update-weekly-learning`:**
  - Integrar Claude para analizar no solo números, sino la tendencia de humor vs. completitud de tareas.
  - Generar patrones como: *"Usuaria rinde 40% mejor en tareas creativas si durmió +7h en fase folicular"*.

---

## 🧠 Fase 2: Motor de Inferencia Quirúrgico

**Meta:** Inyectar el aprendizaje histórico en el check-in diario.

- [ ] **Refactor de Edge Function `process-checkin`:**
  - **Capa 5 (Contexto de Aprendizaje):** Extraer las `calibration_insights` de la tabla de aprendizajes.
  - **Prompt Engineering:** Redefinir el sistema de "Presupuesto de Energía" (Energy Budget) para que sea restrictivo.
- [ ] **Generación de Tareas Únicas:**
  - Cruce de tareas pendientes con el "Energy Budget" del día calculado por la IA.

---

## ✨ Fase 3: Feedback Loop & UI (Front-end)

**Meta:** Transparencia en la toma de decisiones de la IA.

- [ ] **Componente `Tasks.tsx`:**
  - Mostrar el "Por qué" de la IA: *"Sugerido por tu tendencia de alta energía los martes post-periodo"*.
- [ ] **Historial de Sugerencias:**
  - Permitir a la usuaria calificar la precisión de la sugerencia (Refuerzo Positivo para el modelo).

---

**Estado:** Diagnóstico completado por @andruia-consultant.
