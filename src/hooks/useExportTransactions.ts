import * as XLSX from 'xlsx';
import { Transaction } from '@/types/dashboard';
import { CategorySpending, MonthlyComparison } from '@/types/analytics';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportableTransaction {
  Data: string;
  Descrição: string;
  Categoria: string;
  Conta: string;
  Tipo: string;
  Valor: number;
}

export interface FullExportData {
  transactions: Transaction[];
  categorySpending: CategorySpending[];
  monthlyComparison: MonthlyComparison[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  periodo: { from: Date; to: Date };
  currency: string;
}

function removeEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

function formatTransactionsForExport(transactions: Transaction[]): ExportableTransaction[] {
  return transactions.map(t => ({
    Data: format(new Date(t.data + 'T12:00:00'), 'dd/MM/yyyy'),
    Descrição: t.descricao || '',
    Categoria: t.categoria || '',
    Conta: t.conta_cartao || '',
    Tipo: t.valor < 0 ? 'Despesa' : 'Receita',
    Valor: t.valor,
  }));
}

export function useExportTransactions() {
  const exportToExcel = (transactions: Transaction[], filename: string = 'transacoes') => {
    const data = formatTransactionsForExport(transactions);
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajustar largura das colunas
    worksheet['!cols'] = [
      { wch: 12 }, // Data
      { wch: 40 }, // Descrição
      { wch: 18 }, // Categoria
      { wch: 18 }, // Conta
      { wch: 10 }, // Tipo
      { wch: 15 }, // Valor
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToCSV = (transactions: Transaction[], filename: string = 'transacoes') => {
    const data = formatTransactionsForExport(transactions);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportFullReport = (exportData: FullExportData, filename: string = 'planejamento-financeiro') => {
    const workbook = XLSX.utils.book_new();
    const { transactions, categorySpending, monthlyComparison, totalReceitas, totalDespesas, saldo, periodo } = exportData;

    // Calcular total de despesas para percentual
    const totalDespesasAbs = transactions
      .filter(t => t.valor < 0)
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);

    // === ABA 1: RESUMO ===
    const periodoTexto = `${format(periodo.from, "MMMM 'de' yyyy", { locale: ptBR })} - ${format(periodo.to, "MMMM 'de' yyyy", { locale: ptBR })}`;
    
    const resumoData: (string | number)[][] = [
      ['PLANEJAMENTO FINANCEIRO'],
      [''],
      ['Período:', periodoTexto],
      [''],
      ['═══════════════════════════════════════════════════'],
      ['RESUMO FINANCEIRO'],
      ['═══════════════════════════════════════════════════'],
      [''],
      ['Total de Receitas:', totalReceitas],
      ['Total de Despesas:', totalDespesas],
      [''],
      ['Sobra/Perda:', saldo],
      [''],
      ['═══════════════════════════════════════════════════'],
      ['GASTOS POR CATEGORIA'],
      ['═══════════════════════════════════════════════════'],
      [''],
      ['Categoria', 'Valor', 'Qtd', '%'],
      ...categorySpending.map(c => [
        removeEmojis(c.categoria),
        c.total,
        c.quantidade,
        `${c.porcentagem.toFixed(1)}%`
      ]),
      [''],
      ['TOTAL DESPESAS:', totalDespesas, '', '100%']
    ];
    
    const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
    resumoSheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 8 },
      { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, resumoSheet, 'RESUMO');

    // === ABA 2: TRANSAÇÕES COMPLETAS ===
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    const transacoesData = sortedTransactions.map(t => {
      const percentual = t.valor < 0 && totalDespesasAbs > 0
        ? ((Math.abs(t.valor) / totalDespesasAbs) * 100).toFixed(2)
        : '';
      
      return {
        'Data': format(parseISO(t.data), 'dd/MM/yyyy'),
        '%': percentual,
        'Status': t.valor >= 0 ? 'recebido' : 'pago',
        'Categoria': removeEmojis(t.categoria || ''),
        'Descrição': t.descricao || '',
        'Valor': t.valor,
        'Situação': t.recorrente ? 'Fixo' : 'Variável',
        'Conta': t.conta_cartao || '',
        'Tipo': t.valor >= 0 ? 'Receita' : 'Despesa'
      };
    });
    
    const transacoesSheet = XLSX.utils.json_to_sheet(transacoesData);
    transacoesSheet['!cols'] = [
      { wch: 12 }, // Data
      { wch: 7 },  // %
      { wch: 10 }, // Status
      { wch: 22 }, // Categoria
      { wch: 40 }, // Descrição
      { wch: 14 }, // Valor
      { wch: 10 }, // Situação
      { wch: 20 }, // Conta
      { wch: 10 }, // Tipo
    ];
    XLSX.utils.book_append_sheet(workbook, transacoesSheet, 'TRANSAÇÕES');

    // === ABA 3: COMPARAÇÃO MENSAL ===
    const comparacaoData: (string | number)[][] = [
      ['COMPARAÇÃO MENSAL'],
      [''],
      ['Mês', 'Receitas', 'Despesas', 'Saldo'],
      ...monthlyComparison.map(m => [
        m.mesNome,
        m.receitas,
        m.despesas,
        m.saldo
      ]),
      [''],
      ['TOTAIS:', totalReceitas, totalDespesas, saldo]
    ];
    
    const comparacaoSheet = XLSX.utils.aoa_to_sheet(comparacaoData);
    comparacaoSheet['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, comparacaoSheet, 'MENSAL');

    // === ABAS POR MÊS ===
    monthlyComparison.forEach(month => {
      const monthTransactions = transactions.filter(t => 
        format(parseISO(t.data), 'yyyy-MM') === month.mes
      ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      if (monthTransactions.length > 0) {
        // Calcular total de despesas do mês
        const monthDespesas = monthTransactions
          .filter(t => t.valor < 0)
          .reduce((sum, t) => sum + Math.abs(t.valor), 0);

        const monthData = monthTransactions.map(t => {
          const percentual = t.valor < 0 && monthDespesas > 0
            ? ((Math.abs(t.valor) / monthDespesas) * 100).toFixed(2)
            : '';
          
          return {
            'Data': format(parseISO(t.data), 'dd/MM/yyyy'),
            '%': percentual,
            'Status': t.valor >= 0 ? 'recebido' : 'pago',
            'Categoria': removeEmojis(t.categoria || ''),
            'Descrição': t.descricao || '',
            'Valor': t.valor,
            'Situação': t.recorrente ? 'Fixo' : 'Variável',
          };
        });
        
        const monthSheet = XLSX.utils.json_to_sheet(monthData);
        monthSheet['!cols'] = [
          { wch: 12 }, // Data
          { wch: 7 },  // %
          { wch: 10 }, // Status
          { wch: 22 }, // Categoria
          { wch: 40 }, // Descrição
          { wch: 14 }, // Valor
          { wch: 10 }, // Situação
        ];
        
        // Nome da aba: "DEZ 2025" (máx 31 caracteres)
        const tabName = format(parseISO(`${month.mes}-01`), 'MMM yyyy', { locale: ptBR }).toUpperCase();
        XLSX.utils.book_append_sheet(workbook, monthSheet, tabName.substring(0, 31));
      }
    });
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return { exportToExcel, exportToCSV, exportFullReport };
}
