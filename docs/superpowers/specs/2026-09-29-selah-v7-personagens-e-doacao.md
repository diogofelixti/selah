# Selah v7: planos de personagens e doação

Complemento das specs anteriores. Data: 2026-09-29.

**Estado:** o dono pediu a seção de personagens (exemplos: Samuel, Davi, Paulo, Daniel) e passou os dados da doação. Os detalhes foram decididos pelo implementador e estão marcados para revisão.

## Planos: Personagens da Bíblia

É um grupo novo na tela Planos, **Personagens da Bíblia** / **People of the Bible**. Ele fica entre "Para aprofundar" e "A Bíblia inteira".

- **Ritmo:** um capítulo por dia.
- **Ordem:** a ordem em que os personagens aparecem na Bíblia.
- **Título:** "História de <nome>".

| Id | Personagem | Capítulos | Dias |
|---|---|---|---|
| `abraham` | Abraão | Gênesis 12 a 25 | 14 |
| `joseph` | José | Gênesis 37 a 50 | 14 |
| `moses` | Moisés | Êxodo 1 a 20 | 20 |
| `ruth` | Rute | Rute 1 a 4 | 4 |
| `samuel` | Samuel | 1 Samuel 1 a 16 | 16 |
| `david` | Davi | 1 Samuel 16 a 31, 2 Samuel 1 a 24, 1 Reis 1 e 2 | 42 |
| `elijah` | Elias | 1 Reis 17, 18, 19 e 21; 2 Reis 1 e 2 | 6 |
| `esther` | Ester | Ester 1 a 10 | 10 |
| `daniel` | Daniel | Daniel 1 a 12 | 12 |
| `paul` | Paulo | Atos 9 e 13 a 28 | 17 |

- **Moisés:** do nascimento até os Dez Mandamentos. A peregrinação no deserto fica para um plano futuro.
- **Samuel e Davi:** os dois planos compartilham 1 Samuel 16, a unção de Davi.
- **Paulo:** conversão (Atos 9) e viagens (Atos 13 a 28). As cartas já têm o plano próprio.

## Doação

- **Onde:**
  - Um cartão **Apoie o Selah** nos Ajustes, antes do link "Sobre".
  - O mesmo cartão na página Sobre.
  - Nada na tela inicial nem no leitor: a leitura fica livre de pedidos.
- **Texto:** "O Selah é gratuito e sem anúncios. Se ele ajuda você, considere apoiar com uma doação via Pix."
- **Chave Pix:**
  - Mostrada assim: `CNPJ 41.123.299/0001-59`.
  - O botão Copiar copia só os números (`41123299000159`), que é o formato que os apps dos bancos aceitam sem erro.
- **WhatsApp:**
  - Botão "Falar no WhatsApp", com o número (51) 99640-9363 visível.
  - Abre `https://wa.me/5551996409363` com a mensagem "Olá! Quero falar sobre o Selah." já escrita.
  - Abre em nova aba.
- **Em inglês:**
  - O mesmo cartão, dizendo que o Pix é um meio de pagamento do Brasil.
  - A mensagem do WhatsApp segue em português, porque o atendimento é no Brasil.
- **Dados:** ficam num só lugar, em `src/lib/donation.ts`.

## Testes

- **Unitários:**
  - Os capítulos exatos de cada plano de personagem.
  - Todos os planos estão num grupo.
  - Os textos existem nos dois idiomas.
- **No navegador:**
  - O grupo aparece e "História de Davi" mostra 42 dias.
  - O cartão de doação está nos Ajustes e no Sobre.
  - Copiar a chave copia os números.
  - O link do WhatsApp está correto.
