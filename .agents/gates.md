# Approval Gate System

Herald uses the Question tool to pause before critical pipeline stages, ensuring user approval at key decision points. Gates are **scope-adaptive** — only required gates are presented based on task complexity.

**Note:** All inter-agent communication uses JSON envelopes (see [protocol.md](protocol.md) for complete schema). Herald parses `envelope.agent` + `envelope.status` to determine next action; gate presentation and decisions are as documented below.

---

## Gate Points (Simplified)

| Gate | Trigger | Question to User | Obrigatório? |
|------|---------|-----------------|-------------|
| G0: Intent | Quick scope detected | "How do you want to proceed?" (Implement with Scout / Review plan first / Use Sage) | Quick apenas |
| G1: Approve Plan | Sage retorna com specs prontos | "Plano pronto. Aprovar e prosseguir?" | Sim (Medium/Large) |
| G4/G5: Review | Após Forge completar | "Quer rodar reviews?" (Security+Quality / Skip) | **Opt-in** (default: oferecer) |
| G6: Commit | Antes do commit | "Proposed commit: [message]. Approve?" | Sim |

**Eliminados:** G2 (write specs) e G3 (execute) — Sage escreve specs direto, Forge executa após G1.

---

## Fluxo por Scope

### Quick (tarefas pequenas, tracking via specs)

```
Herald → G0 → Scout (gather context) → Forge (quick mode, no exploration) → G6 → done
```

**Specs:** Apenas `tasks.md` em `.specs/features/<name>/` (se Sage for usado para planning)
**Nota:** Scout coleta arquivos-alvo e constraints; Forge executa direto com base nos findings. Exceção: operações tool-only triviais (alvo já inequívoco) podem pular Scout.

### Medium (escopo claro, 2-5 arquivos)

```
Herald → Sage (escreve spec.md + tasks.md direto) → G1 → Forge → [G4/G5 opt-in] → G6 → done
```

**Specs:** `spec.md` + `tasks.md`

### Large (arquitetural, multi-arquivo)

```
Herald → Sage (escreve spec.md + design.md + tasks.md OU delega Forge) → G1 → Forge → [G4/G5 recomendado] → G6 → done
```

**Specs:** `spec.md` + `design.md` + `tasks.md`
**Nota:** Para Large, Sage pode escrever direto OU delegar Forge em ARTIFACTS WRITE MODE se content >800 linhas.

---

## Gate Rules

- **Mandatory enforcement**: G1 e G6 NUNCA são pulados. G0 só no Quick. G4/G5 são oferecidos, não obrigatórios.
- **Affirmative** ("yes", "y", "go", "sim", "s") → proceed
- **Negative** ("no", "n", "não") → Herald stops and asks what to change
- **Opt-out**: User may say "skip gates" to disable G4/G5 for current session

---

## Recovery Checkpoints at Gates

When Forge is executing complex tasks (resumable workflows), gate passage triggers a recovery checkpoint.

| Gate | Checkpoint Trigger |
|------|-------------------|
| G1 (Approve Plan) | User aprova plano. Forge escreve checkpoint antes de começar task 1. |
| G4/G5 (Review) | User escolhe review. Forge escreve checkpoint com tasks completadas antes de delegar Ward/Arbiter. |
| G6 (Commit) | User aprova commit. Forge escreve checkpoint final antes de git commit. |

---

## Command-Triggered Workflows

Command-triggered workflows are skills that fire on explicit user commands, not at fixed gate checkpoints. They are **not gates** — they do not block progress or appear in the gate numbering (G0–G6).

### grill-me (Adjust Plan)

**Trigger commands**: `adjust plan`, `adjust <plan>`, `/adjust`, `modify plan`, `change plan`, `that's not what I meant`, `this isn't right`

**Workflow type**: `command_triggered` (not a gate)

**Target agent**: `herald`

**Interview protocol**:
1. Herald detects a trigger command in user input (case-insensitive substring match)
2. Herald loads the grill-me skill from registry → `.agents/skills/grill-me.md`
3. Herald conducts a structured interview: one question at a time, with recommendations
4. Interview walks the change tree depth-first (root complaint → scope → approach → constraints → details → priority → success criteria)
5. Interview stops when shared understanding is reached

**Output**: grill-me produces a JSON envelope with:
- `payload.root_complaint`: The user's initial dissatisfaction
- `payload.clarifications[]`: Array of resolved branches (branch, current_plan_says, question, answer, why, decision)
- `payload.summary`: Concise description of what the revised plan should look like
- `payload.unresolved[]`: Any branches that couldn't be resolved

**Re-planning flow**:
1. Herald constructs re-planning context: existing plan reference + grill-me clarifications + summary
2. Herald dispatches Sage with instruction: "Revise the existing plan to incorporate these adjustments"
3. Sage produces a revised plan
4. User reviews → satisfied (proceed to Forge) or adjusts again

**Iteration limit**: Maximum 3 re-plan iterations per plan. After 3 iterations, Herald blocks further adjustments and suggests: human pair review or feature breakdown.

**When it does NOT fire**: grill-me never fires on the happy path. A well-specified request goes straight through G0/G1 → Sage → Forge with no interview.

---

## Question Tool Enforcement

Question tool is mandatory for **all gates G0-G6** AND for any user-facing interaction requiring a choice:

- Presenting Ward/Arbiter findings
- Presenting Sage artifacts for approval
- Asking about scope classification
- Presenting options for next steps

**PROHIBITED**: Listing options in free text. MUST use Question tool invocation.

### Minimum Format

```json
{
  "header": "string — context label (≤30 chars)",
  "question": "string — what is being asked",
  "options": [
    {"label": "string — short label", "description": "string — what this choice means"}
  ]
}
```

**Applies to**: Herald (all interactions) and Sage (direct access — post-SPECIFY, post-DESIGN, post-TASKS approvals).

---

## Compaction Recovery Flow (Informational)

When context window reaches critical capacity and compaction is triggered, Forge uses the recovery checkpoint system to resume execution.

**See also:** [Recovery File Schema](protocol.md#recovery-file-schema) — checkpoint structure and protocol

1. **Context reaches 95%**: Agent emits `status: "context_pause"` (see `.agents/agents.md` § Context Window Monitor)
2. **User chooses "compact_now"**: Herald initiates compaction (externally managed)
3. **Compaction complete**: Herald invokes Forge recovery startup
4. **Forge checks recovery file**: Loads `.specs/features/<name>/.recovery.json`
5. **Forge emits recovery prompt**: System-origin prompt contains feature name, completed tasks, next task ID
6. **Forge resumes execution**: Continues from checkpoint without user re-initiation
7. **On completion**: Forge deletes recovery file and logs to vault

This flow ensures resumption is transparent to the user and maintains execution continuity across compaction events.

---

## Review Gate (G4/G5) — Opt-in Behavior

Após Forge retornar `status: "complete"`, Herald apresenta gate combinado:

**Opções:**
- **"Security + Quality (parallel)"** — Executa Ward e Arbiter em paralelo
- **"Security only"** — Só Ward
- **"Quality only"** — Só Arbiter  
- **"Skip reviews"** → Vai direto para G6
- **"Cancel"** — Para, mudanças não commitadas

**Padrão:** Review é **oferecido**, não obrigatório. Para Large scope, Herald recomenda explicitamente rodar reviews.

**Rejeições:** Se Ward/Arbiter retornar `reject`, Herald apresenta findings com opções:
- "Fix all issues" → Delega findings para Forge, re-roda review
- "Partial fix" → Escolhe quais findings endereçar
- "Dismiss findings" → Prossegue para G6 (aceita risco)
- "Abort" → Para, deixa mudanças como estão
