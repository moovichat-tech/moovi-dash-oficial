import { DashboardData, CommandResponse } from '@/types/dashboard';

const WEBHOOK_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const DASHBOARD_API_KEY = import.meta.env.VITE_DASHBOARD_API_KEY || '';

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
  try {
    const response = await fetch(
      `${WEBHOOK_BASE_URL}/dashboard-data?jid=${encodeURIComponent(jid)}`,
      {
        method: 'GET',
        headers: {
          'chave-dashboard-data': DASHBOARD_API_KEY,
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

    const data: DashboardData = await response.json();
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
          'chave-dashboard-data': DASHBOARD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      }
    );

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
 * Serviço de exemplo para proxy de autenticação Twilio
 * (implementado em backend/serverless function)
 */
export async function sendVerificationCode(phoneNumber: string): Promise<void> {
  const response = await fetch('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });

  if (!response.ok) {
    throw new ApiError('Erro ao enviar código de verificação');
  }
}

export async function verifyCode(
  phoneNumber: string,
  code: string
): Promise<{ jid: string; token: string }> {
  const response = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  });

  if (!response.ok) {
    throw new ApiError('Código inválido ou expirado');
  }

  return response.json();
}
