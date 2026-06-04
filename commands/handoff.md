---
description: "Create a session handoff preserving workflow state for resumption in a new session. Use when step budget is exhausted or switching sessions mid-workflow."
---

# Handoff Command

When the user invokes `/handoff`, gather the current workflow state and emit a structured `session_handoff` block so the next session can resume without repeating gates or re-asking decisions.

## Protocol

### Step 1 — Detect current state

Determine the workflow position using these signals:

| Signal | How to detect |
|--------|---------------|
| Active spec | `glob(".specs/features/*/tasks.md")` — extract feature name from path |
| Forge completed | Look for recent `agent: "forge"` envelope with `status: "complete"` in conversation history |
| Pending review | User selected a review path at G4/G5 but Ward/Arbiter not yet delegated |
| Pending commit | G6 not yet presented or user approved G6 but Forge commit not delegated |
| Pending execution | Sage artifacts exist but Forge not yet delegated for execute mode |

### Step 2 — Determine pending_action

Map the detected state to `pending_action`:

| State | pending_action |
|-------|----------------|
| Forge complete, user chose "Security + Quality (parallel)" | `run_reviews_parallel` |
| Forge complete, user chose "Security only" | `run_ward_only` |
| Forge complete, user chose "Quality only" | `run_arbiter_only` |
| Reviews complete/approved, G6 pending | `present_g6_commit_gate` |
| User approved G6, commit not delegated | `delegate_forge_commit` |
| Sage ready, Forge not yet executed | `delegate_forge_execute` |
| Quick scope, Forge not yet delegated | `delegate_forge_quick` |

### Step 3 — Gather context fields

Collect from the current conversation:

- **feature**: feature slug from `.specs/features/<name>/` or topic
- **scope**: `quick | medium | large`
- **specs_path**: `.specs/features/<name>/` if applicable
- **forge_complete**: `true` if Forge returned `status: "complete"`
- **tasks_done**: from Forge envelope `payload.tasks_done`
- **files_changed**: from Forge envelope `payload.files_changed`
- **proposed_commit**: from Forge envelope `payload.proposed_commit`
- **user_review_choice**: `parallel | security_only | quality_only | skip` (only if G4/G5 was presented)
- **review_results**: `{ ward: "approve|reject|pending", arbiter: "approve|reject|pending" }`

If any field cannot be determined, use its default (empty string, `[]`, `false`, `null`).

### Step 4 — Build session_handoff JSON

Build following the schema in `.agents/protocol.md#session-handoff-payload`:

```json
{
  "type": "session_handoff",
  "reason": "manual_handoff | step_budget_exhausted",
  "pending_action": "<from Step 2>",
  "last_gate": "<G0|G1|G4|G5|G6>",
  "resume_prompt": "<generated from Step 5>",
  "context": {
    "feature": "<slug>",
    "scope": "<quick|medium|large>",
    "specs_path": "<path>",
    "forge_complete": true,
    "tasks_done": 0,
    "files_changed": [],
    "proposed_commit": { "type": "", "scope": "", "message": "" },
    "user_review_choice": "<parallel|security_only|quality_only|skip>",
    "review_results": { "ward": "pending", "arbiter": "pending" }
  }
}
```

Use `"reason": "step_budget_exhausted"` if Herald hit step limit. Use `"reason": "manual_handoff"` if user invoked `/handoff` proactively.

### Step 5 — Generate resume_prompt

Produce a flat-text resume prompt that can be pasted into a new session. Use this template and fill in all placeholders:

```
## /handoff — Retomar: <feature-name>
**Ação pendente:** <description of pending_action>
**Gate atual:** <last_gate>
**Artefatos:** <specs_path>
**Scope:** <scope>

### Estado da execução
- Forge: <completed/pending>
- Tasks concluídas: <count>
- Arquivos modificados: <list>
- Commit proposto: <message>
- Revisão de segurança (Ward): <approve|reject|pendente>
- Revisão de qualidade (Arbiter): <approve|reject|pendente>
- Escolha de revisão do usuário: <parallel|ward|arbiter|skip>

### Instruções para retomada
- <action-specific instructions — see template below>
```

### Step 6 — Output

Emit the resume_prompt as the primary output. Also include the JSON block in a code fence for structured consumption:

````
```json
<session_handoff JSON>
```
````

**Invariant:** The handoff MUST preserve all user choices already made (review path, commit approval). The new session MUST NOT re-ask decisions that are recorded in `context`.

## Resume Prompt Templates by Action

### run_reviews_parallel
```
- O usuário já escolheu "Security + Quality (parallel)". Execute Ward e Arbiter simultaneamente nos arquivos listados acima.
- Após ambos retornarem, apresente os resultados combinados.
- Se ambos aprovarem, prossiga para G6 com o proposed_commit já definido.
```

### run_ward_only
```
- O usuário já escolheu "Security only". Execute Ward nos arquivos listados acima.
- Após retornar, apresente os resultados.
- Se aprovar, prossiga para G6 com o proposed_commit já definido.
```

### run_arbiter_only
```
- O usuário já escolheu "Quality only". Execute Arbiter nos arquivos listados acima.
- Após retornar, apresente os resultados.
- Se aprovar, prossiga para G6 com o proposed_commit já definido.
```

### present_g6_commit_gate
```
- Reviews já concluídos. Apresente G6 (commit gate) usando o proposed_commit acima.
- O usuário deve aprovar o commit antes da execução.
```

### delegate_forge_commit
```
- G6 já aprovado pelo usuário. Delegue Forge para executar o commit com a mensagem acima.
- Após commit, execute post-execution (archive specs, update graphs).
```

### delegate_forge_execute
```
- Specs prontos em <specs_path>. Delegue Forge para executar tasks.md.
- Após execução, apresente G4/G5 (reviews) e G6 (commit).
```

### delegate_forge_quick
```
- Quick scope. Delegue Forge diretamente com os target files identificados.
- Após execução, apresente G6 se houver mudanças a commitar.
```
