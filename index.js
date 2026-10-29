require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, TICKET_CATEGORY_ID, SUPPORT_ROLE_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Faltam variáveis obrigatórias: DISCORD_TOKEN, CLIENT_ID e GUILD_ID.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName("painel-ticket")
    .setDescription("Envia o painel para abrir tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`Ticket Simples conectado como ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Comando /painel-ticket registrado.");
  } catch (error) {
    console.error("Não foi possível registrar o comando:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "painel-ticket") {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎫 Central de Atendimento")
        .setDescription("Precisa de ajuda? Clique no botão abaixo para abrir um ticket privado com a equipe.");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket:open")
          .setLabel("Abrir ticket")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === "ticket:open") {
      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: "Este botão só funciona dentro de um servidor.", ephemeral: true });

      const existing = guild.channels.cache.find(
        (channel) => channel.type === ChannelType.GuildText && channel.topic === `ticket-owner:${interaction.user.id}`
      );
      if (existing) {
        return interaction.reply({ content: `Você já tem um ticket aberto: ${existing}`, ephemeral: true });
      }

      const permissionOverwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ];

      if (SUPPORT_ROLE_ID && guild.roles.cache.has(SUPPORT_ROLE_ID)) {
        permissionOverwrites.push({
          id: SUPPORT_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const channel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90),
        type: ChannelType.GuildText,
        topic: `ticket-owner:${interaction.user.id}`,
        permissionOverwrites,
        ...(TICKET_CATEGORY_ID && guild.channels.cache.has(TICKET_CATEGORY_ID) ? { parent: TICKET_CATEGORY_ID } : {}),
      });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket:close")
          .setLabel("Fechar ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger)
      );

      const welcome = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("Ticket aberto")
        .setDescription(`Olá, ${interaction.user}! Explique aqui o que você precisa. A equipe responderá assim que possível.`);

      await channel.send({
        content: SUPPORT_ROLE_ID && guild.roles.cache.has(SUPPORT_ROLE_ID) ? `<@&${SUPPORT_ROLE_ID}> ${interaction.user}` : `${interaction.user}`,
        embeds: [welcome],
        components: [closeRow],
        allowedMentions: { users: [interaction.user.id], roles: SUPPORT_ROLE_ID ? [SUPPORT_ROLE_ID] : [] },
      });

      return interaction.reply({ content: `Seu ticket foi criado: ${channel}`, ephemeral: true });
    }

    if (interaction.customId === "ticket:close") {
      const channel = interaction.channel;
      const ownerId = channel?.topic?.match(/ticket-owner:(\d+)/)?.[1];
      const isSupport = SUPPORT_ROLE_ID && interaction.member?.roles?.cache?.has(SUPPORT_ROLE_ID);
      const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

      if (!ownerId || (interaction.user.id !== ownerId && !isSupport && !canManage)) {
        return interaction.reply({ content: "Só quem abriu o ticket ou a equipe autorizada pode fechá-lo.", ephemeral: true });
      }

      await interaction.reply("🔒 Ticket será fechado em 5 segundos.");
      setTimeout(() => channel.delete("Ticket fechado pelo botão").catch(console.error), 5000);
    }
  } catch (error) {
    console.error("Erro ao processar interação:", error);
    const reply = { content: "Ocorreu um erro. Verifique as permissões do bot e tente novamente.", ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN);
