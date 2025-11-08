# 🐂 Moovi.dash - Dashboard Financeiro Pessoal

Dashboard financeiro pessoal mobile-first com integração n8n e autenticação Twilio Verify.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Charts**: Recharts
- **State**: React Hooks + TanStack Query
- **Auth**: Twilio Verify (2FA SMS)
- **Backend**: n8n Webhooks + Redis

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Conta n8n configurada com webhooks
- Conta Twilio (para autenticação)
- Backend proxy para Twilio (por segurança)

## ⚙️ Configuração

### 1. Clone e instale

```bash
git clone <seu-repo>
cd moovi-dash
npm install
```

### 2. Configure variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
VITE_DASHBOARD_API_KEY=sua-chave-dashboard-data
VITE_API_URL=https://sua-api.com
```

**⚠️ IMPORTANTE**: Credenciais Twilio devem ficar APENAS no backend/serverless.

### 3. Configure os webhooks n8n

Crie dois workflows n8n:

#### GET /dashboard-data
- **URL**: `[N8N_URL]/dashboard-data?jid=[JID]`
- **Header**: `chave-dashboard-data: [SUA_CHAVE]`
- **Response 200**: JSON completo do dashboard
- **Response 404**: Quando JID não existir no Redis

#### POST /dashboard-command
- **URL**: `[N8N_URL]/dashboard-command?jid=[JID]`
- **Header**: `chave-dashboard-data: [SUA_CHAVE]`
- **Body**: `{"command": "texto natural do usuário"}`
- **Response 200**: Comando processado com sucesso

### 4. Configure backend proxy Twilio

Crie endpoints seguros (exemplo: Supabase Edge Functions, Vercel Serverless):

**POST /api/auth/send-code**
```typescript
// Envia código via Twilio Verify
const { phoneNumber } = await req.json();
// Chamar Twilio Verify API
```

**POST /api/auth/verify-code**
```typescript
// Verifica código
const { phoneNumber, code } = await req.json();
// Validar com Twilio
// Retornar { jid, token }
```

## 🏃 Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:8080`

## 🏗️ Build para Produção

```bash
npm run build
npm run preview
```

## 📦 Estrutura do Projeto

```
src/
├── assets/              # Logos e imagens
├── components/
│   ├── auth/           # PhoneLogin
│   ├── dashboard/      # Componentes do dashboard
│   └── ui/             # shadcn components
├── hooks/              # useTheme, useDashboard
├── pages/              # Index, Dashboard, NotFound
├── services/           # api.ts (GET/POST webhooks)
├── types/              # TypeScript interfaces
└── lib/                # Utilitários
```

## 🔒 Segurança

- ✅ Twilio credentials **nunca** expostas no client
- ✅ Backend proxy valida todas as chamadas Twilio
- ✅ Headers de autenticação para webhooks n8n
- ✅ CORS configurado adequadamente
- ✅ Rate limiting recomendado no backend
- ✅ Validação de entrada em todos os formulários

## 📱 Features

- [x] Login por telefone (2FA SMS)
- [x] Dashboard responsivo mobile-first
- [x] Visualização de saldos e transações
- [x] Gráfico de histórico 30 dias
- [x] Chat command com linguagem natural
- [x] Tema claro/escuro com persistência
- [x] FAB sempre visível
- [x] Busca e filtros de transações
- [x] Estado 404 com links de suporte

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 🚀 Deploy

### Variáveis de Ambiente (Produção)

Configure no seu provedor (Vercel, Netlify, etc.):
- `VITE_N8N_WEBHOOK_URL`
- `VITE_DASHBOARD_API_KEY`
- `VITE_API_URL`

### Build otimizado

```bash
npm run build
```

Arquivos em `dist/` prontos para deploy.

## 📞 Suporte

- WhatsApp: [+55 11 98926-9937](https://wa.me/5511989269937)
- Website: [moovi.chat](https://moovi.chat)

## 🎨 Design System

### Cores (HSL)
- **Primary**: `142 71% 45%` (Verde Moovi)
- **Success**: `142 71% 45%`
- **Accent**: `142 84% 60%`
- **Warning**: `45 93% 47%`
- **Destructive**: `0 84.2% 60.2%`

### Componentes
Todos os componentes usam tokens do design system (sem cores hardcoded).

## 📄 Licença

Proprietário - Moovi © 2025

---

Desenvolvido com 💚 pela equipe Moovi
