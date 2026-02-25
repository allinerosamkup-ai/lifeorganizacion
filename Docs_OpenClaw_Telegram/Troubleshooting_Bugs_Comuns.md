# Troubleshooting e Comandos Úteis do OpenClaw + Telegram

Neste guia estão os principais problemas e como diagnosticar o OpenClaw conectado à sua VPS.

## 1. O Bot não responde comandos no Telegram

### O serviço está rodando?
Verifique se o OpenClaw está ativo:
```bash
systemctl --user status openclaw-gateway
```
*Se retornar `inactive` ou `failed`*:
```bash
systemctl --user start openclaw-gateway
```

### O log mostra que as mensagens chegam?
```bash
journalctl --user -u openclaw-gateway -f
```
Envie uma mensagem no Telegram. Se não aparecer absolutamente nada no log, o Telegram não está conseguindo bater no seu servidor. 
- Verifique se você configurou o IP corretamente e se o Webhook / Long Polling não estão travados.
- Reinicie o aplicativo OpenClaw se necessário: `systemctl --user restart openclaw-gateway`

### O token de API de IA está correto?
A integração do Google Gemini (ou outro provedor) pode estar barrando a mensagem por token expirado/errado:
```bash
# Para verificar a config inserida via CLI:
openclaw config list
```

## 2. Permissões de Grupos no Telegram (Não lê todas mensagens)

No Telegram, os bots criados via BotFather têm a configuração `Group Privacy` ativada por padrão, o que significa que o bot só vai enxergar mensagens que contiverem um "mention" direto a ele `@seubot_nome` ou comandos iniciados com `/`.

Para o OpenClaw ler tudo (ex.: transcrever áudios automaticamente no grupo):
1. Abra o Telegram
2. Fale com `@BotFather`
3. Envie `/setprivacy`
4. Selecione o seu bot
5. Aperte em `Disable`

Agora ele lerá tudo que for enviado no grupo.

## 3. O pareamento expirou / Desconectar usuário

O código do `/pair` no Telegram expira em poucas horas/minutos após gerado. Caso passe do tempo, gere outro.

### Onde verificar quem pareou:
```bash
openclaw pairing list telegram
```

### Para remover conexões ou deletar pareamentos:
*(Em breve, conforme as versões do CLI avançam, utilize as flags `--help`)*:
```bash
openclaw pairing --help
```

## 4. O Sistema Reiniciou e o Bot Morreu
Se o bot não subir junto do servidor Ubuntu, garanta que o comando de *Linger* do serviço local foi ativado no root:
```bash
# Isso permite que processos do usuário Root iniciem antes mesmo de você logar via SSH.
loginctl enable-linger root
systemctl --user enable openclaw-gateway
```
