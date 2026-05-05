# Guia de Modelos LM Studio para OpenCode

## 📋 Modelos Configurados

Você tem **4 modelos** configurados no OpenCode com LM Studio:

### 1. qwen-coder-7b (Padrão)
**Modelo:** Qwen2.5-Coder-7B-Instruct  
**Score:** 90 | Status: 🟢 Perfect  
**Context:** 32k tokens | **VRAM:** ~78.8%

**Especialidades:**
- ✅ Geração de código (Python, JS, TS, Java, C++, Go, Rust, etc.)
- ✅ Debugging e correção de bugs
- ✅ Refatoração e otimização
- ✅ Explicação de código complexo
- ✅ Testes unitários e integração
- ✅ Code review

**Quando usar:**
```bash
# Comando padrão (usa qwen-coder-7b automaticamente)
opencode "implementa uma função de autenticação JWT"

# Explicitamente
opencode --model lmstudio/qwen-coder-7b "corrige o bug na linha 45"

# Trocar de modelo no meio da conversa
/models
```

**Configuração:**
- Context Length: 16384 (16k tokens)
- Temperature: 0.3 (determinístico)
- Top-P: 0.9
- Max Tokens: 4096
- **Auto-load:** ✅ LM Studio carrega automaticamente via JIT

---

### 2. qwen-general-7b
**Modelo:** Qwen2.5-7B-Instruct  
**Score:** 89 | Status: 🟢 Perfect  
**Context:** 32k tokens | **VRAM:** ~78.8%

**Especialidades:**
- ✅ Conversação geral
- ✅ Planejamento de projetos
- ✅ Análise de requisitos
- ✅ Documentação (README, specs, ADRs)
- ✅ Explicações técnicas detalhadas
- ✅ Multilíngue (PT, EN, ES, FR, DE)

**Quando usar:**
```bash
# Para planejamento e arquitetura
opencode --model qwen-general-7b "cria um plano de migração para microserviços"

# Para documentação
opencode --model qwen-general-7b "escreve um README completo para este projeto"
```

**Configuração:**
- Temperature: 0.7 (mais criativo)
- Top-P: 0.95
- Max Tokens: 4096

---

### 3. qwen-quick-3b
**Modelo:** Qwen2.5-3B-Instruct  
**Score:** 85 | Status: 🟢 Perfect  
**Context:** 32k tokens | **VRAM:** ~56.9%

**Especialidades:**
- ✅ Respostas rápidas (baixa latência)
- ✅ Autocomplete inteligente
- ✅ Snippets de código
- ✅ Sugestões contextuais
- ✅ Refatorações simples

**Quando usar:**
```bash
# Para respostas rápidas
opencode --model qwen-quick-3b "qual a sintaxe de async/await em Python?"

# Para autocomplete
opencode --model qwen-quick-3b "completa esta função de validação de email"
```

**Configuração:**
- Temperature: 0.4
- Top-P: 0.9
- Max Tokens: 2048

---

### 4. mistral-7b
**Modelo:** Mistral-7B-Instruct-v0.3  
**Score:** 89 | Status: 🟢 Perfect  
**Context:** 32k tokens | **VRAM:** ~75.4%

**Especialidades:**
- ✅ Raciocínio lógico forte
- ✅ Análise de problemas complexos
- ✅ Design de APIs REST/GraphQL
- ✅ Arquitetura de sistemas
- ✅ Formato JSON estruturado
- ✅ Multilíngue (excelente em francês e português)

**Quando usar:**
```bash
# Para design de APIs
opencode --model mistral-7b "desenha uma API REST para gerenciamento de usuários"

# Para arquitetura
opencode --model mistral-7b "analisa trade-offs entre SQL e NoSQL para este caso"
```

**Configuração:**
- Temperature: 0.6
- Top-P: 0.92
- Max Tokens: 4096

---

## 🎯 Matriz de Uso Recomendado

| Tarefa | Modelo Primário | Modelo Alternativo |
|--------|-----------------|-------------------|
| **Escrever código** | qwen-coder-7b | qwen-general-7b |
| **Debug de bugs** | qwen-coder-7b | mistral-7b |
| **Refatoração** | qwen-coder-7b | qwen-general-7b |
| **Testes** | qwen-coder-7b | qwen-general-7b |
| **Code Review** | qwen-coder-7b | mistral-7b |
| **Documentação** | qwen-general-7b | mistral-7b |
| **Arquitetura** | mistral-7b | qwen-general-7b |
| **Design de APIs** | mistral-7b | qwen-coder-7b |
| **Autocomplete** | qwen-quick-3b | qwen-coder-7b |
| **Snippets** | qwen-quick-3b | qwen-coder-7b |
| **Planejamento** | qwen-general-7b | mistral-7b |
| **Análise de requisitos** | qwen-general-7b | mistral-7b |

---

## ⚙️ Configuração Automática (JIT) ✅

**CONFIGURADO!** O LM Studio está configurado para:

- **Context Length Padrão: 16384** (16k tokens)
- **Auto-load (JIT): Ativo** - modelos carregam automaticamente quando requisitados
- **TTL: 1 hora** - modelos descarregam após 1h de inatividade

### Como funciona:

1. Você seleciona um modelo no OpenCode: `/models`
2. O OpenCode envia requisição para o modelo
3. O LM Studio detecta e **carrega automaticamente** com 16k de contexto
4. O modelo fica carregado por 1 hora (ou até você trocar de modelo)

**Você NÃO precisa mais:**
- ❌ Carregar modelos manualmente no LM Studio
- ❌ Configurar contexto para cada modelo
- ❌ Se preocupar com VRAM - só 1 modelo carregado por vez

**Isso resolve o erro:**
```
n_keep: 35694 >= n_ctx: 4096  ❌ (antes)
n_keep: 35694 >= n_ctx: 16384 ✅ (agora - parcialmente resolvido)
```

**Nota:** O prompt inicial do OpenCode tem ~35k tokens. Com 16k você consegue trabalhar normalmente, mas se encontrar limites de contexto, use o modelo 3B que suporta 32k.

---

## 🔄 Alternando Entre Modelos

### No OpenCode CLI:

```bash
# Usar modelo específico
opencode --model qwen-coder-7b "sua pergunta"
opencode --model qwen-general-7b "sua pergunta"
opencode --model qwen-quick-3b "sua pergunta"
opencode --model mistral-7b "sua pergunta"

# Usar modelo padrão (qwen-coder-7b)
opencode "sua pergunta"
```

### No LM Studio:

1. Vá em **"My Models"**
2. Clique no modelo que quer usar
3. Clique em **"Load Model"**
4. Configure o **Context Length** para 32768
5. O modelo ficará disponível na API local (http://127.0.0.1:1234/v1)

---

## 📊 Comparação de Performance

| Modelo | Tamanho | VRAM | Tokens/s (est.) | Qualidade Código | Qualidade Texto |
|--------|---------|------|-----------------|------------------|-----------------|
| qwen-coder-7b | 4.7GB | 78.8% | 39.3 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| qwen-general-7b | 4.5GB | 78.8% | 39.3 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| qwen-quick-3b | 2.0GB | 56.9% | 48.5 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| mistral-7b | 4.4GB | 75.4% | 41.3 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Exemplos de Uso

### Exemplo 1: Desenvolvimento de Feature
```bash
# 1. Planejamento (qwen-general-7b)
opencode --model qwen-general-7b "cria um plano para implementar autenticação OAuth2"

# 2. Implementação (qwen-coder-7b - padrão)
opencode "implementa o fluxo de OAuth2 com refresh tokens"

# 3. Testes (qwen-coder-7b)
opencode "cria testes unitários para o módulo de autenticação"

# 4. Documentação (qwen-general-7b)
opencode --model qwen-general-7b "documenta a API de autenticação no README"
```

### Exemplo 2: Debug e Correção
```bash
# 1. Análise do problema (mistral-7b)
opencode --model mistral-7b "analisa o erro de memory leak no arquivo server.js"

# 2. Correção (qwen-coder-7b)
opencode "corrige o memory leak identificado"

# 3. Verificação (qwen-coder-7b)
opencode "adiciona testes para garantir que o leak foi corrigido"
```

### Exemplo 3: Arquitetura
```bash
# 1. Design (mistral-7b)
opencode --model mistral-7b "desenha arquitetura de microserviços para e-commerce"

# 2. Decisões (mistral-7b)
opencode --model mistral-7b "analisa trade-offs entre event sourcing e CRUD tradicional"

# 3. Documentação (qwen-general-7b)
opencode --model qwen-general-7b "cria ADR documentando a decisão de usar event sourcing"
```

---

## 🔧 Troubleshooting

### Erro: "Model not found"
**Solução:** Certifique-se de que o modelo está carregado no LM Studio

### Erro: "Context length exceeded"
**Solução:** No LM Studio, aumente o Context Length para 32768

### Erro: "Connection refused"
**Solução:** Verifique se o LM Studio está rodando e a API local está ativa na porta 1234

### Modelo muito lento
**Solução:** Use o qwen-quick-3b para respostas rápidas

---

## 📝 Notas Finais

- **Modelo padrão:** qwen-coder-7b (melhor para desenvolvimento)
- **Contexto:** Todos os modelos têm 32k tokens (suficiente para arquivos grandes)
- **Quantização:** Q4_K_M (equilíbrio entre qualidade e velocidade)
- **API:** Local via LM Studio (http://127.0.0.1:1234/v1)
- **Privacidade:** 100% local, nenhum dado enviado para nuvem

---

## 🎓 Dicas de Uso

1. **Use qwen-coder-7b** como padrão para desenvolvimento
2. **Alterne para qwen-general-7b** quando precisar de documentação ou planejamento
3. **Use qwen-quick-3b** para snippets rápidos e autocomplete
4. **Use mistral-7b** para decisões arquiteturais complexas
5. **Sempre configure Context Length** para 32768 no LM Studio
6. **Monitore o uso de VRAM** com múltiplos modelos carregados
7. **Reinicie o LM Studio** se encontrar problemas de memória

---

**Última atualização:** 2026-04-05
