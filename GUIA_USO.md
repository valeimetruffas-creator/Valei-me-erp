# 📖 Guia de Uso - VALEI-ME Profissional

## 🎯 Primeira Execução

### Setup Inicial
```bash
npm install          # Instalar dependências (já feito)
npm run dev         # Executar em desenvolvimento
npm run build       # Build para produção
```

### Dados Iniciais
- Sistema vem com dados de exemplo nas fichas técnicas
- Adicione suas vendas e compras ao longo do tempo
- Dashboard e Financeiro mostram dados reais armazenados

---

## 📊 Dashboard - Monitoramento do Negócio

### Acessar: Menu → Dashboard

### O Que Você Verá

#### 🟦 KPIs Principais (Topo)
```
┌─────────────────────────────────────────┐
│  📦 Vendas Hoje  │  💰 Receita Hoje    │
│       5 un.      │    R$ 350,00         │
├─────────────────────────────────────────┤
│ 📈 Ticket Médio  │  📦 Prod. Ativos    │
│    R$ 70,00      │        12 un.        │
└─────────────────────────────────────────┘
```

**O que cada um significa:**
- **Vendas Hoje**: Total de transações completadas hoje
- **Receita Hoje**: Faturamento bruto do dia
- **Ticket Médio**: Valor médio por venda (Use para meta de upsell)
- **Produtos Ativos**: Quantidade de produtos disponíveis

---

#### 🟩 Cards de Inventário

```
┌────────────────────┐  ┌────────────────────┐
│ Produtos Ativos    │  │ Produtos Inativos  │
│    10 un.          │  │      2 un.         │
│ prontos para venda │  │   desativados      │
└────────────────────┘  └────────────────────┘
```

**Ação**: Se muitos inativos, considere:
- Desativar por falta de ingredientes?
- Relançar com preço especial?

---

#### 📈 Gráfico de Receita (7 dias)

```
Mostra tendência de vendas:
- 📈 Crescimento: Aumentar marketing
- 📉 Queda: Verificar problemas
- 📊 Estável: Manter estratégia
```

**Leitura**: Clique no gráfico para detalhes

---

#### 🍰 Lucro por Categoria (Pizza)

```
Distribuição visual:
- 🥛 BASE: Preparações básicas
- 🍓 RECHEIO: Recheios e coberturas
- 🧁 MONTAGEM: Produtos finais

Maior fatia = Maior lucratividade
```

**Ação**: Aumentar preço de categorias pequenas

---

#### 💡 Dicas de Gestão

```
Três cards informativos com sugestões:
1. Monitore ticket médio (meta > R$15)
2. Status de produtos (ativos vs inativos)
3. Metas diárias
```

---

## 💰 Gestão Financeira - Fluxo de Caixa

### Acessar: Menu → Financeiro

### Filtros de Período

```
┌──────────────┬──────────────┬──────────────┐
│    Hoje      │    Semana    │     Mês      │
└──────────────┴──────────────┴──────────────┘
```

**Selecione um período para filtrar os dados**

---

### Resumo Financeiro (4 Cards)

#### 🟢 Saldo em Caixa
```
R$ 1.250,00

= Receita Total - Despesas
Deve ser sempre positivo!
```

---

#### 🟢 Receita
```
R$ 3.500,00

Σ de todas as vendas do período
(valores entrada em caixa)
```

---

#### 🔴 Despesas
```
R$ 2.250,00

Σ de todas as compras de insumos
(valores saída de caixa)
```

---

#### 📊 Lucro Líquido
```
R$ 1.250,00

Receita - Despesas
Se positivo 🟢, negócio é viável
Se negativo 🔴, revisar custos
```

---

### Gráfico de Fluxo (Barras)

```
Entradas (🟢 verde) vs Saídas (🔴 vermelho) por dia

   R$
   │     🟢┐
   │     🟢│  🔴
   │ 🔴 🟢│  🔴
   └─────────────── Dias
```

**Leitura**: 
- Entradas > Saídas = Lucro (bom!)
- Saídas > Entradas = Prejuízo (problema!)

---

### Tabela de Transações

```
┌──────────┬────────┬─────────────────────┬─────────────┐
│   Data   │  Tipo  │    Descrição        │    Valor    │
├──────────┼────────┼─────────────────────┼─────────────┤
│ 26/01/26 │ Entrada│ Venda               │ +R$  150,00 │
│ 25/01/26 │ Saída  │ Compra de insumos   │ -R$  200,00 │
│ 25/01/26 │ Entrada│ Venda               │ +R$   85,50 │
└──────────┴────────┴─────────────────────┴─────────────┘
```

**Cores**:
- 🟢 Verde = Entrada (ganho)
- 🔴 Vermelho = Saída (gasto)
- Valores mostram +/- para clareza

---

## 🍰 Fichas Técnicas - Receitas

### Acessar: Menu → Ficha Técnica

### Navegação por Níveis

```
┌─ 🥛 BASE ──────────────────┐
│ Preparações básicas        │
│ - Massa básica             │
│ - Calda de açúcar          │
│ - Cobertura padrão         │
└────────────────────────────┘

┌─ 🍓 RECHEIO ────────────────┐
│ Preparações intermediárias  │
│ - Chocolate ganache         │
│ - Brigadeiro               │
│ - Mousse de morango        │
└────────────────────────────┘

┌─ 🧁 MONTAGEM ───────────────┐
│ Produtos finais             │
│ - Bolo de Chocolate         │
│ - Cupcake Morango           │
│ - Torta de Nozes            │
└────────────────────────────┘
```

**Use botões no topo para filtrar**

---

### Visualizar Ficha

```
Ficha: Bolo de Chocolate 🧁
├─ Categoria: MONTAGEM
├─ Rendimento: 2 bolos
├─ Insumos:
│  ├─ Farinha: 500g
│  ├─ Açúcar: 200g
│  ├─ Ovos: 6 un.
│  └─ Chocolate: 200g
├─ Preparações:
│  ├─ Massa (BASE): 1 un.
│  ├─ Ganache (RECHEIO): 1 un.
│  └─ Cobertura (RECHEIO): 1 un.
├─ Custo Total: R$ 64,80
├─ Custo Unitário: R$ 32,40
├─ Preço Venda: R$ 80,00
└─ Margem: 59,5% ✅
```

**Cores dos ícones**:
- 🧂 INSUMO (branco/cinza)
- 🥛 BASE (azul claro)
- 🍓 RECHEIO (vermelho)

---

### Editar Ficha

**Clique em "Editar" para:**

1. **Adicionar Ingredientes**
   - Selecione tipo (insumo/base/recheio)
   - Escolha o item na lista
   - Especifique quantidade
   - Clique "Adicionar"

2. **Remover Ingredientes**
   - Clique no X ao lado do item
   - Sistema recalcula custo

3. **Atualizar Quantidades**
   - Mude valor e pressione Enter
   - Custo atualiza automaticamente

---

## 📦 Gerenciar Produtos

### Acessar: Menu → Estoque ou Produtos

### Campo "Ativo" (Novo!)

```
Cada produto tem flag ativo:
✅ Ativo   = Disponível para venda
❌ Inativo = Indisponível (sem estoque? retirado?)
```

**Dashboard usa este campo para contar**:
- Produtos Ativos: ✅ (disponíveis)
- Produtos Inativos: ❌ (não disponíveis)

---

## 🎨 Dicas de Design

### Cores do Sistema
- 🟫 **Marrom (#784E23)**: Tema principal (chocolate)
- 🟨 **Dourado (#D4A574)**: Destaque
- 🟢 **Verde**: Valores positivos/sucesso
- 🔴 **Vermelho**: Valores negativos/alerta
- ⚪ **Bege**: Fundo claro

### Responsividade
- 📱 **Celular**: Cards empilhados
- 📱 **Tablet**: 2 colunas
- 🖥️ **Desktop**: 3-4 colunas

---

## ⚙️ Manutenção

### Backup de Dados
Os dados são salvos automaticamente no navegador (localStorage).

**Para exportar:**
```javascript
// Abra console (F12)
localStorage.getItem('confeitaria-store')
// Copie o JSON para um arquivo
```

### Resetar Sistema
```javascript
// Abra console (F12)
localStorage.removeItem('confeitaria-store')
// Recarregue a página
```

---

## 🐛 Troubleshooting

### "Dashboard não atualiza"
1. Verifique se registrou venda em vendas
2. Recarregue a página (F5)
3. Verifique localStorage (F12 → Application)

### "Não consigo adicionar ingrediente"
1. Verifique categoria (BASE só aceita insumos)
2. Verifique se item existe no sistema
3. Tente novamente com outro item

### "Valores errados no cálculo"
1. Verifique se preço/custo está preenchido
2. Use . para decimal (não ,)
3. Clique Salvar após editar

---

## 📞 Suporte

Documentação técnica: [SISTEMA_PROFISSIONAL.md](SISTEMA_PROFISSIONAL.md)
Estrutura do código: Veja pasta `src/`

---

**Versão**: 2.0 Profissional
**Última atualização**: 26/01/2026
**Status**: ✅ Operacional
