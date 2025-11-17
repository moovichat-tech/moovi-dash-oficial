import { DashboardData, CommandResponse } from '@/types/dashboard';
import { checkRateLimit, getRateLimitResetTime } from '@/utils/rateLimit';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const IS_DEV = import.meta.env.DEV;

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
    { id: '1', descricao: 'Emergência', valor_total: 10000.00, valor_guardado: 5420.50, prazo: '2025-12-31', recorrencia: null, valor_mensal: null },
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
 * Processa dados brutos da API e calcula valores agregados
 */
function processRawDashboardData(raw: any, jid: string): DashboardData {
  // ✅ Usar array pré-filtrado pela API (sem filtros de data)
  const transacoesDoPeriodo: any[] = Array.isArray(raw.transacoes_do_periodo) 
    ? raw.transacoes_do_periodo 
    : [];
  const limitesRaw = Array.isArray(raw.limites) ? raw.limites : [];

  // ✅ Usar saldo total da API
  const saldoTotal = raw.saldo_total_geral ?? 0;

  // ✅ Calcular receitas e despesas do período (SEM FILTRO DE DATA)
  const receitaMensal = transacoesDoPeriodo
    .filter(t => t.valor > 0)
    .reduce((acc, t) => acc + t.valor, 0);

  const despesaMensal = Math.abs(
    transacoesDoPeriodo
      .filter(t => t.valor < 0)
      .reduce((acc, t) => acc + t.valor, 0)
  );

  // ✅ Limites por Categoria (sem filtro de data)
  const limites = limitesRaw.map((limite: any) => {
    const gastoCategoriaMes = transacoesDoPeriodo
      .filter(t => 
        t.categoria === limite.categoria && 
        t.valor < 0
      )
      .reduce((acc, t) => acc + Math.abs(t.valor), 0);

    return {
      categoria: limite.categoria,
      limite: limite.valor,
      gasto_atual: gastoCategoriaMes,
    };
  });

  // ✅ Histórico do Período (sem filtro de data, agrupado por dia)
  const transacoesPorDia = new Map<string, { receitas: number; despesas: number }>();
  
  transacoesDoPeriodo.forEach(t => {
    const dataKey = t.data.split('T')[0]; // YYYY-MM-DD
    
    if (!transacoesPorDia.has(dataKey)) {
      transacoesPorDia.set(dataKey, { receitas: 0, despesas: 0 });
    }
    
    const dia = transacoesPorDia.get(dataKey)!;
    if (t.valor > 0) {
      dia.receitas += t.valor;
    } else {
      dia.despesas += Math.abs(t.valor);
    }
  });

  // Converter Map para array ordenado
  const historico30dias = Array.from(transacoesPorDia.entries())
    .map(([data, valores]) => ({
      data,
      receitas: valores.receitas,
      despesas: valores.despesas,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));

  // E. Normalizar contas_cartoes e metas
  const contasCartoes = Array.isArray(raw.contas_cartao) 
    ? raw.contas_cartao.map((c: any) => ({
        id: c.id,
        nome: c.nome,
        tipo: 'cartao_credito' as const,
        saldo: 0,
        limite: c.limite_credito,
      }))
    : Array.isArray(raw.contas_cartoes) ? raw.contas_cartoes : [];

  const metas = Array.isArray(raw.metas_financeiras)
    ? raw.metas_financeiras.map((m: any) => ({
        id: m.id,
        descricao: m.descricao,
        valor_total: m.valor_total,
        valor_guardado: m.valor_guardado,
        prazo: m.prazo,
        recorrencia: m.recorrencia ?? null,
        valor_mensal: m.valor_mensal ?? null,
        categoria: m.categoria,
      }))
    : Array.isArray(raw.metas) ? raw.metas : [];

  if (IS_DEV) {
    console.log('📊 Dados recebidos da API:', {
      saldo_total_geral: raw.saldo_total_geral,
      transacoes_no_periodo: transacoesDoPeriodo.length,
      filtros_aplicados: raw.filtros_aplicados,
    });

    console.log('📊 Dados processados:', {
      saldoTotal,
      receitaMensal,
      despesaMensal,
      totalTransacoes: transacoesDoPeriodo.length,
      limitesComGastos: limites.length,
    });
  }

  // ✅ Retornar dados processados (usando dados pré-filtrados da API)
  return {
    jid,
    saldo_total: saldoTotal,
    receita_mensal: receitaMensal,
    despesa_mensal: despesaMensal,
    transacoes: transacoesDoPeriodo,
    contas_cartoes: contasCartoes,
    categorias: Array.isArray(raw.categorias) ? raw.categorias : [],
    metas,
    recorrencias: Array.isArray(raw.recorrencias) ? raw.recorrencias : [],
    limites,
    historico_30dias: historico30dias,
  };
}

/**
 * Busca todos os dados do dashboard para o telefone do usuário
 * GET /dashboard-data?telefone=[TELEFONE]
 * Header: chave-dashboard-data
 * 
 * @throws ApiError com isNotFound=true quando 404
 */
export async function getDashboardData(phoneNumber: string, jid?: string): Promise<DashboardData> {
  try {
    const { data: dashboardResponse, error } = await supabase.functions.invoke('get-dashboard-data', {
      method: 'GET',
    });

    if (error) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        throw new ApiError(
          'Dados não encontrados. Configure seu dashboard primeiro.',
          404,
          true
        );
      }
      throw new ApiError(
        `Erro ao buscar dados: ${error.message}`,
        500
      );
    }

    const responseData = dashboardResponse;

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

    // ✅ Processar dados brutos e calcular valores agregados
    const processedData = processRawDashboardData(raw, jid || phoneNumber);

    return processedData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão com o servidor');
  }
}

/**
 * Envia um comando em linguagem natural para o backend processar
 * POST /dashboard-command?telefone=[TELEFONE]
 * Header: chave-dashboard-data
 * Body: { "command": "texto do usuário" }
 * 
 * Após sucesso (200), deve-se chamar getDashboardData() para atualizar a UI
 */
export async function postDashboardCommand(
  phoneNumber: string,
  command: string
): Promise<CommandResponse> {
  // Rate limiting: max 10 commands per minute
  if (!checkRateLimit('dashboard-command', { maxRequests: 10, windowMs: 60000 })) {
    const resetTime = Math.ceil(getRateLimitResetTime('dashboard-command', 60000) / 1000);
    throw new ApiError(
      `Muitas requisições. Tente novamente em ${resetTime}s.`,
      429
    );
  }

  // Input validation with zod schema
  const commandSchema = z.string()
    .trim()
    .min(1, 'Comando não pode estar vazio')
    .max(500, 'Comando muito longo. Máximo de 500 caracteres.')
    .regex(
      /^[a-zA-Z0-9\s\$\.,!?áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ\-]+$/,
      'Comando contém caracteres inválidos. Use apenas letras, números e pontuação básica.'
    );

  let trimmedCommand: string;
  try {
    trimmedCommand = commandSchema.parse(command);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(error.errors[0].message);
    }
    throw new ApiError('Comando inválido');
  }

  try {
    const { data: commandResponse, error } = await supabase.functions.invoke('send-dashboard-command', {
      body: { command: trimmedCommand },
    });

    if (error) {
      if (error.message?.includes('busy') || error.message?.includes('409')) {
        throw new ApiError(
          'O assistente está ocupado. Tente novamente em 5 segundos.',
          409
        );
      }
      throw new ApiError(
        `Erro ao processar comando: ${error.message}`,
        500
      );
    }

    return commandResponse as CommandResponse;
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
  // Rate limiting: max 3 attempts per hour per phone number
  const rateLimitKey = `send-code-${phoneNumber}`;
  if (!checkRateLimit(rateLimitKey, { maxRequests: 3, windowMs: 3600000 })) {
    const resetTime = Math.ceil(getRateLimitResetTime(rateLimitKey, 3600000) / 60000);
    throw new ApiError(
      `Muitas tentativas. Tente novamente em ${resetTime} minutos.`,
      429
    );
  }

  try {
    const { error } = await supabase.functions.invoke('send-verification-code', {
      body: { phoneNumber },
    });

    if (error) {
      throw new ApiError(
        'Erro ao enviar código de verificação',
        500
      );
    }

    if (IS_DEV) {
      console.log('✅ Código enviado via WhatsApp');
    }
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
  // Rate limiting: max 5 attempts per 15 minutes per phone number
  const rateLimitKey = `verify-code-${phoneNumber}`;
  if (!checkRateLimit(rateLimitKey, { maxRequests: 5, windowMs: 900000 })) {
    const resetTime = Math.ceil(getRateLimitResetTime(rateLimitKey, 900000) / 60000);
    throw new ApiError(
      `Muitas tentativas. Tente novamente em ${resetTime} minutos.`,
      429
    );
  }

  try {
    const { data: verifyResponse, error } = await supabase.functions.invoke('verify-code', {
      body: { phoneNumber, code },
    });

    if (error) {
      if (error.message?.includes('Invalid') || error.message?.includes('401')) {
        throw new ApiError('Código inválido ou expirado', 401);
      }
      throw new ApiError(
        `Erro ao verificar código: ${error.message}`,
        500
      );
    }
    
    if (!verifyResponse.access_token || !verifyResponse.jid) {
      throw new ApiError('Resposta inválida do servidor', 500);
    }

    // Set the session directly from the edge function response
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: verifyResponse.access_token,
      refresh_token: verifyResponse.refresh_token,
    });

    if (sessionError) {
      console.error('Erro ao definir sessão:', sessionError);
      throw new ApiError('Falha ao autenticar. Tente novamente.', 401);
    }

    console.log('✅ Login bem-sucedido:', verifyResponse.jid);
    
    return {
      jid: verifyResponse.jid,
      token: verifyResponse.access_token,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão ao verificar código');
  }
}
