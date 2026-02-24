# 📋 Análise de Duplicidades - Services

## 🔴 DUPLICIDADES IDENTIFICADAS

### 1. **VENDAS** - 2 arquivos conflitantes
| Arquivo | Status | Descrição | Em Uso |
|---------|--------|-----------|--------|
| `vendaService.ts` | ✅ **ATIVO** | Novo, modernizado, class com operação atômica | **SIM** - VendaService.registrarVendaCompleta() |
| `vendasService.ts` | ❌ **OBSOLETO** | Antigo, funções simples, quebrado | **NÃO** |

**Análise:**
- `vendaService.ts`: Usa Zustand stores, Firebase, operação atômica
- `vendasService.ts`: Usa localStorage obsoleto, lógica de fichasService antiga
- **Ação:** REMOVER vendasService.ts

---

### 2. **ESTOQUE - INSUMOS** - 2 arquivos, 1 obsoleto
| Arquivo | Status | Descrição | Em Uso |
|---------|--------|-----------|--------|
| `estoqueService.ts` | ✅ **ATIVO** | Core de estoque de insumos | **SIM** - importado por estoqueBaseService.ts, fichaTecnicaService.ts |
| `estoqueInsumosService.ts` | ⚠️ **VAZIO** | Apenas stub/placeholder | **NÃO** |

**Análise:**
- `estoqueInsumosService.ts` contém apenas funções vazias/placeholder
- Não há nenhuma lógica real
- **Ação:** REMOVER estoqueInsumosService.ts

---

### 3. **ESTOQUE - BASES** - 1 arquivo ativo
| Arquivo | Status | Descrição | Em Uso |
|---------|--------|-----------|--------|
| `estoqueBaseService.ts` | ✅ **ATIVO** | Gerencia estoque de bases | **SIM** - importado por ProducaoBase.tsx |

---

### 4. **ESTOQUE - RECHEIOS** - 1 arquivo, parece incompleto
| Arquivo | Status | Descrição | Em Uso |
|---------|--------|-----------|--------|
| `estoqueRecheioService.ts` | ⚠️ **INCOMPLETO** | Gerencia estoque de recheios | **?** - precisa verificar |

---

## 📊 RESUMO DE AÇÕES

| # | Arquivo | Ação | Motivo |
|---|---------|------|--------|
| 1 | `vendasService.ts` | **DELETAR** | Obsoleto, substituído por vendaService.ts |
| 2 | `estoqueInsumosService.ts` | **DELETAR** | Vazio, nunca usado, lógica em estoqueService.ts |

---

## ✅ ARQUIVOS QUE FUNCIONAM

### Services Mantidos:
- ✅ `compraService.ts` - Orquestrador de compras (novo, modernizado)
- ✅ `vendaService.ts` - Orquestrador de vendas (novo, modernizado)
- ✅ `estoqueService.ts` - Core de estoque de insumos
- ✅ `estoqueBaseService.ts` - Estoque de bases
- ✅ `estoqueRecheioService.ts` - Estoque de recheios (verificar uso)

---

## 🔗 Referências de Uso

```
vendaService.ts → ARQUITETURA_NOVA.md menciona VendaService.registrarVendaCompleta()
FinanceiroIntegration.ts → Refere @deprecated VendaService
estoqueBaseService.ts → Importado por ProducaoBase.tsx
estoqueService.ts → Importado por estoqueBaseService.ts, fichaTecnicaService.ts
```
