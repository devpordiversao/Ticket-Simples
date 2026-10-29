# Ticket Simples

Bot de tickets para Discord feito com Discord.js v14.

## Funcionalidades
- Comando `/painel-ticket` para publicar o painel.
- Botão para abrir canal privado de atendimento.
- Impede que a mesma pessoa abra vários tickets ao mesmo tempo.
- Botão para fechar o ticket.
- Cargo de suporte e categoria configuráveis.

## Variáveis de ambiente
Configure no Railway. **Nunca coloque o token neste repositório.**

- `DISCORD_TOKEN`: token do bot, copiado no Discord Developer Portal.
- `CLIENT_ID`: ID da aplicação do bot.
- `GUILD_ID`: ID do servidor de testes.
- `TICKET_CATEGORY_ID`: (opcional) ID da categoria onde criar tickets.
- `SUPPORT_ROLE_ID`: (opcional) ID do cargo da equipe de suporte.

## Como usar
1. Instale as dependências com `npm install`.
2. Configure as variáveis de ambiente.
3. Inicie com `npm start`.
4. No servidor, use `/painel-ticket` com uma conta que tenha permissão de gerenciar servidor.

Dê ao bot permissões para ver canais, enviar mensagens, ler histórico e gerenciar canais. Mantenha o token privado.