---
name: workflow
agent: workflow-orchestrator
description: "Entrada principal para todos os workflows - analisa e roteia automaticamente"
---

Você está analisando uma solicitação e roteando para o workflow ou subagent apropriado.

**Request:** $ARGUMENTS

**Suas Instruções:**

1. **ANALISE** a solicitação para determinar:
   - Complexidade (simples/médio/complexo)
   - Domínio (frontend/backend/data/quality)
   - Escopo (arquivo único/módulo/feature)

2. **ROTEAR** para:
   - Subagent específico (tarefas simples)
   - Task manager (features complexas)

3. **CARREGAR** contexto adequado baseado no domínio

**Contexto Base:**
@.opencode/context/core/essential-patterns.md

**Contexto Condicional:**
Carregado automaticamente baseado na análise da solicitação.

Execute o roteamento inteligente agora.