# 🎯 Guia Rápido - Exemplos Práticos de Uso

## Exemplo 1: Adicionar um Bolo Simples

**Passo a passo** (takes ~2 min):

```
1. Abra a aba "Produtos" no menu
2. Clique em "+ Novo Produto" (botão azul)
3. Preencha:
   - Nome: "Bolo de Chocolate 500g"
   - Categoria: "Bolos" (ou crie nova)
   - Preço de Venda: 45.00
   - Estoque Mínimo: 2
   - Descrição: "Bolo caseiro de chocolate com calda"
4. Clique "Salvar"
5. Na grade, clique "Vincular Ficha" no produto
6. Selecione "Bolo de Chocolate" (sua receita)
7. Pronto! O custo aparece automaticamente
```

**Resultado visível**:
- ✅ Produto aparece na grade com foto/placeholder
- ✅ Preço: R$ 45,00 (verde, destacado)
- ✅ Custo: R$ 15,00 (puxado da Ficha)
- ✅ Margem: 67% (calculado automaticamente)
- ✅ Status: Ativo (badge verde)

---

## Exemplo 2: Gerenciar Múltiplos Preços para Mesma Receita

**Cenário**: Você faz "Brigadeiro" em 3 tamanhos

```
1. Crie 3 Produtos:

   Produto A: "Brigadeiro Pequeno"
   - Categoria: "Doces"
   - Preço: R$ 12,00
   - Vincular → Ficha "Brigadeiro" (custo R$ 4,00)
   - Resultado: 67% de margem

   Produto B: "Brigadeiro Médio"
   - Categoria: "Doces"
   - Preço: R$ 20,00
   - Vincular → Ficha "Brigadeiro" (custo R$ 4,00)
   - Resultado: 80% de margem

   Produto C: "Brigadeiro Grande"
   - Categoria: "Doces"
   - Preço: R$ 28,00
   - Vincular → Ficha "Brigadeiro" (custo R$ 4,00)
   - Resultado: 86% de margem
```

**Benefício**: Uma ficha, múltiplos produtos, preços diferentes!

---

## Exemplo 3: Produto sem Ficha Vinculada

**Cenário**: Você compra de terceiros

```
1. "+ Novo Produto"
2. Nome: "Sorvete Artesanal Italiano"
3. Categoria: "Sorvetes"
4. Preço: R$ 35,00
5. Salvar
6. NÃO vincule ficha (deixe em branco)
7. Pronto! Produto criado sem custo automático
   - Custo = vazio
   - Margem = não calculada
   - Você controla apenas o preço
```

---

## Exemplo 4: Ativar/Desativar Rápido

**Cenário**: Faltou chocolate, temporariamente fora do menu

```
Antes:
- "Bolo de Chocolate" aparece no PDV
- Clientes podem encomendar

Depois:
1. Clique "Desativar" no Bolo de Chocolate
   → Botão muda para "Ativar"
   → Badge muda para "Inativo" (vermelho)
   → SEM recarregar a página!

2. Abra a aba "Dashboard"
   → "Produtos Inativos: 1" (atualiza automaticamente)

3. Abra o PDV (Ponto de Venda)
   → Bolo de Chocolate NÃO aparece na lista

Quando chocolate chega de novo:
1. Clique "Ativar" no Bolo
2. PDV mostra novamente em segundos
```

---

## Exemplo 5: Atualizar Preço de Custo

**Cenário**: Ingredientes ficaram mais caros, ficha foi atualizada

```
Antes:
- Produto: "Brigadeiro" - Preço: R$ 15,00
- Custo: R$ 4,00 (da Ficha)
- Margem: 73%

Você atualiza Ficha Técnica:
- Novo custo: R$ 6,00 (ingredientes subiram 50%)

No Produto:
1. Clique "Atualizar Custo"
2. Sistema lê novo custo da Ficha: R$ 6,00
3. Recalcula margem: (15 - 6) / 15 = 60% (piorou!)

Agora você vê que precisa aumentar preço.
Clique "Editar" e mude para R$ 20,00
Nova margem: 70% (melhor!)
```

**Fluxo de Ação**:
- Ficha atualiza → "Atualizar Custo" → Margem ajusta → Editar preço se necessário

---

## Exemplo 6: Pesquisar e Filtrar

**Cenário**: Você tem 50 produtos, quer achar rápido

```
Filtro 1: Pesquisar por Nome
- Digite "Bolo" na barra de pesquisa
- Resultado: Mostra apenas produtos com "Bolo"
  ✅ Bolo de Chocolate
  ✅ Bolo de Cenoura
  ✅ Bolo Red Velvet
  ✅ Bolo Brigadeiro

Filtro 2: Filtro por Categoria
- Clique dropdown "Categoria"
- Selecione "Bolos"
- Resultado: Apenas produtos categoria "Bolos"

Filtro 3: Filtro por Status
- Clique dropdown "Status"
- Selecione "Apenas Ativos"
- Resultado: Esconde produtos desativados

Combinado:
- Digite "Chocolate" (pesquisa)
- Selecione "Bolos" (categoria)
- Selecione "Apenas Ativos" (status)
- Resultado: ✅ Bolo de Chocolate (ativo, na categoria Bolos, com "Chocolate" no nome)
```

---

## Exemplo 7: Editar Informações de Produto

**Cenário**: Descobriu um erro na descrição

```
Antes:
- Produto: "Pavê Tradiconal" (erro de digitação)
- Descrição: "Com leite de vaca"
- Preço: R$ 18,00

Ação:
1. Na grade, clique "Editar" (ícone de lápis)
2. Modal abre com formulário preenchido
3. Corrija:
   - Nome: "Pavê Tradicional" ✓
   - Descrição: "Com leite condensado" ✓
   - Preço: deixe igual
4. Clique "Salvar Alterações"
5. Modal fecha, grid atualiza

Depois:
- Produto corrigido aparece na grade
- Dashboard não afetado
- Histórico de vendas continua OK
```

---

## Exemplo 8: Deletar Produto

**Cenário**: Parou de fazer um produto

```
Ação:
1. Na grade, procure "Produto Descontinuado"
2. Clique "Deletar" (ícone de lixeira)
3. Confirme: "Tem certeza que deseja deletar?"
4. Clique "OK"

Resultado:
✅ Produto removido da grade
✅ Não aparece mais no PDV
✅ Histórico de vendas passadas mantido
✅ Pode recriar depois se quiser

⚠️ Alternativa melhor: Usar "Desativar" se pode voltar a fazer
   (Desativado é reversível, deletado é permanente)
```

---

## Exemplo 9: Dashboard Atualiza em Tempo Real

**Cenário**: Verificar impacto de ativações/desativações

```
Ação:
1. Abra "Produtos" no menu
2. Abra "Dashboard" em outra aba (Ctrl+Click)
3. No Dashboard, veja:
   - "Produtos Ativos: 23"
   - "Produtos Inativos: 2"

De volta em "Produtos":
1. Desative 3 produtos
2. Mude para aba "Dashboard"
3. Veja atualizar em TEMPO REAL:
   - "Produtos Ativos: 20" (diminuiu)
   - "Produtos Inativos: 5" (aumentou)

Sem recarregar a página!
```

---

## Exemplo 10: Scenario Completo - Dia de Trabalho

```
MANHÃ: Preparação
────────────────
1. Abra "Produtos"
2. Procure "Brigadeiro" (pesquisa)
3. Clique "Atualizar Custo" (ingredientes mudaram)
4. Veja margem: 45% (ficou baixa!)
5. Clique "Editar", mude preço de R$ 18 para R$ 25
6. Salvar
7. Margem agora: 65% (melhor!)

TARDE: Vendas
─────────────
8. Abra "PDV" (Ponto de Venda)
9. "Brigadeiro" aparece no catálogo com novo preço
10. Venda 10 unidades
11. Dashboard atualiza automaticamente

NOITE: Análise
──────────────
12. Abra "Financeiro"
13. Veja "Brigadeiro" como produto mais vendido hoje
14. Receita: R$ 250 (10 × R$ 25)
15. Custo: R$ 55 (10 × R$ 5,50)
16. Lucro: R$ 195 ✅
```

---

## 💡 Dicas Profissionais

### Dica 1: Use Categorias Padronizadas
```
❌ Evite:
- "bolo"
- "Bolo"
- "BOLO"
- "Bolos Diversos"

✅ Prefira:
- "Bolos"
- "Doces"
- "Bebidas"
- "Salgados"

Resultado: Filtros funcionam melhor
```

### Dica 2: Preços com Margens Consistentes
```
Exemplo de Estratégia:
- Produto com alto custo → Margem 40%
- Produto com baixo custo → Margem 70%

Use "Vincular Ficha" para ver custo automático
Clique "Editar" para ajustar preço conforme margem desejada
```

### Dica 3: Ative Apenas o que Você Faz Hoje
```
Cenário: Você faz "Bolo de Chocolate" 3x por semana
- Segunda-Ativa: "Bolo de Chocolate"
- Terça-Desativa (faltou chocolate)
- Quarta-Ativa
- Quinta-Desativa
- Sexta-Ativa
- Fim de semana-Desativa

PDV mostra apenas o que está disponível!
```

### Dica 4: Foto é Importante
```
Adicione fotos aos produtos para:
✅ Visual melhor na aba Produtos
✅ Futura integração com site/catálogo online
✅ Clientes reconhecem o produto
```

### Dica 5: Estoque Mínimo
```
Configure para lembrar quando precisa fazer mais:
- "Brigadeiro": Estoque mínimo = 20 unidades
- "Bolo Grande": Estoque mínimo = 5 unidades

Futura funcionalidade: Alerta automático
```

---

## 🆘 Problemas Comuns & Soluções

### Problema: Produto não aparece no PDV
```
Causa: Status está "Inativo"
Solução: 
1. Abra "Produtos"
2. Clique "Ativar" no produto
3. Volte para PDV (página de Vendas)
```

### Problema: Custo não atualizou
```
Causa: Ficha foi alterada, mas você não clicou "Atualizar Custo"
Solução:
1. Na grade de Produtos
2. Clique "Atualizar Custo"
3. Novo custo será puxado da Ficha
```

### Problema: Margem de lucro errada
```
Causa: Custo ou preço está errado
Solução:
1. Clique "Editar"
2. Verifique "Preço de Venda"
3. Se tem Ficha, clique "Atualizar Custo"
4. Margem = (Preço - Custo) / Preço × 100%
```

### Problema: Não consigo deletar
```
Provável causa: Já tem vendas (segurança)
Solução: Use "Desativar" em vez de deletar
Resultado: Produto fica invisível mas histórico mantido
```

---

## 📊 Métricas que Você Pode Acompanhar

```
Via Produtos:
✅ Quantidade de produtos criados
✅ Porcentagem ativos vs inativos
✅ Margens de lucro por produto
✅ Custos de produção por produto

Via Dashboard:
✅ Produtos Ativos (card atualiza em tempo real)
✅ Produtos Inativos (card atualiza em tempo real)

Via Financeiro:
✅ Receita por produto
✅ Lucro por produto
✅ Produtos mais vendidos
```

---

**Sistema**: VALEI-ME Confeitaria  
**Página**: Produtos (Catálogo de Venda)  
**Último Update**: 26/01/2026
