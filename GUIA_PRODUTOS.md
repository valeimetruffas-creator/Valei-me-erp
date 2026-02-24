# 📦 Guia de Uso - Página de Produtos

## Visão Geral

A página **Produtos** é um catálogo profissional de produtos prontos para venda, completamente **separado e independente** da seção de Fichas Técnicas (produção).

### Localização
- **Menu Lateral**: Clique em "Produtos" ou use o ícone de caixa (📦)
- **URL**: `/produtos`
- **Permissão**: Acessível para todos os usuários

---

## 🎯 Funcionalidades Principais

### 1. **Visualizar Catálogo de Produtos**
Todos os produtos criados são exibidos em uma **grade responsiva** com informações:
- **Foto** (ou ícone padrão se não definida)
- **Nome** do produto
- **Descrição** (breve)
- **Preço de Venda** (em verde, destaque)
- **Custo** (puxado da Ficha Técnica, se vinculada)
- **Margem de Lucro** (percentual calculado)
- **Status** (Ativo/Inativo - badge colorida)
- **Categoria** (badge de categoria)

### 2. **Criar Novo Produto**
1. Clique no botão azul **"+ Novo Produto"** no topo
2. Preencha os campos:
   - **Nome**: Identificação do produto (obrigatório)
   - **Categoria**: Escolha uma categoria existente ou crie uma nova
   - **Preço de Venda**: R$ (obrigatório - será usado para calcular margem)
   - **Estoque Mínimo**: Quantidade mínima recomendada (opcional)
   - **Descrição**: Detalhes curtos sobre o produto (opcional)
3. Clique **"Salvar"**

### 3. **Editar Produto**
1. Na grade de produtos, clique no botão **"Editar"** (lápis) do produto
2. Modifique os campos desejados
3. Clique **"Salvar Alterações"**

> **Dica**: Ao editar, qualquer campo pode ser alterado, incluindo preço e categoria

### 4. **Gerenciar Status (Ativo/Inativo)**
1. Clique no botão **"Ativar"** ou **"Desativar"** (interruptor)
2. O status muda **instantaneamente** sem recarregar a página
3. Produtos inativos **não aparecem** em vendas

> **Efeito em Tempo Real**: O Dashboard atualiza automaticamente contando produtos ativos/inativos

### 5. **Vincular Produto a Ficha Técnica**
As Fichas Técnicas contêm a receita (ingredientes, modo de fazer, custo de produção).

1. Clique no botão **"Vincular Ficha"** no produto
2. Um modal abre mostrando todas as Fichas Técnicas disponíveis
3. Cada ficha mostra seu **Custo Unitário**
4. Clique na ficha desejada para vincular
5. Automaticamente:
   - `custoFicha` = Custo da Ficha Técnica
   - `margemLucro` = (Preço Venda - Custo) / Preço Venda × 100%

> **Exemplo**:
> - Ficha "Bolo de Chocolate" custa R$ 15,00
> - Você vende por R$ 35,00
> - Margem = (35 - 15) / 35 = 57% (excelente!)

### 6. **Atualizar Custo (Sincronizar com Ficha)**
Se a Ficha Técnica for alterada (ingredientes mudam), o custo muda.

1. Clique **"Atualizar Custo"** no produto
2. O sistema busca o novo custo da Ficha Técnica vinculada
3. A margem de lucro é **recalculada automaticamente**

> **Sem impacto no preço**: O preço de venda NÃO muda automaticamente

### 7. **Deletar Produto**
1. Clique no botão **"Deletar"** (lixeira) do produto
2. Confirme a exclusão
3. O produto é removido permanentemente do catálogo

---

## 🔍 **Filtrar e Pesquisar Produtos**

### Pesquisa por Nome
- **Campo**: "Pesquisar por nome..."
- **Funciona**: Em tempo real, filtra enquanto você digita
- **Exemplo**: Digitar "Bolo" mostra apenas produtos com "Bolo" no nome

### Filtro por Categoria
- **Dropdown**: Mostra categorias de produtos criados
- **Exemplo**: Selecionar "Bolos" mostra apenas produtos dessa categoria
- **Auto-preenchido**: Categorias são criadas automaticamente ao adicionar produtos

### Filtro por Status
- **Todos**: Mostra produtos ativos E inativos
- **Apenas Ativos**: Mostra apenas produtos com status "Ativo"
- **Apenas Inativos**: Mostra apenas produtos desativados

> **Combinável**: Use pesquisa + categoria + status juntos!

---

## 📊 **Integração com Ficha Técnica**

### Relacionamento: UMA DIREÇÃO
```
Ficha Técnica (Receita de Produção)
        ↓ (opcional)
   Produto (Venda)
```

- **Produtos podem vincular a Fichas**: 1 produto pode usar 1 ficha
- **Fichas são independentes**: 1 ficha pode ter múltiplos produtos
- **Vincular é opcional**: Produto sem ficha = sem custo automático
- **Sem restrições de produto**: Deletar produto NÃO afeta ficha

### Dados que Sincronizam
| Campo | Origem | Auto-Atualiza? |
|-------|--------|---|
| `fichaId` | Você escolhe | Manual |
| `custoFicha` | Ficha Técnica | Ao clicar "Atualizar Custo" |
| `margemLucro` | Cálculo automático | Quando vincular ou atualizar |
| `precoVenda` | Você define | Manual |

---

## 💡 **Casos de Uso Comuns**

### Cenário 1: Novo Produto Simples
```
1. Clique "Novo Produto"
2. Nome: "Brigadeiro Tradicional"
3. Categoria: "Doces"
4. Preço: R$ 12,00
5. Salvar
6. Após criar, clique "Vincular Ficha" e escolha "Brigadeiro Tradicional"
```

### Cenário 2: Produto com Múltiplas Variações
```
Ficha Técnica: "Bolo de Chocolate"
├── Produto: Bolo Pequeno (R$ 25,00)  [mesma ficha]
├── Produto: Bolo Médio (R$ 45,00)    [mesma ficha]
└── Produto: Bolo Grande (R$ 65,00)   [mesma ficha]

→ Todos compartilham o custo da ficha, mas preços diferentes
→ Margens calculadas individualizadamente
```

### Cenário 3: Produto sem Ficha Vinculada
```
Produto: "Produto Comprado de Terceiros"
→ custoFicha = vazio (ou 0)
→ margemLucro = vazio (ou N/A)
→ Você ainda controla o preço manualmente
```

---

## ⚙️ **Estrutura de Dados**

Cada produto armazena:

```typescript
{
  id: string;                    // ID único gerado automaticamente
  nome: string;                  // Nome do produto
  descricao?: string;            // Descrição curta
  categoria: string;             // Categoria (ex: "Bolos")
  precoVenda: number;            // Preço cobrado do cliente
  foto?: string;                 // URL ou base64 da imagem
  ativo: boolean;                // true = visível nas vendas
  fichaTecnicaId?: string;       // ID da Ficha vinculada
  custoFicha?: number;           // Custo puxado da Ficha
  margemLucro?: number;          // Percentual de lucro (0-100)
  estoqueMinimo?: number;        // Estoque mínimo recomendado
  dataCriacao?: string;          // Data de criação (ISO)
}
```

---

## 🎨 **Interface Visual**

### Cores Usadas
| Elemento | Cor | Significado |
|----------|-----|---|
| Preço | 🟢 Verde | Receita positiva |
| Custo | 🟨 Ouro | Valor de produção |
| Ativo | 🟢 Verde | Disponível para venda |
| Inativo | 🔴 Vermelho | Não disponível |
| Cabeçalho | 🟤 Marrom | Tema principal |
| Botões | 🟦 Azul | Ações positivas |

### Responsividade
- **Celular**: 1 coluna
- **Tablet**: 2 colunas
- **Desktop pequeno**: 3 colunas
- **Desktop grande**: 4 colunas

---

## ❓ **Perguntas Frequentes**

### P: Posso usar o mesmo produto em múltiplas vendas?
**R**: Sim! Produtos são criados uma vez e usados em múltiplas transações.

### P: O que acontece se eu deletar uma Ficha Técnica?
**R**: Produtos vinculados têm o link removido automaticamente, mas não são deletados.

### P: Posso vender um produto com preço diferente por venda?
**R**: Sim! Use a funcionalidade de desconto nas Vendas (página de Vendas/PDV).

### P: Como faço para ocultarProduto temporariamente?
**R**: Clique "Desativar" - fica invisível mas continua no sistema. Clique "Ativar" para restaurar.

### P: Posso importar produtos de um arquivo?
**R**: Atualmente, produtos são adicionados um a um. Importação em massa é plano futuro.

### P: Onde vejo o histórico de vendas por produto?
**R**: Na página Financeiro → Relatório de Vendas (filtrado por produto).

---

## 🔗 **Integração com Outras Abas**

| Aba | Integração |
|-----|---|
| **Dashboard** | Conta produtos ativos/inativos em tempo real |
| **Vendas** | Lista produtos para seleção em transações |
| **Ficha Técnica** | Base para cálculo de custo |
| **Financeiro** | Rastreia receita por produto |
| **Estoque** | Controle futuro de stock de produtos |

---

## 📝 **Dicas Profissionais**

1. **Categorize bem**: Use categorias padronizadas para fácil filtragem
2. **Preços consistentes**: Mantenha margens similares entre produtos
3. **Fotos claras**: Adicione fotos de produtos para melhor visual
4. **Estoque mínimo**: Configure para alertar quando falta material
5. **Vincule fichas**: Sempre que possível, vincule a Ficha para rastreamento de custo

---

## 🚀 **Próximas Melhorias Planejadas**

- [ ] Importação de produtos em lote (CSV/Excel)
- [ ] Upload de fotos integrado
- [ ] Integração com site/catálogo online
- [ ] Histórico de preços
- [ ] Combos/Kits de produtos
- [ ] Variações de produto (tamanho, cor, etc)
- [ ] Alertas de estoque mínimo

---

**Última atualização**: 26/01/2026  
**Versão**: 2.0 Professional  
**Sistema**: VALEI-ME Confeitaria
