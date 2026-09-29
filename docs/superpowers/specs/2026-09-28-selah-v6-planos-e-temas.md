# Selah v6: mais planos e mais temas

Complemento das specs anteriores. Data: 2026-09-28.

**Estado:** decisões tomadas pelo implementador, a quem o dono do projeto delegou os detalhes. A curadoria (versículos e textos) deve ser revisada pelo dono antes do lançamento, como já previsto na §11 da spec original.

## Planos

São 5 planos novos, 9 no total. Na tela Planos, eles ficam em três grupos:

| Grupo | Plano | Dias | Ritmo |
|---|---|---|---|
| **Para começar** | João em 21 dias (`john-21`) | 21 | 1 capítulo por dia |
| | Provérbios em 31 dias (`proverbs-31`) | 31 | 1 capítulo por dia, um para cada dia do mês |
| | Salmos em 30 dias (`psalms-30`) | 30 | 5 salmos por dia |
| **Para aprofundar** | Evangelhos em 30 dias (já existe) | 30 | |
| | Cartas de Paulo em 30 dias (`paul-30`) | 30 | de Romanos a Filemom, 87 capítulos, 3 ou 2 por dia |
| | Salmos e Provérbios em 31 dias (já existe) | 31 | |
| | Novo Testamento em 90 dias (já existe) | 90 | |
| **A Bíblia inteira** | Bíblia em 1 ano (já existe) | 365 | |
| | Bíblia em 2 anos (`bible-2y`) | 730 | 1 ou 2 capítulos por dia |

- Os títulos dos grupos são cabeçalhos de seção (h2) e os planos passam a h3.
- Os ids antigos não mudam. Assim, o plano ativo salvo e os backups continuam valendo.

## Temas de versículos

São 6 temas novos, 16 no total, cada um com 8 versículos:

| Tema | Ícone |
|---|---|
| Paz / Peace | folha |
| Fé / Faith | âncora |
| Solidão / Loneliness | lua |
| Família / Family | casa |
| Sabedoria para decidir / Wisdom for decisions | bússola |
| Cansaço / Weariness | pena |

- Os versículos novos não repetem os que já estão em outros temas.
- O teste de conteúdo confere que cada versículo existe nas duas traduções.
- O teste passa a aceitar 16 temas.

## Testes

- **Catálogo:**
  - Cada plano novo cobre exatamente os capítulos esperados, em ordem.
  - Tem o número de dias certo.
  - O ritmo por dia fica dentro do previsto.
- **Grupos:**
  - Todo plano está em exatamente um grupo.
  - Todo grupo tem título nos dois idiomas.
- **Conteúdo:**
  - 16 temas, ids únicos e ícones conhecidos.
  - Versículos existentes nas duas traduções, sem repetição entre temas.
- **No navegador:**
  - A tela Planos mostra os três grupos.
  - Começar "João em 21 dias" mostra "Dia 1 de 21".
  - A lista de temas mostra 16 temas.
  - O tema Paz abre com os versículos.
