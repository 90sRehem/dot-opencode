# Referência Rápida - Modelos LM Studio

## 🚀 Uso Rápido

```bash
# Modelo padrão (qwen-coder-7b)
opencode "sua pergunta"

# Escolher modelo específico
opencode --model qwen-coder-7b "escrever código"
opencode --model qwen-general-7b "documentação"
opencode --model qwen-quick-3b "resposta rápida"
opencode --model mistral-7b "arquitetura"
```

## 📋 Quando usar cada modelo?

### 🎯 qwen-coder-7b (PADRÃO)
**Use para:** Código, debugging, refatoração, testes, code review
```bash
opencode "implementa uma API REST com Express"
opencode "corrige o bug na função de validação"
opencode "refatora este código para usar async/await"
```

### 📝 qwen-general-7b
**Use para:** Documentação, planejamento, arquitetura, análise
```bash
opencode --model qwen-general-7b "escreve README para este projeto"
opencode --model qwen-general-7b "cria plano de migração"
opencode --model qwen-general-7b "analisa os requisitos"
```

### ⚡ qwen-quick-3b
**Use para:** Snippets, autocomplete, respostas rápidas
```bash
opencode --model qwen-quick-3b "sintaxe de map em JavaScript"
opencode --model qwen-quick-3b "snippet de validação de email"
opencode --model qwen-quick-3b "completa esta função"
```

### 🏗️ mistral-7b
**Use para:** APIs, problemas complexos, decisões arquiteturais
```bash
opencode --model mistral-7b "desenha API REST para usuarios"
opencode --model mistral-7b "analisa SQL vs NoSQL"
opencode --model mistral-7b "trade-offs de microserviços"
```

## ⚙️ CONFIGURAÇÃO AUTOMÁTICA ✅

**Já configurado! O LM Studio carrega automaticamente:**

- Context Length: **16384** (16k tokens)
- Auto-load (JIT): **Ativo**
- TTL: **1 hora** de inatividade

**Como usar:**
1. Abra OpenCode: `opencode`
2. Troque de modelo: `/models`
3. O LM Studio carrega automaticamente!

**Nada mais para fazer!** 🎉

## 📊 Tabela Rápida

| Tarefa | Use |
|--------|-----|
| Código | qwen-coder-7b |
| Debug | qwen-coder-7b |
| Testes | qwen-coder-7b |
| Docs | qwen-general-7b |
| Planejamento | qwen-general-7b |
| Snippets | qwen-quick-3b |
| APIs | mistral-7b |
| Arquitetura | mistral-7b |

## 🔧 Troubleshooting

**Erro "Context length exceeded":**
→ Configure Context Length = 32768 no LM Studio

**Erro "Model not found":**
→ Carregue o modelo no LM Studio primeiro

**Erro "Connection refused":**
→ Verifique se LM Studio está rodando (porta 1234)

---

**Para mais detalhes:** veja `lmstudio-models-guide.md`
