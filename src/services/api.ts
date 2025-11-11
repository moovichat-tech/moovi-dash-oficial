import { DashboardData, CommandResponse } from '@/types/dashboard';

const WEBHOOK_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const DASHBOARD_API_KEY = import.meta.env.VITE_DASHBOARD_API_KEY || '';

// 🔓 MODO DESENVOLVIMENTO - Controle separado para autenticação e dados
const IS_DEV_BYPASS_AUTH = false;  // Autenticação via n8n (WhatsApp)
const IS_DEV_BYPASS_DATA = false;  // Dados via n8n

// Dados mockados para desenvolvimento
const MOCK_DASHBOARD_DATA: DashboardData = {
  jid: 'dev@s.whatsapp.net',
  saldo_total: 15420.50,
  receita_mensal: 8500.00,
  despesa_mensal: 4235.80,
  transacoes: [
    {
      id: '1',
      data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      descricao: 'Salário',
      valor: 8500.00,
      tipo: 'receita',
      categoria: 'Salário',
      conta_cartao: 'Nubank',
      recorrente: true,
    },
    {
      id: '2',
      data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      descricao: 'Mercado',
      valor: -450.00,
      tipo: 'despesa',
      categoria: 'Alimentação',
      conta_cartao: 'Cartão Visa',
      recorrente: false,
    },
    {
      id: '3',
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      descricao: 'Freelance',
      valor: 1200.00,
      tipo: 'receita',
      categoria: 'Freelance',
      conta_cartao: 'Conta Corrente',
      recorrente: false,
    },
    {
      id: '4',
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      descricao: 'Netflix',
      valor: -55.90,
      tipo: 'despesa',
      categoria: 'Entretenimento',
      conta_cartao: 'Cartão Mastercard',
      recorrente: true,
    },
    {
      id: '5',
      data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      descricao: 'Gasolina',
      valor: -280.00,
      tipo: 'despesa',
      categoria: 'Transporte',
      conta_cartao: 'Nubank',
      recorrente: false,
    },
  ],
  contas_cartoes: [
    { id: '1', nome: 'Nubank', tipo: 'conta_corrente', saldo: 5420.50 },
    { id: '2', nome: 'Cartão Visa', tipo: 'cartao_credito', saldo: 3800.00, limite: 5000.00 },
  ],
  categorias: [
    { id: '1', nome: 'Alimentação', tipo: 'despesa', cor: '#10b981' },
    { id: '2', nome: 'Transporte', tipo: 'despesa', cor: '#3b82f6' },
    { id: '3', nome: 'Entretenimento', tipo: 'despesa', cor: '#a855f7' },
    { id: '4', nome: 'Salário', tipo: 'receita', cor: '#22c55e' },
    { id: '5', nome: 'Freelance', tipo: 'receita', cor: '#14b8a6' },
  ],
  metas: [
    { id: '1', nome: 'Emergência', valor_alvo: 10000.00, valor_atual: 5420.50, data_alvo: '2025-12-31' },
  ],
  recorrencias: [
    { id: '1', descricao: 'Salário', valor: 8500.00, tipo: 'receita', categoria: 'Salário', frequencia: 'mensal', proxima_data: '2025-12-05', ativo: true },
    { id: '2', descricao: 'Netflix', valor: 55.90, tipo: 'despesa', categoria: 'Entretenimento', frequencia: 'mensal', proxima_data: '2025-12-15', ativo: true },
  ],
  limites: [
    { categoria: 'Alimentação', limite: 1000.00, gasto_atual: 450.00 },
    { categoria: 'Transporte', limite: 500.00, gasto_atual: 280.00 },
  ],
  historico_30dias: Array.from({ length: 30 }, (_, i) => {
    const day = 29 - i;
    return {
      data: new Date(Date.now() - day * 24 * 60 * 60 * 1000).toISOString(),
      receitas: Math.random() * 500 + 200,
      despesas: Math.random() * 400 + 100,
    };
  }),
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNotFound: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Busca todos os dados do dashboard para o JID do usuário
 * GET /dashboard-data?jid=[JID]
 * Header: chave-dashboard-data
 * 
 * @throws ApiError com isNotFound=true quando 404
 */
export async function getDashboardData(jid: string): Promise<DashboardData> {
  if (IS_DEV_BYPASS_DATA) {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('🔓 DEV MODE: Retornando dados mockados para', jid);
    return { ...MOCK_DASHBOARD_DATA, jid };
  }

  try {
    const response = await fetch(
      `${WEBHOOK_BASE_URL}/dashboard-data?jid=${encodeURIComponent(jid)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': DASHBOARD_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 404) {
      throw new ApiError(
        'Dados não encontrados. Configure seu dashboard primeiro.',
        404,
        true
      );
    }

    if (!response.ok) {
      throw new ApiError(
        `Erro ao buscar dados: ${response.statusText}`,
        response.status
      );
    }

    const responseData = await response.json();

    // Preferir dados dentro de `dados_finais` quando existir; tratar null como não encontrado
    const hasNested = responseData && Object.prototype.hasOwnProperty.call(responseData, 'dados_finais');
    const raw = hasNested ? responseData.dados_finais : responseData;

    if (raw == null) {
      throw new ApiError(
        'Dados não encontrados. Configure seu dashboard primeiro.',
        404,
        true
      );
    }

    // Normalizar estrutura e garantir arrays vazios quando ausentes
    const data: DashboardData = {
      jid,
      saldo_total: raw.saldo_total ?? 0,
      receita_mensal: raw.receita_mensal ?? 0,
      despesa_mensal: raw.despesa_mensal ?? 0,
      transacoes: Array.isArray(raw.transacoes) ? raw.transacoes : [],
      contas_cartoes: Array.isArray(raw.contas_cartoes) ? raw.contas_cartoes : [],
      categorias: Array.isArray(raw.categorias) ? raw.categorias : [],
      metas: Array.isArray(raw.metas) ? raw.metas : [],
      recorrencias: Array.isArray(raw.recorrencias) ? raw.recorrencias : [],
      limites: Array.isArray(raw.limites) ? raw.limites : [],
      historico_30dias: Array.isArray(raw.historico_30dias) ? raw.historico_30dias : [],
    };

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão com o servidor');
  }
}

/**
 * Envia um comando em linguagem natural para o backend processar
 * POST /dashboard-command?jid=[JID]
 * Header: chave-dashboard-data
 * Body: { "command": "texto do usuário" }
 * 
 * Após sucesso (200), deve-se chamar getDashboardData() para atualizar a UI
 */
export async function postDashboardCommand(
  jid: string,
  command: string
): Promise<CommandResponse> {
  try {
    const response = await fetch(
      `${WEBHOOK_BASE_URL}/dashboard-command?jid=${encodeURIComponent(jid)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': DASHBOARD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      }
    );

    if (response.status === 409) {
      throw new ApiError(
        'O assistente está ocupado. Tente novamente em 5 segundos.',
        409
      );
    }

    if (!response.ok) {
      throw new ApiError(
        `Erro ao processar comando: ${response.statusText}`,
        response.status
      );
    }

    const data: CommandResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão com o servidor');
  }
}

/**
 * Envia código de verificação via WhatsApp através do n8n
 * POST /auth/send-code
 * Header: Authorization
 * Body: { "telefone": "62992509945" }
 */
export async function sendVerificationCode(phoneNumber: string): Promise<void> {
  if (IS_DEV_BYPASS_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('🔓 DEV MODE: Código "enviado" para', phoneNumber);
    return;
  }

  try {
    const response = await fetch(
      `${WEBHOOK_BASE_URL}/auth/send-code`,
      {
        method: 'POST',
        headers: {
          'Authorization': DASHBOARD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefone: phoneNumber }),
      }
    );

    if (!response.ok) {
      throw new ApiError(
        'Erro ao enviar código de verificação',
        response.status
      );
    }

    console.log('✅ Código enviado via WhatsApp para', phoneNumber);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão ao enviar código');
  }
}

/**
 * Verifica código de verificação via n8n
 * POST /auth/verify-code
 * Header: Authorization
 * Body: { "telefone": "62992509945", "code": "123456" }
 * Resposta: { "success": true, "jid": "5562992509945@s.whatsapp.net", ... }
 */
export async function verifyCode(
  phoneNumber: string,
  code: string
): Promise<{ jid: string; token: string }> {
  if (IS_DEV_BYPASS_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockJid = `${phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
    const mockToken = `dev_token_${Date.now()}`;
    
    console.log('🔓 DEV MODE: Login aceito ->', { jid: mockJid, token: mockToken });
    
    return { jid: mockJid, token: mockToken };
  }

  try {
    const response = await fetch(
      `${WEBHOOK_BASE_URL}/auth/verify-code`,
      {
        method: 'POST',
        headers: {
          'Authorization': DASHBOARD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefone: phoneNumber, code }),
      }
    );

    if (response.status === 401) {
      throw new ApiError('Código inválido ou expirado', 401);
    }

    if (!response.ok) {
      throw new ApiError(
        `Erro ao verificar código: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    
    // Validar se a resposta tem os campos esperados
    if (!data.jid) {
      throw new ApiError('Resposta inválida do servidor');
    }

    console.log('✅ Login bem-sucedido:', data.jid);
    
    return {
      jid: data.jid,
      token: data.token || `auth_${Date.now()}`, // Fallback se token não vier
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão ao verificar código');
  }
}
