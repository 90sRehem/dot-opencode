# Approval Gate System

Herald uses the Question tool to pause before critical pipeline stages, ensuring user approval at key decision points. Gates are **scope-adaptive** — only required gates are presented based on task complexity.

**Note:** All inter-agent communication uses JSON envelopes (see [protocol.md](protocol.md) for complete schema). Herald parses `envelope.agent` + `envelope.status` to determine next action; gate presentation and decisions are as documented below.

---

## Gate Points (Canonical)

| Gate | Trigger | Question to User | Obrigatório? |
|------|---------|-----------------|-------------|
| G0: Intent | Quick scope detected | "How do you want to proceed?" (Implement with Scout / Review plan first / Use Sage) | Quick apenas |
| G1: Approve Plan | Sage retorna com specs prontos | "Plano pronto. Aprovar e prosseguir?" | Sim (Medium/Large) |
| G2: Write Specs | Sage retorna com artefatos para escrever | "Aprovar escrita dos artefatos de spec?" | Sim (Medium/Large) |
| G3: Execute | Specs escritas no disco | "Aprovar execução da implementação?" | Sim (Medium/Large) |
| G4/G5: Review | Após Forge completar | "Quer rodar reviews?" (Security+Quality / Skip) | Opt-in (Quick/Medium), **Mandatory** (Large) |
| G6: Commit | Antes do commit | "Proposed commit: [message]. Approve?" | Sim (sempre antes de commit) |

**G4/G5 scope rule:** Quick e Medium → oferecidos, usuário pode pular. Large → obrigatórios (Ward + Arbiter).

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
Herald → Scout → Sage (planeja spec.md + tasks.md) → G1 → G2 → Forge (write specs) → G3 → Forge (execute) → [G4/G5 opt-in] → G6 → done
```

**Specs:** `spec.md` + `tasks.md`

### Large (arquitetural, multi-arquivo)

```
Herald → Scout → Sage (planeja spec.md + design.md + tasks.md) → G1 → G2 → Forge (write specs) → G3 → Forge (execute) → [G4/G5 mandatory] → G6 → done
```

**Specs:** `spec.md` + `design.md` + `tasks.md`
**Nota:** Para Large, Sage pode escrever direto OU delegar Forge em ARTIFACTS WRITE MODE se content >800 linhas.

---

## Gate Rules

- **Mandatory enforcement**: G1, G2, G3 e G6 NUNCA são pulados. G0 só no Quick. G4/G5 são opt-in (Quick/Medium) e mandatory (Large).
- **Affirmative** ("yes", "y", "go", "sim", "s") → proceed
- **Negative** ("no", "n", "não") → Herald stops and asks what to change
- **Opt-out**: User may say "skip gates" to disable G4/G5 for the current Quick/Medium session. This does not apply to Large scope.

---

## Recovery Checkpoints at Gates

When Forge is executing complex tasks (resumable workflows), gate passage triggers a recovery checkpoint.

| Gate | Checkpoint Trigger |
|------|-------------------|
| G1 (Approve Plan) | User aprova o plano gerado por Sage. |
| G2 (Write Specs) | User aprova escrita. Forge escreve spec artifacts. |
| G3 (Execute) | User aprova execução. Forge começa task 1. |
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

**When it does NOT fire**: grill-me never fires on the happy path. A well-specified request goes through the standard gated flow with no interview.

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

1. **Context reaches 95%**: Agent emits `status: "context_pause"` (see [Context Management](../AGENTS.md#context-management))
2. **User chooses "compact_now"**: Herald initiates compaction (externally managed)
3. **Compaction complete**: Herald invokes Forge recovery startup
4. **Forge checks recovery file**: Loads `.specs/features/<name>/.recovery.json`
5. **Forge emits recovery prompt**: System-origin prompt contains feature name, completed tasks, next task ID
6. **Forge resumes execution**: Continues from checkpoint without user re-initiation
7. **On completion**: Forge deletes recovery file and logs to vault

This flow ensures resumption is transparent to the user and maintains execution continuity across compaction events.

---

## Budget Exhaustion Gate — Structured Handoff (Herald only)

When Herald detects it has exhausted its step/tool budget mid-workflow and cannot delegate the next agent(s), it MUST NOT respond with free text listing manual steps. Instead, Herald MUST present a structured Question tool gate with handoff options.

### When this gate fires

Herald hits its step limit at any of these points:
- After Forge returns `status: "complete"` — cannot delegate Ward/Arbiter for G4/G5
- After presenting G4/G5 but cannot delegate the selected review agent(s)
- Before or during G6 — cannot delegate Forge for commit or post-execution
- At G1/G2/G3 if Sage or Forge delegation still pending

The golden rule: if the user chose a review path at G4/G5 and Herald cannot execute it, the handoff MUST preserve that choice so the next session can apply it without asking again.

### Handoff gate format (Question tool, mandatory)

```
question([{
  header: "Step budget exhausted",
  question: "Budget exhausted — cannot execute <pending-action>. How should we hand this off?",
  options: [
    { label: "Criar handoff (Recomendado)", description: "Generate a structured resume prompt. Paste it in a new session to continue with the same pending action." },
    { label: "Mostrar prompt de retomada", description: "Display a ready-to-use resume prompt that includes pending agents and context." },
    { label: "Seguir sem executar", description: "List remaining steps only. You decide later." },
    { label: "Cancelar", description: "Stop. No handoff generated." }
  ]
}])
```

### Option behaviors

**"Criar handoff"** — Herald emits a `session_handoff` JSON block (see protocol.md) and displays a ready-to-paste prompt. The handoff records:
- `pending_action`: the next thing that could not be executed (e.g., `run_reviews_parallel`, `run_ward_only`, `run_arbiter_only`, `present_g6_commit_gate`)
- `last_gate`: last gate the user passed
- Inputs already collected: feature name, Forge output, user review choice, files changed, proposed commit message
- Known artifacts: `.specs/features/<name>/`, completed tasks

**"Mostrar prompt de retomada"** — Text-only resume prompt (no JSON metadata). Same information, flat format.

**"Seguir sem executar"** — Simple text listing of what remains, no handoff.

**"Cancelar"** — Stop. No handoff, no further output.

### Resume experience (new session)

User pastes the handoff prompt. The agent (Herald in the new session) reads:
- `pending_action` → knows exactly which agent(s) to delegate and in what mode
- `context` block → injects Forge output, files changed, proposed commit directly into the delegation prompt
- Does NOT re-ask review preferences (the choice was already made and recorded)

**Invariant:** The handoff preserves user intent. A new session MUST arrive at the same gate outcome the user already chose, without repeating gates that were already passed.

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

---

## Workflow Gates Declaration

Os gates G0-G6 acima são **templates** com defaults. Cada workflow define quais gates usa e como são apresentados via o campo `gates` na definição do workflow `.jsonc`.

### Como Funciona

1. Workflow declara `gates` com chaves G0-G6, cada uma com `mode` obrigatório
2. Plugin injeta configuração no system prompt do Herald via `[WORKFLOW GATES]`
3. Herald lê o bloco e usa `header`, `question`, `mode` ao apresentar o gate
4. Se o gate não estiver no bloco, Herald usa o default deste documento

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `mode` | enum | Sim | `required`, `optional`, `disabled` |
| `header` | string (≤30 chars) | Não | Label curto para o Question tool |
| `question` | string | Não | Texto completo da pergunta |

### Regras de Segurança

- `G6` (commit) é **sempre obrigatório** — `mode: disabled` é rejeitado na validação
- `mode: disabled` pula o gate completamente (não apresenta ao usuário)
- Gates afetam apenas apresentação, não lógica de roteamento ou delegação
- Todo `gate_after` em steps deve ter o gate declarado em `gates`

### Exemplo

```jsonc
{
  "name": "Bugfix",
  "gates": {
    "G1": {
      "mode": "required",
      "header": "Plano de correção",
      "question": "Analisei o bug e preparei correção. Aprovar?"
    },
    "G6": {
      "mode": "required",
      "question": "Bug corrigido. Aprovar commit?"
    }
  }
}
```

**Vantagem:** Workflows ficam autônomos — cada um define seus próprios checkpoints de aprovação e modo sem alterar `gates.md`.
