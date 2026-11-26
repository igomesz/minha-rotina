# Minha rotina

Aplicativo web pessoal para acompanhar a rotina do dia a dia: marque as tarefas do dia e veja seu desempenho em porcentagem por dia, semana, mês e ao longo dos meses.

**Online:** https://minha-rotina-publicacao.vercel.app/

## O que ele faz

- **Hoje:** lista do dia com horários de início e término, estimativa do intervalo de descanso, frase motivacional e resumo do Pomodoro.
- **Semana:** como foi cada dia e o resultado da semana.
- **Mês:** o desempenho do mês, com as semanas, os dias e etiquetas coloridas com horários opcionais por data.
- **Visão geral:** todos os meses lado a lado, com o melhor mês e conquistas de período em destaque.
- **Tarefas:** criar e gerenciar tarefas; mudanças nos dias agendados começam amanhã e preservam o histórico.
- **Pomodoro:** ciclos de foco e pausas com durações ajustáveis, associação opcional a uma tarefa e contagem diária de etapas concluídas neste dispositivo.
- **Checklist de hoje:** definir horários, reordenar tarefas e editá-las diretamente no dia. Edições e exclusões valem imediatamente, preservando os dias anteriores.
- **Datas importantes:** adicionar, editar e remover várias etiquetas por dia, com horário opcional e sincronização na nuvem.
- **Urgência das etiquetas:** vermelho para alta, amarelo para média e verde para baixa; etiquetas antigas continuam compatíveis.
- **Conta própria:** login por e-mail e senha, com os dados na nuvem. O que é marcado no celular aparece no computador.
- **Notificações:** com permissão, avisa sobre tarefas próximas, a nota “Importante hoje” ao abrir o app no dia e o fim de etapas do Pomodoro. As mensagens são genéricas para não expor nomes, horários ou notas na tela bloqueada. Sons e notificações dependem do app estar aberto ou recentemente em segundo plano; não há alarmes garantidos com o navegador fechado ou o celular bloqueado por muito tempo.
- **Instalável (PWA):** pode ser adicionado à tela inicial do celular e abre como um aplicativo. Notificações diárias com o app fechado exigiriam Web Push e um gatilho de servidor agendado, não incluídos nesta versão.
- **Compartilhamento:** use o botão de compartilhar; se o navegador não oferecer essa opção, o link é copiado.
- **Gráfico de contribuições do GitHub (opcional):** mostra o gráfico público de quem informar o nome de usuário.

## Tecnologias

- [React](https://react.dev/) e [Vite](https://vite.dev/) no front-end
- [Supabase](https://supabase.com/) para login e banco de dados
- [Vercel](https://vercel.com/) para a hospedagem
- PWA com service worker

## Como rodar localmente

1. Clone o repositório e instale as dependências:
   ```bash
   git clone https://github.com/igomesz/minha-rotina.git
   cd minha-rotina
   npm install
   ```
2. Copie o arquivo `.env.example` para `.env` e preencha com as credenciais públicas do seu projeto Supabase.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Capturas de tela

As capturas usam dados fictícios de demonstração, sem informações pessoais.

### Hoje

<p align="center">
  <img src="docs/screenshots/hoje.png" alt="Tela Hoje com a identidade Amanhecer, Pomodoro e etiquetas por urgência" width="900">
</p>

### Semana

<p align="center">
  <img src="docs/screenshots/semana.png" alt="Visão semanal com tarefas e progresso de cada dia" width="900">
</p>

### Mês

<p align="center">
  <img src="docs/screenshots/mes.png" alt="Calendário mensal com progresso e etiquetas por dia" width="900">
</p>

### Visão geral

<p align="center">
  <img src="docs/screenshots/visao-geral.png" alt="Resumo do progresso em cada mês do ano" width="900">
</p>

### Pomodoro

<p align="center">
  <img src="docs/screenshots/pomodoro.png" alt="Timer Pomodoro com controles e durações alinhados" width="900">
</p>

## Autor

Feito por Pedro Gomes, como projeto de estudo e portfólio.
