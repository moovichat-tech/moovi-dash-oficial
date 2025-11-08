# 📋 Moovi.dash - Especificação Técnica Completa

## 🏗️ Arquitetura

### Visão Geral
```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          React SPA (Moovi.dash)                      │   │
│  │  - Authentication (Twilio Verify)                    │   │
│  │  - Dashboard UI (Charts, Cards, Tables)              │   │
│  │  - Chat Command Interface                            │   │
│  │  - Theme Management (Light/Dark)                     │   │
│  └──────────┬──────────────────────────┬────────────────┘   │
└─────────────┼──────────────────────────┼────────────────────┘
              │                          │
              │ HTTPS                    │ HTTPS
              │                          │
    ┌─────────▼─────────┐      ┌─────────▼─────────────────┐
    │  Backend Proxy    │      │   n8n Webhooks            │
    │  (Twilio Auth)    │      │  ┌────────────────────┐   │
    │                   │      │  │ GET /dashboard-data│   │
    │  /api/auth/       │      │  │ POST /dashboard-   │   │
    │    send-code      │      │  │      command       │   │
    │    verify-code    │      │  └──────┬─────────────┘   │
    └───────────────────┘      └─────────┼─────────────────┘
                                          │
                                          │ Read/Write
                                          │
                                   ┌──────▼────────┐
                                   │     Redis     │
                                   │ (jid-keyed)   │
                                   │  - Dashboard  │
                                   │  - Transactions│
                                   │  - Goals      │
                                   └───────────────┘
```

## 🔐 Autenticação - Twilio Verify

### Fluxo de Login

1. **Usuário insere telefone** → Frontend envia para `/api/auth/send-code`
2. **Backend valida** e chama Twilio Verify API
3. **Twilio envia SMS** com código 6 dígitos
4. **Usuário insere código** → Frontend envia para `/api/auth/verify-code`
5. **Backend valida** com Twilio e retorna `{ jid, token }`
6. **Frontend armazena** `jid` e `token` no localStorage
7. **Redirecionamento** para Dashboard

### Variáveis de Ambiente (Backend)

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ CRÍTICO**: Nunca expor no frontend!

### Exemplo de Implementação Backend (Supabase Edge Function)

```typescript
// /api/auth/send-code
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Twilio } from 'npm:twilio@4.18.0';

const client = new Twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
);

serve(async (req) => {
  const { phoneNumber } = await req.json();
  
  // Validação
  if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
    return new Response(
      JSON.stringify({ error: 'Telefone inválido' }),
      { status: 400 }
    );
  }

  try {
    await client.verify.v2
      .services(Deno.env.get('TWILIO_VERIFY_SERVICE_SID'))
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro ao enviar código' }),
      { status: 500 }
    );
  }
});
```

```typescript
// /api/auth/verify-code
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Twilio } from 'npm:twilio@4.18.0';
import { createClient } from 'npm:redis@4.6.0';

const client = new Twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
);

const redis = createClient({
  url: Deno.env.get('REDIS_URL'),
});
await redis.connect();

serve(async (req) => {
  const { phoneNumber, code } = await req.json();

  try {
    const verification = await client.verify.v2
      .services(Deno.env.get('TWILIO_VERIFY_SERVICE_SID'))
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });

    if (verification.status === 'approved') {
      // Gerar JID único (pode ser hash do telefone)
      const jid = `${phoneNumber.replace(/\D/g, '')}@moovi`;
      const token = crypto.randomUUID(); // JWT na produção

      // Armazenar sessão no Redis
      await redis.set(`session:${jid}`, JSON.stringify({ phoneNumber, token }), {
        EX: 86400 * 30, // 30 dias
      });

      return new Response(
        JSON.stringify({ jid, token }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Código inválido' }),
      { status: 401 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar código' }),
      { status: 500 }
    );
  }
});
```

## 🔌 Integração n8n Webhooks

### GET /dashboard-data

**Endpoint**: `https://seu-n8n.com/webhook/dashboard-data?jid=[JID]`

**Headers**:
```
chave-dashboard-data: sua-chave-secreta
Content-Type: application/json
```

**Response 200**:
```json
{
  "jid": "5511987654321@moovi",
  "saldo_total": 15750.00,
  "receita_mensal": 8500.00,
  "despesa_mensal": 3200.00,
  "transacoes": [
    {
      "id": "txn_001",
      "data": "2025-01-15T10:30:00Z",
      "descricao": "Salário",
      "valor": 8500.00,
      "tipo": "receita",
      "categoria": "Salário",
      "conta_cartao": "Banco Inter",
      "recorrente": true
    },
    {
      "id": "txn_002",
      "data": "2025-01-14T18:45:00Z",
      "descricao": "Supermercado Extra",
      "valor": 450.00,
      "tipo": "despesa",
      "categoria": "Alimentação",
      "conta_cartao": "Cartão Nubank",
      "recorrente": false
    }
  ],
  "contas_cartoes": [
    {
      "id": "acc_001",
      "nome": "Banco Inter",
      "tipo": "conta_corrente",
      "saldo": 10500.00
    },
    {
      "id": "acc_002",
      "nome": "Cartão Nubank",
      "tipo": "cartao_credito",
      "saldo": -1200.00,
      "limite": 5000.00
    }
  ],
  "categorias": [
    {
      "id": "cat_001",
      "nome": "Alimentação",
      "tipo": "despesa",
      "icone": "utensils",
      "cor": "#FF6B6B"
    }
  ],
  "metas": [
    {
      "id": "goal_001",
      "nome": "Viagem Férias",
      "valor_alvo": 10000.00,
      "valor_atual": 3500.00,
      "data_alvo": "2025-12-31T23:59:59Z",
      "categoria": "Lazer"
    }
  ],
  "recorrencias": [
    {
      "id": "rec_001",
      "descricao": "Netflix",
      "valor": 55.90,
      "tipo": "despesa",
      "categoria": "Assinaturas",
      "frequencia": "mensal",
      "proxima_data": "2025-02-10T00:00:00Z",
      "ativo": true
    }
  ],
  "limites": [
    {
      "categoria": "Alimentação",
      "limite": 1500.00,
      "gasto_atual": 450.00
    }
  ],
  "historico_30dias": [
    {
      "data": "2025-01-01",
      "receitas": 8500.00,
      "despesas": 2100.00
    },
    {
      "data": "2025-01-02",
      "receitas": 0.00,
      "despesas": 150.00
    }
    // ... mais 28 dias
  ]
}
```

**Response 404**:
```json
{
  "error": "Dashboard não encontrado para este JID"
}
```

### POST /dashboard-command

**Endpoint**: `https://seu-n8n.com/webhook/dashboard-command?jid=[JID]`

**Headers**:
```
chave-dashboard-data: sua-chave-secreta
Content-Type: application/json
```

**Body**:
```json
{
  "command": "Adicionar despesa de R$ 100 em supermercado"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Despesa adicionada com sucesso"
}
```

**Fluxo após POST**:
1. Frontend envia comando
2. Mostra indicador "Processando..."
3. Recebe 200 OK
4. **Imediatamente** chama GET /dashboard-data
5. Re-renderiza toda a UI com novos dados

### Exemplo de Workflow n8n

```
┌──────────────┐
│   Webhook    │ GET /dashboard-data?jid=X
│   Trigger    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Redis Read  │ key: dashboard:{jid}
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   IF Exists  │
└──┬────────┬──┘
   │        │
   │ No     │ Yes
   ▼        ▼
  404   Return JSON
```

```
┌──────────────┐
│   Webhook    │ POST /dashboard-command
│   Trigger    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Parse NLP   │ Extrair ação, valor, categoria
│  (OpenAI)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redis Update │ Adicionar transação/meta/etc
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Response    │ {"success": true}
└──────────────┘
```

## 🎨 Design System

### Paleta de Cores (HSL)

**Light Mode**:
```css
--primary: 142 71% 45%;           /* #16a34a - Verde Moovi */
--primary-foreground: 0 0% 100%;  /* Branco */
--success: 142 71% 45%;           /* Verde */
--accent: 142 84% 60%;            /* Verde claro */
--warning: 45 93% 47%;            /* Amarelo */
--destructive: 0 84.2% 60.2%;    /* Vermelho */
--background: 0 0% 100%;          /* Branco */
--foreground: 142 71% 15%;        /* Verde escuro */
--card: 0 0% 100%;                /* Branco */
--border: 142 20% 90%;            /* Verde muito claro */
```

**Dark Mode**:
```css
--primary: 142 71% 45%;           /* Verde Moovi */
--background: 142 71% 8%;         /* Verde muito escuro */
--foreground: 142 20% 95%;        /* Verde muito claro */
--card: 142 50% 12%;              /* Verde escuro */
--border: 142 40% 20%;            /* Verde médio escuro */
```

### Tipografia

- **Font Family**: System fonts (SF Pro, Segoe UI, Roboto)
- **H1**: 2rem (32px), font-weight: 700
- **H2**: 1.5rem (24px), font-weight: 600
- **Body**: 1rem (16px), font-weight: 400
- **Small**: 0.875rem (14px)

### Espaçamentos

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)

### Border Radius

- **sm**: 0.5rem (8px)
- **md**: 0.75rem (12px)
- **lg**: 1rem (16px)
- **full**: 9999px

## 📱 Componentes Principais

### 1. PhoneLogin

**Props**:
```typescript
interface PhoneLoginProps {
  onSuccess: (jid: string, token: string) => void;
}
```

**Estados**:
- `phone`: Input telefone
- `code`: Input código 2FA
- `step`: 'phone' | 'code'
- `loading`: boolean

### 2. Dashboard

**Props**:
```typescript
interface DashboardProps {
  jid: string;
  onLogout: () => void;
}
```

**Features**:
- Header com logo, refresh, theme toggle, logout
- Cards de saldo (total, receitas, despesas)
- Gráfico linha 30 dias
- Lista de transações com busca
- FAB para comando

### 3. ChatCommand

**Props**:
```typescript
interface ChatCommandProps {
  onSendCommand: (command: string) => Promise<void>;
  disabled?: boolean;
}
```

**Fluxo**:
1. Usuário digita comando
2. Clica "Enviar"
3. Mostra spinner
4. Chama `postDashboardCommand()`
5. Em sucesso → chama `getDashboardData()`
6. Atualiza toda UI
7. Limpa input

### 4. BalanceCards

**Props**:
```typescript
interface BalanceCardsProps {
  saldoTotal: number;
  receitaMensal: number;
  despesaMensal: number;
}
```

**Layout**: Grid 3 colunas (responsive para 1 coluna mobile)

### 5. TransactionsList

**Props**:
```typescript
interface TransactionsListProps {
  transactions: Transaction[];
}
```

**Features**:
- Busca por descrição/categoria
- Tabela responsiva
- Badge de categoria
- Cor por tipo (verde=receita, vermelho=despesa)
- Paginação virtual (últimas 10)

### 6. FinancialChart

**Props**:
```typescript
interface FinancialChartProps {
  data: {
    data: string;
    receitas: number;
    despesas: number;
  }[];
}
```

**Tipo**: Line Chart (Recharts)
**Linhas**: Receitas (verde), Despesas (vermelho)

### 7. FloatingActionButton (FAB)

**Props**:
```typescript
interface FloatingActionButtonProps {
  onSendCommand: (command: string) => Promise<void>;
}
```

**Posição**: `fixed bottom-6 right-6`
**Shadow**: `var(--fab-shadow)`
**Funcionalidade**: Abre dialog com ChatCommand

### 8. NotFoundState

**Props**: Nenhum

**Conteúdo**:
- Mascote Moovi
- Mensagem amigável
- Botão WhatsApp suporte
- Botão conhecer Moovi

## 🧪 Testes

### Unit Tests (Jest + React Testing Library)

**Exemplo: PhoneLogin.test.tsx**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import * as api from '@/services/api';

jest.mock('@/services/api');

describe('PhoneLogin', () => {
  it('envia código ao submeter telefone válido', async () => {
    const mockSendCode = jest.spyOn(api, 'sendVerificationCode').mockResolvedValue();
    const onSuccess = jest.fn();

    render(<PhoneLogin onSuccess={onSuccess} />);

    const phoneInput = screen.getByPlaceholderText(/telefone/i);
    const submitButton = screen.getByText(/enviar código/i);

    fireEvent.change(phoneInput, { target: { value: '+5511987654321' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendCode).toHaveBeenCalledWith('+5511987654321');
    });
  });

  it('valida código e chama onSuccess', async () => {
    const mockVerify = jest.spyOn(api, 'verifyCode').mockResolvedValue({
      jid: '5511987654321@moovi',
      token: 'test-token',
    });
    const onSuccess = jest.fn();

    render(<PhoneLogin onSuccess={onSuccess} />);

    // ... simular envio de código primeiro

    const codeInput = screen.getByPlaceholderText(/código/i);
    const verifyButton = screen.getByText(/verificar/i);

    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith('5511987654321@moovi', 'test-token');
    });
  });
});
```

**Exemplo: useDashboard.test.ts**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from '@/hooks/useDashboard';
import * as api from '@/services/api';

jest.mock('@/services/api');

describe('useDashboard', () => {
  it('carrega dados do dashboard ao montar', async () => {
    const mockData = {
      jid: 'test@moovi',
      saldo_total: 1000,
      // ...
    };

    jest.spyOn(api, 'getDashboardData').mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboard('test@moovi'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
    });
  });

  it('marca isNotFound quando 404', async () => {
    const error = new api.ApiError('Not found', 404, true);
    jest.spyOn(api, 'getDashboardData').mockRejectedValue(error);

    const { result } = renderHook(() => useDashboard('test@moovi'));

    await waitFor(() => {
      expect(result.current.isNotFound).toBe(true);
    });
  });

  it('sendCommand faz POST e depois GET', async () => {
    const mockPost = jest.spyOn(api, 'postDashboardCommand').mockResolvedValue({ success: true });
    const mockGet = jest.spyOn(api, 'getDashboardData').mockResolvedValue({} as any);

    const { result } = renderHook(() => useDashboard('test@moovi'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.sendCommand('adicionar despesa');

    expect(mockPost).toHaveBeenCalledWith('test@moovi', 'adicionar despesa');
    expect(mockGet).toHaveBeenCalledTimes(2); // Initial + após comando
  });
});
```

### E2E Tests (Playwright)

**Exemplo: dashboard.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Moovi.dash E2E', () => {
  test('fluxo completo: login → ver dashboard → enviar comando', async ({ page }) => {
    // Mock backend
    await page.route('**/api/auth/send-code', (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.route('**/api/auth/verify-code', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ jid: 'test@moovi', token: 'token123' }),
      });
    });

    await page.route('**/dashboard-data*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jid: 'test@moovi',
          saldo_total: 5000,
          receita_mensal: 3000,
          despesa_mensal: 1500,
          transacoes: [],
          contas_cartoes: [],
          categorias: [],
          metas: [],
          recorrencias: [],
          limites: [],
          historico_30dias: [],
        }),
      });
    });

    // 1. Login
    await page.goto('/');
    await page.fill('input[type="tel"]', '+5511987654321');
    await page.click('text=Enviar Código');

    await expect(page.locator('text=código de verificação')).toBeVisible();

    await page.fill('input[id="code"]', '123456');
    await page.click('text=Verificar');

    // 2. Dashboard carregado
    await expect(page.locator('text=Moovi.dash')).toBeVisible();
    await expect(page.locator('text=R$ 5.000,00')).toBeVisible();

    // 3. Enviar comando via FAB
    await page.route('**/dashboard-command*', (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.click('button[class*="fab"]'); // Encontrar FAB
    await page.fill('textarea', 'Adicionar despesa de R$ 100 em alimentação');
    await page.click('text=Enviar Comando');

    // 4. Verificar que GET foi chamado novamente
    await expect(page.locator('text=Processando')).toBeVisible();
    await expect(page.locator('text=Comando processado')).toBeVisible();
  });

  test('mostra estado NotFound quando 404', async ({ page }) => {
    await page.route('**/api/auth/verify-code', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ jid: 'new@moovi', token: 'token' }),
      });
    });

    await page.route('**/dashboard-data*', (route) => {
      route.fulfill({ status: 404 });
    });

    // Login
    await page.goto('/');
    await page.fill('input[type="tel"]', '+5511987654321');
    await page.click('text=Enviar Código');
    await page.fill('input[id="code"]', '123456');
    await page.click('text=Verificar');

    // Deve mostrar NotFound
    await expect(page.locator('text=Dashboard Não Configurado')).toBeVisible();
    await expect(page.locator('text=Falar com Suporte')).toBeVisible();
  });
});
```

## 🚀 Deploy

### Checklist

- [ ] Configurar variáveis de ambiente no provedor
- [ ] Build otimizado (`npm run build`)
- [ ] Testar em staging
- [ ] Configurar CORS no n8n para domínio de produção
- [ ] Configurar rate limiting no backend
- [ ] Configurar monitoramento de erros (Sentry)
- [ ] Configurar analytics (opcional)
- [ ] SSL/HTTPS ativado

### Provedores Recomendados

- **Vercel**: Deploy automático, serverless functions para Twilio proxy
- **Netlify**: Similar ao Vercel
- **Cloudflare Pages**: Edge functions, performance global

### Variáveis de Produção

```env
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
VITE_DASHBOARD_API_KEY=prod-key-secreta
VITE_API_URL=https://api.seudominio.com
```

## 📊 Roadmap Futuro

### Sprint 1 - MVP (Atual) ✅
- [x] Autenticação Twilio
- [x] Dashboard básico
- [x] Chat command
- [x] Tema claro/escuro
- [x] FAB
- [x] NotFound state

### Sprint 2 - Melhorias
- [ ] Exportar CSV/PDF
- [ ] Filtros avançados (por data, categoria, valor)
- [ ] Gráficos adicionais (pizza de categorias, barras)
- [ ] Gerenciamento de metas (adicionar, editar, excluir)
- [ ] Gerenciamento de recorrências
- [ ] Notificações push (limites excedidos, metas atingidas)

### Sprint 3 - Hardening
- [ ] Testes de carga
- [ ] Otimização de performance (lazy loading, code splitting)
- [ ] PWA (service worker, offline mode)
- [ ] Conexão com bancos via Open Finance (Pluggy, Belvo)
- [ ] Multi-usuário (compartilhar dashboard)
- [ ] Backup automático
- [ ] Histórico de comandos

## 🔍 Observabilidade

### Métricas Recomendadas

- **Performance**: Core Web Vitals (LCP, FID, CLS)
- **Errors**: Taxa de erros, stack traces (Sentry)
- **Usage**: Comandos mais usados, tempo médio de sessão
- **API**: Latência GET/POST, taxa de 404

### Tools

- **Sentry**: Error tracking
- **Vercel Analytics**: Performance
- **Google Analytics**: User behavior (opcional)

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-08  
**Autores**: Equipe Moovi
