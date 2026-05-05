# Coding Guidelines

This document defines the mandatory coding standards, architectural principles, and workflow rules for all AI-assisted and human development.  
These rules must be followed unless explicitly overridden.

---

## 1. Scope

- Primary focus: **Frontend**
- Applies to **personal and professional projects**
- Designed for **AI agents and developers**

---

## 2. Tech Stack

### Language

- **TypeScript (mandatory)**

### Frontend

- **React**
- **Monorepo with Turborepo**

### Testing

- **Vitest**
- Minimum coverage: **70%**

### Lint & Formatting

- **Biome (primary)**
- **ESLint required**
- **Prettier required**

---

## 3. Code Style

### Naming Conventions

- Variables & Functions → `camelCase`
- React Components → `PascalCase`
- Files & Folders → `kebab-case`

### Typing Rules

- Prefer **`type`** over `interface`
- `any` is **allowed only when strictly necessary**
- Always document the reason when using `any`

---

## 4. Architecture

### Core Principles

- **Domain First**
- **React is an adapter, not the foundation**
- **Business logic must not live inside React components**

### Preferred Architecture

- **Feature-Sliced Design (FSD)** as default
- Always **analyze the existing project structure first**
- **Ask before reorganizing folders or enforcing structure**

### Architectural Patterns

- Hexagonal Architecture (Ports & Adapters)
- MVVM with explicit ViewModel
- Application Services on the Frontend
- Domain-Driven Frontend

---

## 5. State Management Philosophy

### Rules

- State must be **React-agnostic**
- React must **consume state**, not **own it**
- Business rules must be **outside UI components**

### Store Strategy

- Prefer **External Store pattern**
- React synchronization via:
  - `useSyncExternalStore`
  - Custom hooks strictly as adapters

### Notes

- Store libraries (e.g., Zustand) are **implementation details**
- The store must be **replaceable**
- Hooks are **not sources of truth**

---

## 6. React Hooks Usage Policy

Hooks must **not** be used as the default abstraction for logic.

### Allowed Usage

Hooks should only be used when:

- A **React lifecycle** is required
- A **subscription to external state** is required
- Integration with **`useSyncExternalStore`**
- UI-specific concerns (DOM, refs, effects strictly related to rendering)

### Disallowed Usage

Do **not** use hooks for:

- Business logic
- Domain rules
- Application services
- State ownership
- General abstractions that can exist in pure TypeScript

### Guideline

If logic can exist outside React, it **must exist outside React**.  
Hooks are **adapters**, not foundations.

---

## 7. Testing

- **Tests are mandatory**
- Always **start implementation with tests**
- Tool: **Vitest**
- Minimum coverage: **70%**
- Prefer:
  - Unit tests for domain logic
  - Integration tests for UI boundaries

---

## 8. Git & Workflow

### Commits

- **Semantic Commits mandatory**
- **Conventional Commits mandatory**

### Pull Requests

- **PR required before merge**
- No direct commits to main branch

### Hooks

- **Husky / Pre-commit required**

---

## 9. Debugging & Logging

- `console.debug` allowed in development
- Remove unnecessary logs before production
- Never log:
  - Tokens
  - Secrets
  - Sensitive user data

---

## 10. Frontend Best Practices

- Hooks must start with `use`
- Avoid logic inside JSX
- Avoid large components
- No business rules inside UI
- Prefer composition over inheritance
- Barrel exports (`index.ts`) unallowed

---

## 11. Code Quality Rules

Avoid:

- Massive functions
- Components with multiple responsibilities
- Business logic in UI
- Side effects in render
- `useEffect` without controlled dependencies
- Tight coupling to libraries

Prefer:

- Pure functions
- Explicit dependencies
- Small composable modules
- Deterministic behavior
- Explicit state transitions

---

## 12. Security

- Never expose secrets
- Never log tokens
- Sanitize inputs
- Never use `eval`
- Avoid dynamic code execution

---

## 13. Documentation

<!-- - Complex logic should include **JSDoc** -->

- Architectural decisions may use **ADR**
- Prefer self-documenting code over excessive comments

---

## 14. Strategic Position

This guideline enforces:

- Core domain in **pure TypeScript**
- State **outside React**
- React as **UI adapter**
- Stable synchronization contracts
- Dependency inversion for stores
- Replaceable frameworks
- Long-term ecosystem resilience

**React is a tool. The domain is the foundation.**
