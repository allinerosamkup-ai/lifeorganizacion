# OpenClaw + Telegram - Guia de Instalação e Configuração

Este documento serve como referência rápida para gerenciar a instalação do OpenClaw e seu pareamento com o Telegram. Tudo isso roda em uma VPS Ubuntu.

## 1. Acesso à VPS
Conecte-se à VPS utilizando a chave SSH já configurada (sem senha):
```bash
ssh -i c:\Users\allin\lifeorganizacion\vps_key2 root@195.35.17.102
```

## 2. Instalação Básica do OpenClaw (via npm)
Na VPS, o OpenClaw exige Node.js 22 ou superior.
Para instalar/atualizar o pacote global:

```bash
npm install -g @openclaw/cli
```

## 3. Onboarding & Criação do Daemon (Serviço Persistente)
O comando a seguir inicia a configuração inicial e **instala um serviço** para rodar o OpenClaw 24/7.

```bash
openclaw onboard --install-daemon
```
* **Mode**: Escolha `QuickStart`
* **Model**: Escolha o Provedor (`Google Gemini` -> `API Key`) e cole a chave de API
* **Channel**: Escolha `Telegram (Bot API)`
* **Skills**: Aceite a instalação (`npm`)
* Quando perguntar sobre *hooks*, pode pular selecionando `Skip for now`

### Configuração do serviço no Linux (systemd)
O Daemon roda ao nível de usuário root (sem precisar de privilégios globais do SO). Os comandos úteis são:

- **Habilitar daemon no boot**: `systemctl --user enable openclaw-gateway`
- **Iniciar daemon**: `systemctl --user start openclaw-gateway`
- **Verificar status**: `systemctl --user status openclaw-gateway`
- **Ver Logs**: `journalctl --user -u openclaw-gateway -f`

*(Lembre-se: por ser `--user`, você deve rodar os comandos systemd logado como root via SSH).*

---

## 4. O Pareamento com o Telegram

Uma vez que o daemon está de pé na VPS, você precisa "parear" o seu Bot do Telegram configurado no sistema com a sua conta do Telegram para o robô te responder.

### Passo 1: No celular/Telegram
Mande o comando `/pair` para o seu próprio Bot no Telegram. Ele irá devolver um código customizado (geralmente formato misto de Letras e Números, exemplo: `5SQJVQG2`).

### Passo 2: Na VPS
Descubra se o pedido está pendente (opcional):
```bash
openclaw pairing list telegram
```

Aprove o código de pareamento, enviando-o via terminal:
```bash
openclaw pairing approve telegram SEU_CODIGO_DE_PAREAMENTO
```
*Substitua `SEU_CODIGO_DE_PAREAMENTO` pelo código de 8 dígitos recebido.*

O seu celular agora deve receber uma notificação de "Pairing approved" no próprio telegram e seu usuário estará salvo no banco de dados interno do OpenClaw e habilitado a dar ordens remotamente!

---

## 5. Arquivos de Configuração Internos
Caso necessite ver os dados salvos em cache ou forçar mudanças, eles ficam no diretório persistente do usuário:

- Diretório Raiz OpenClaw na VPS: `~/.openclaw`
- Banco de Dados de Sessão (SQLite): `~/.openclaw/openclaw.db`
- Chaves de API encriptadas (Keyring local via Node)

### Configurar Chaves Manualmente sem recomeçar o Onboard:
Você pode configurar dados via CLI:
```bash
# Telegram Token
openclaw configure telegram --bot-token SEU_TOKEN_TELEGRAM

# Chave API Google/Gemini
openclaw configure google --api-key SUA_CHAVE
```
*Atenção: A sintaxe exata do configure pode mudar em novas versões do OpenClaw; rode `openclaw configure --help` caso dê erro de sintaxe.*
