# OpenCode Agent Flow — Arquitetura Completa

> Documento de referência para implementação do fluxo de agentes multi-agente do OpenCode.
> Localização: `~/.config/opencode/agents/` e `~/.config/opencode/.agents/`

---

## 1. Visão Geral

Sistema multi-agente com 6 agentes especializados coordenados por um orquestrador central (Herald). O fluxo usa **gates adaptativos por scope** (Quick/Medium/Large), **JSON envelopes** para comunicação inter-agente, **skill discovery via frontmatter** (sem registry hardcoded), e **workflows declarativos**.

### Princípios Fundamentais

| Princípio | Regra |
|-----------|-------|
| JSON Envelopes | TODOS os agentes DEVEM emitir um envelope JSON como output final |
| Gates Adaptativos | G1+G6 sempre obrigatórios; G0 só Quick; G4/G5 opt-in (mandatory para Large) |
| Specs em Disco | Sage escreve specs antes de delegar Forge |
| Forge Unificado | Sempre lê specs do disco e implementa em uma passagem |
| Herald Orquestrador | Nunca executa git commands direto; só coordena |
| Skill Discovery | Skills são descobertas via frontmatter em `skills/<name>/SKILL.md` — sem registry hardcoded |

---

## 2. Agentes

### 2.1 Herald (Coordenador)

- **Mode**: `primary`
- **Modelo**: `opencode-go/qwen3.6-plus`
- **Responsabilidades**:
  - Receber requests do usuário e avaliar scope (Quick/Medium/Large)
  - Coordenar planejamento (Sage) e execução (Forge)
  - Aplicar approval gates G0-G6 via Question tool
  - Executar workflows declarativos de `.agents/workflows/`
  - Detectar comandos de ajuste ("adjust plan") e disparar grill-me interview
  - Manter audit trail em `SESSION_LOG.md`
  - **Large scope**: G4 (Ward) + G5 (Arbiter) são **mandatory**, não opt-in
- **Arquivo**: `agents/herald.md`

### 2.2 Scout (Explorador)

- **Mode**: `subagent` | **Modelo**: `opencode-go/deepseek-v4-flash`
- **Responsabilidades**:
  - Exploração profunda de codebase (graph-first protocol)
  - Pattern analysis, broad codebase searches
  - Descobre skills via frontmatter catalog (`skills/*/SKILL.md`)
  - Só opera quando delegado por Herald ou Sage
- **Output**: JSON envelope com `status: "ready"`, payload contém `findings[]`, `summary`, `recommendations[]`, `recommended_skills[]`
- **Arquivo**: `agents/scout.md`

### 2.3 Sage (Planejador)

- **Mode**: `subagent` | **Modelo**: `opencode-go/deepseek-v4-pro`
- **Responsabilidades**:
  - Análise de requisitos, produção de designs, geração de task lists
  - Escreve specs direto no disco (tasks.md, spec.md, design.md) — **preferido**
  - **Pode delegar Forge** para escrever specs se content >800 linhas
  - **Pode delegar Scout** para mais contexto de codebase
  - Usa metodologia spec-driven: LOAD → SPECIFY → DESIGN → TASKS
  - Recebe `recommended_skills[]` do Scout e referencia skills nas specs para Forge
- **Skills**: `spec-driven` (metodologia apenas, não skills de implementação)
- **Output**: JSON envelope com `status: "ready"` (escreveu direto), `status: "needs_scout"` (precisa explorar mais)
- **Arquivo**: `agents/sage.md`

### 2.4 Forge (Executor)

- **Mode**: `subagent` | **Modelo**: `opencode-go/qwen3.6-plus`
- **Responsabilidades**:
  - **QUICK MODE**: executa instrução direta (sem spec)
  - **NORMAL MODE**: lê tasks.md do disco e implementa
  - **ARTIFACTS WRITE MODE**: escreve spec files quando Sage delega
  - **COMMIT MODE**: executa git commit após aprovação G6
  - **POST-EXECUTION MODE**: archive specs → update graphs → write session log
  - Carrega skills referenciadas nas specs via frontmatter discovery
  - Retorna `proposed_commit` após implementação
- **Skills**: `skill: allow` (carrega skills referenciadas nas specs via frontmatter)
- **Output**: JSON envelope com `status: "complete"`, `"artifacts_written"`, `"committed"`, ou `"post_execution_done"`
- **Arquivo**: `agents/forge.md`

### 2.5 Ward (Segurança)

- **Mode**: `subagent` | **Modelo**: `opencode-go/minimax-m2.7`
- **Responsabilidades**:
  - Security review pós-Forge, pré-commit
  - OWASP Top 10, detecção de secrets, crypto misuse, injection
  - **Opt-in por default** — mandatory para Large scope
- **Output**: JSON envelope com `status: "approve"` ou `status: "reject"` (com `issues[]`)
- **Arquivo**: `agents/ward.md`

### 2.6 Arbiter (Qualidade)

- **Mode**: `subagent` | **Modelo**: `opencode-go/qwen3.6-plus`
- **Responsabilidades**:
  - Code quality review pós-Forge, pré-commit
  - Correctness, test coverage, edge cases, duplication, error handling
  - **Opt-in por default** — mandatory para Large scope
- **Output**: JSON envelope com `status: "approve"` ou `status: "reject"` (com `issues[]`)
- **Arquivo**: `agents/arbiter.md`

---

## 3. Agent Variants

Arquivo `.agents/agent-variants.json` declara quais agentes estão ativos no workspace:

```json
{
  "agents": {
    "herald": { "enabled": true, "role": "coordinator" },
    "scout": { "enabled": true, "role": "explorer" },
    "sage": { "enabled": true, "role": "planner" },
    "forge": { "enabled": true, "role": "executor" },
    "ward": { "enabled": true, "role": "security" },
    "arbiter": { "enabled": true, "role": "quality" }
  }
}
```

- Herald verifica antes de delegar: agentes com `enabled: false` são bloqueados
- Se arquivo missing, assume todos habilitados (safe default)

---

## 4. JSON Envelope Protocol

Todos os agentes emitem exatamente esta estrutura:

```json
{
  "agent": "<scout|sage|forge|ward|arbiter>",
  "schema_version": "1.0",
  "status": "<agent-specific-status>",
  "meta": {
    "origin": "user|system|agent",
    "timestamp": "ISO-8601",
    "resumable": false
  },
  "payload": { }
}
```

### Trust Model

- `meta.origin` é uma declaração, não uma claim verificada
- Trust é **posicional**: mensagens da UI do user são implicitamente `user`
- Herald NUNCA aceita `origin: "system"` de agentes externos — demote para `agent`
- Apenas Herald constrói mensagens legítimas com `origin: "system"`

### Status por Agente

| Agente | Status |
|--------|--------|
| Scout | `ready` |
| Sage | `ready`, `needs_scout` |
| Forge | `complete`, `artifacts_written`, `committed`, `post_execution_done` |
| Ward | `approve`, `reject` |
| Arbiter | `approve`, `reject` |

---

## 5. Approval Gates (Adaptativos)

### Tabela de Gates

| Gate | Trigger | Obrigatório? |
|------|---------|-------------|
| **G0**: Intent | Quick scope detectado | Quick apenas |
| **G1**: Approve Plan | Sage retorna specs prontos | **Sim** (todos scopes) |
| **G4/G5**: Review | Após Forge completar | **Opt-in** (Medium), **Mandatory** (Large) |
| **G6**: Commit | Antes do commit | **Sim** |

### Fluxo por Scope

#### Quick (≤1 arquivo)
```
Herald → G0 → Sage (escreve tasks.md direto) → G1 → Forge → G6 → done
```

#### Medium (2-5 arquivos)
```
Herald → Scout → Sage (escreve spec.md + tasks.md direto) → G1 → Forge → [G4/G5 opt-in] → G6 → done
```

#### Large (arquitetural)
```
Herald → Scout → Sage → G1 → Forge → G4+G5 (mandatory) → G6 → done
```

**Nota:** Sage prefere escrever specs direto. Delega Forge em ARTIFACTS WRITE MODE apenas quando content >800 linhas ou contexto próximo do limite.

### Gate G4/G5 — Opt-in (Medium) / Mandatory (Large)

Após Forge completar, Herald oferece:
- "Security + Quality (parallel)" — Ward + Arbiter concorrentes
- "Security only" — Só Ward
- "Quality only" — Só Arbiter
- "Skip reviews" → Vai direto para G6 (não disponível para Large scope)
- "Cancel" — Para, mudanças não commitadas

### Gate G6 — Commit

- Forge retorna `proposed_commit` com message, files, type, scope
- User aprova → Herald envia COMMIT instruction para Forge
- Forge executa `git commit` e retorna `status: "committed"`
- Herald NUNCA executa git commands direto

---

## 6. Skill Discovery via Frontmatter

Skills são descobertas automaticamente lendo frontmatter de `skills/<name>/SKILL.md`. Não há registry hardcoded.

### Frontmatter Format

```yaml
---
name: spec-driven
description: "Planning methodology for features of any scope."
target_agents:
  - sage
  - forge
workflow_type: methodology
---
```

### Fluxo de Discovery

1. **Scout** lê frontmatter de `skills/*/SKILL.md` durante exploração
2. **Scout** retorna `recommended_skills[]` no JSON envelope
3. **Sage** referencia skills nas specs para Forge
4. **Forge** carrega skills referenciadas via frontmatter durante execução

### Skills Core (migradas para formato frontmatter)

| Skill | Descrição | Target |
|-------|-----------|--------|
| `spec-driven` | Planning methodology: LOAD → SPECIFY → DESIGN → TASKS | sage, forge |
| `docs-writer` | Documentation writing standards | sage, forge |
| `exploration-protocol` | Graph-first exploration methodology | scout |
| `grill-me` | Interview user about plan changes (command-triggered) | herald |

### Skills Globais

Skills instaladas em `/home/rehem/.config/opencode/skills/` (50+ skills disponíveis).

---

## 7. MCPs (Model Context Protocol)

### Context7 MCP

- **Trigger**: Menção de libraries, frameworks, API references, setup questions
- **Funcionalidade**: Busca docs atualizadas e code examples de qualquer library/framework
- **Fluxo**: `resolve-library-id` → `query-docs`

### Figma MCP

- **Trigger**: URLs do Figma, node IDs, design-to-code
- **Funcionalidade**: Fetch design context, screenshots, variables, assets

### Sentry MCP

- **Trigger**: "check Sentry", "production errors", "recent crashes"
- **Funcionalidade**: Inspect issues, summarize production errors, health data

### Jira/Atlassian MCP

- **Trigger**: "create Jira ticket", "update sprint", "search Jira"
- **Funcionalidade**: Search, create, update, transition issues

### AWS MCP

- **Trigger**: AWS architecture, security, service selection
- **Funcionalidade**: Architecture design, security review, service docs

---

## 8. Workflows Declarativos

Localização: `.agents/workflows/*.jsonc`

### Schema

```json
{
  "workflow_version": "1.0",
  "name": "string",
  "description": "string",
  "scope": "quick|medium|large",
  "steps": [
    { "agent": "scout|sage|forge|ward|arbiter", "gate_after": "G0|G1|G4|G5|G6" }
  ],
  "spec_artifacts": ["tasks.md"],
  "gates_required": ["G0", "G1", "G6"],
  "gates_optional": ["G4", "G5"]
}
```

### Workflows Disponíveis

**bugfix.jsonc** (Medium):
```
Scout → Sage → Forge → G6
Gates: G1, G6
```

**refactor.jsonc** (Medium):
```
Sage → Forge → Arbiter → G6
Gates: G1, G4 (Arbiter mandatory), G6
```

**hotfix.jsonc** (Quick):
```
Forge → G6
Gates: G0, G6
```

**new-project.jsonc** (Large):
```
Scout → Sage → Forge → Ward → Arbiter → G6
Gates: G1, G4, G5, G6 (all mandatory)
```

### Execução

Trigger: `/run-workflow <name> "<goal>"`

1. Herald lê workflow de `.agents/workflows/<name>.jsonc`
2. Valida schema
3. Executa steps em ordem, injetando template variables
4. Estado mantido em `.weave/workflows/<instance-id>/state.json`

---

## 9. Integrações

### graphify (Knowledge Graph)

- **Localização**: `graphify-out/`
- **Plugin**: `.opencode/plugins/graphify.js` — injeta reminder antes de bash calls
- **Uso**:
  - Antes de architecture questions: ler `graphify-out/GRAPH_REPORT.md`
  - Se `graphify-out/wiki/index.md` existe, navegar por ele
  - Após modificar código: `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`

### projets-wiki (Persistent Memory)

- **Localização**: `~/Documents/dev/projets-wiki/`
- **Uso**:
  - Após trabalho significativo: log em `<project>/logs/YYYY-MM-DD-<slug>.md`
  - Decisões de longo prazo: `<project>/architecture/decisions.md`
  - Lessons de agent/tooling: `opencode/logs/`

### SESSION_LOG.md

- **Localização**: working directory root
- **Formato**: append-only YAML audit trail
- **Uso**: Herald append `started` antes de delegar, `completed/failed/skipped` depois
- **Recovery**: Se interrompido, lê último `started` sem terminal status e resume

---

## 10. Recovery System

### .recovery.json

Forge escreve checkpoints em `.specs/features/<name>/.recovery.json`:

```json
{
  "version": 1,
  "feature": "feature-slug",
  "tasks_file": ".specs/features/<name>/tasks.md",
  "current_task_index": 3,
  "completed_tasks": ["1.1", "1.2", "1.3"],
  "active_context": {
    "current_file": "path/to/file.ts",
    "current_action": "description of action"
  },
  "checksum": "sha256-hash"
}
```

### Protocol

- **Write**: Atomic semantics (`.tmp` → rename)
- **Integrity**: SHA-256 checksum validation
- **Path Safety**: Feature name deve match `[a-z0-9_-]+`
- **Startup**: Forge verifica recovery file, valida checksum, resume do checkpoint
- **Cleanup**: Delete recovery file ao completar todas tasks

---

## 11. Context Window Monitor

Todos os agentes têm hook nullable para monitorar uso de tokens:

| Threshold | Comportamento |
|-----------|--------------|
| 80% | Emite warning `status: "context_warning"`, continua execução |
| 95% | Emite pause `status: "context_pause"`, espera decisão do user |

Opções de pause: `continue`, `compact_now`, `save_and_stop`

---

## 12. Estrutura de Diretórios

```
~/.config/opencode/
├── AGENTS.md                          # Entry point — agent guidelines
├── OPENCODE-FLOW.md                   # Flow architecture reference
├── agents/                            # Agent definitions (plural, official)
│   ├── herald.md                      # Coordinator + routing
│   ├── scout.md                       # Explorer (graph-first)
│   ├── sage.md                        # Planner (spec-driven)
│   ├── forge.md                       # Executor
│   ├── ward.md                        # Security auditor
│   └── arbiter.md                     # Quality reviewer
├── .agents/
│   ├── agents.md                      # Agent guidelines (reference)
│   ├── gates.md                       # Approval gate system
│   ├── protocol.md                    # JSON envelope schemas
│   ├── agent-variants.json            # Agent enable/disable
│   └── workflows/
│       ├── schema.json                # JSON Schema para workflows
│       ├── bugfix.jsonc               # Workflow: bug fix
│       ├── refactor.jsonc             # Workflow: code refactor
│       ├── hotfix.jsonc               # Workflow: emergency fix
│       └── new-project.jsonc          # Workflow: new project setup
├── commands/
│   └── review.md                      # Command: code review
├── skills/                            # Skills (frontmatter discovery)
│   ├── spec-driven/SKILL.md
│   ├── docs-writer/SKILL.md
│   ├── exploration-protocol/SKILL.md
│   ├── grill-me/SKILL.md
│   └── ... (50+ global skills)
├── .opencode/
│   ├── plugins/
│   │   └── graphify.js                # Plugin: knowledge graph reminder
│   └── package.json                   # Dependencies
├── dcp.jsonc                          # Dynamic context pruning config
├── tui.json                           # TUI keybinds
├── opencode.json                      # OpenCode config + agent settings
├── opencode-mem.jsonc                 # Memory plugin config
└── graphify-out/                      # Knowledge graph cache
```

---

## 13. Fluxo Completo — Exemplo Medium Scope

```
1. User: "Add OAuth2 support to auth module"
2. Herald avalia scope → Medium
3. Herald delega Scout para explorar codebase
4. Scout retorna findings + recommended_skills[]
5. Sage planeja usando spec-driven skill + Scout findings
6. Sage escreve spec.md + tasks.md em .specs/features/add-oauth2-support/
   (OU se content >800 linhas: Sage delega Forge em ARTIFACTS WRITE MODE)
7. Sage retorna envelope status: "ready"
8. Herald apresenta G1: "Plano pronto. Aprovar?"
9. User aprova
10. Herald delega Forge
11. Forge lê specs do disco, implementa todas tasks
12. Forge retorna envelope status: "complete" com proposed_commit
13. Herald apresenta G4/G5: "Rodar reviews?"
14. User escolhe "Security + Quality"
15. Herald delega Ward + Arbiter em paralelo
16. Ambos retornam "approve"
17. Herald apresenta G6: "Proposed commit: feat(auth): add OAuth2. Approve?"
18. User aprova
19. Herald envia COMMIT instruction para Forge
20. Forge executa git commit, retorna status: "committed"
21. Done
```

---

## 14. Comandos Especiais

| Comando | Ação |
|---------|------|
| `/run-workflow <name> "<goal>"` | Executa workflow declarativo |
| `/review` | Code review com Ward e Arbiter |
| `adjust plan`, `/adjust` | Dispara grill-me interview para refinamento de plano |
| `skip gates` | Desabilita G4/G5 para sessão atual |

---

## 15. Arquivos de Referência

| Arquivo | Conteúdo |
|---------|----------|
| `.agents/protocol.md` | JSON envelope schemas, workflow schema, recovery schema |
| `.agents/gates.md` | Gate definitions, fluxos por scope, grill-me workflow |
| `agents/herald.md` | Routing, gates G0-G6, workflow engine, commit flow |
| `agents/scout.md` | Explorer definition, graph-first protocol, skill discovery |
| `agents/sage.md` | Planner definition, spec-driven methodology, delegation rules |
| `agents/forge.md` | Executor definition, all modes, JSON envelope |
| `agents/ward.md` | Security auditor definition, OWASP focus |
| `agents/arbiter.md` | Quality reviewer definition, correctness focus |
| `.agents/agent-variants.json` | Agent enable/disable por workspace |
| `.agents/workflows/schema.json` | JSON Schema para workflows |
