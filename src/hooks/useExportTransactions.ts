import XLSX from 'xlsx-js-style';
import { Transaction } from '@/types/dashboard';
import { CategorySpending, MonthlyComparison } from '@/types/analytics';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { removeEmojis } from '@/lib/utils';

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

// Estilos para xlsx-js-style
const styles = {
  // Título principal - azul escuro
  titulo: {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1F4E79' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  // Subtítulo
  subtitulo: {
    font: { bold: true, sz: 12, color: { rgb: '1F4E79' } },
    alignment: { horizontal: 'center' },
  },
  // Cabeçalho de seção
  sectionHeader: {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Cabeçalho da tabela - azul médio
  tableHeader: {
    font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Célula de categoria no resumo - azul claro
  categoriaResumo: {
    fill: { fgColor: { rgb: 'BDD7EE' } },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Status "pago" - verde claro
  pago: {
    font: { color: { rgb: '006100' } },
    fill: { fgColor: { rgb: 'C6EFCE' } },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Status "recebido" - azul claro
  recebido: {
    font: { color: { rgb: '1F4E79' } },
    fill: { fgColor: { rgb: 'DDEBF7' } },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Linha par (alternância)
  evenRow: {
    fill: { fgColor: { rgb: 'F2F2F2' } },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Linha ímpar
  oddRow: {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Valor positivo (receita)
  valorPositivo: {
    font: { color: { rgb: '006100' }, bold: true },
    numFmt: '#,##0.00',
    alignment: { horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Valor negativo (despesa)
  valorNegativo: {
    font: { color: { rgb: 'C00000' } },
    numFmt: '#,##0.00',
    alignment: { horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Total destacado
  total: {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: 'FCE4D6' } },
    border: {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'medium', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Label
  label: {
    font: { bold: true },
    alignment: { horizontal: 'left' },
  },
  // Borda padrão
  bordered: {
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
};

export function useExportTransactions() {
  const exportToExcel = (transactions: Transaction[], filename: string = 'transacoes') => {
    const data = formatTransactionsForExport(transactions);
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 15 },
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

    // Preparar dados
    const mesNome = format(periodo.from, 'MMMM', { locale: ptBR });
    const ano = format(periodo.from, 'yyyy');
    
    // Agrupar receitas
    const receitasAgrupadas = transactions
      .filter(t => t.valor >= 0)
      .reduce((acc, t) => {
        const key = removeEmojis(t.descricao || 'Outros');
        if (!acc[key]) acc[key] = 0;
        acc[key] += t.valor;
        return acc;
      }, {} as Record<string, number>);
    
    const receitasList = Object.entries(receitasAgrupadas).map(([desc, valor]) => ({ desc, valor }));
    
    // Preparar transações ordenadas (mais recentes primeiro)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    // Construir sheet única
    const sheetData: any[][] = [];
    let currentRow = 0;

    // === LINHA 1: TÍTULO ===
    sheetData.push([
      { v: 'PLANEJAMENTO FINANCEIRO', s: styles.titulo },
      { v: '', s: styles.titulo },
      { v: '', s: styles.titulo },
      { v: '', s: styles.titulo },
      { v: '', s: styles.titulo },
      { v: '', s: styles.titulo },
      { v: '', s: styles.titulo },
    ]);
    currentRow++;

    // === LINHA 2: MÊS E ANO ===
    sheetData.push([
      { v: 'Mês:', s: styles.label },
      { v: mesNome.charAt(0).toUpperCase() + mesNome.slice(1), s: { alignment: { horizontal: 'left' } } },
      { v: '', s: {} },
      { v: 'Ano:', s: styles.label },
      { v: ano, s: { alignment: { horizontal: 'left' } } },
      { v: '', s: {} },
      { v: '', s: {} },
    ]);
    currentRow++;

    // Linha vazia
    sheetData.push([]);
    currentRow++;

    // === LINHA 4: CABEÇALHOS DAS SEÇÕES ===
    sheetData.push([
      { v: 'RECEITAS', s: styles.sectionHeader },
      { v: '', s: styles.sectionHeader },
      { v: 'DESPESAS', s: styles.sectionHeader },
      { v: '', s: styles.sectionHeader },
      { v: 'CATEGORIAS', s: styles.sectionHeader },
      { v: '', s: styles.sectionHeader },
      { v: '', s: styles.sectionHeader },
    ]);
    currentRow++;

    // === LINHAS 5+: DADOS DAS SEÇÕES (lado a lado) ===
    const maxRows = Math.max(receitasList.length + 1, categorySpending.length + 2);
    
    for (let i = 0; i < maxRows; i++) {
      const row: any[] = [];
      
      // Coluna Receitas (A-B)
      if (i < receitasList.length) {
        row.push(
          { v: receitasList[i].desc, s: styles.bordered },
          { v: receitasList[i].valor, s: { ...styles.valorPositivo, fill: { fgColor: { rgb: 'E2EFDA' } } } }
        );
      } else if (i === receitasList.length) {
        row.push(
          { v: 'Total Receitas', s: styles.total },
          { v: totalReceitas, s: { ...styles.total, ...styles.valorPositivo } }
        );
      } else {
        row.push({ v: '', s: {} }, { v: '', s: {} });
      }

      // Coluna Despesas (C-D)
      if (i === 0) {
        row.push(
          { v: 'Total Pago', s: styles.bordered },
          { v: totalDespesas, s: { ...styles.valorNegativo, fill: { fgColor: { rgb: 'FCE4D6' } } } }
        );
      } else if (i === 1) {
        row.push(
          { v: 'Sobra/Perda', s: styles.total },
          { v: saldo, s: saldo >= 0 
            ? { ...styles.total, font: { bold: true, color: { rgb: '006100' } } }
            : { ...styles.total, font: { bold: true, color: { rgb: 'C00000' } } }
          }
        );
      } else {
        row.push({ v: '', s: {} }, { v: '', s: {} });
      }

      // Coluna Categorias (E-G)
      if (i < categorySpending.length) {
        const cat = categorySpending[i];
        row.push(
          { v: removeEmojis(cat.categoria), s: styles.categoriaResumo },
          { v: cat.total, s: { ...styles.valorNegativo, fill: { fgColor: { rgb: 'BDD7EE' } } } },
          { v: `${cat.porcentagem.toFixed(1)}%`, s: { ...styles.categoriaResumo, alignment: { horizontal: 'right' } } }
        );
      } else {
        row.push({ v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} });
      }

      sheetData.push(row);
      currentRow++;
    }

    // Linhas vazias antes da tabela
    sheetData.push([]);
    sheetData.push([]);
    currentRow += 2;

    // === CABEÇALHO DA TABELA DE TRANSAÇÕES ===
    sheetData.push([
      { v: '%', s: styles.tableHeader },
      { v: 'STATUS', s: styles.tableHeader },
      { v: 'CATEGORIA', s: styles.tableHeader },
      { v: 'DESCRIÇÃO', s: styles.tableHeader },
      { v: 'VALOR', s: styles.tableHeader },
      { v: 'SITUAÇÃO', s: styles.tableHeader },
      { v: 'CONTA', s: styles.tableHeader },
    ]);
    currentRow++;

    // === LINHAS DE TRANSAÇÕES ===
    sortedTransactions.forEach((t, index) => {
      const percentual = t.valor < 0 && totalDespesasAbs > 0
        ? ((Math.abs(t.valor) / totalDespesasAbs) * 100).toFixed(2)
        : '';
      
      const rowStyle = index % 2 === 0 ? styles.evenRow : styles.oddRow;
      const statusStyle = t.valor >= 0 ? styles.recebido : styles.pago;
      const valorStyle = t.valor >= 0 
        ? { ...styles.valorPositivo, fill: rowStyle.fill }
        : { ...styles.valorNegativo, fill: rowStyle.fill };

      sheetData.push([
        { v: percentual, s: { ...rowStyle, alignment: { horizontal: 'center' } } },
        { v: t.valor >= 0 ? 'recebido' : 'pago', s: statusStyle },
        { v: removeEmojis(t.categoria || ''), s: rowStyle },
        { v: t.descricao || '', s: rowStyle },
        { v: t.valor, s: valorStyle },
        { v: t.recorrente ? 'Fixo' : 'Variável', s: { ...rowStyle, alignment: { horizontal: 'center' } } },
        { v: t.conta_cartao || '', s: rowStyle },
      ]);
      currentRow++;
    });

    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Definir larguras de coluna
    ws['!cols'] = [
      { wch: 22 },  // Receita/% 
      { wch: 15 },  // Valor/Status
      { wch: 22 },  // Despesa/Categoria
      { wch: 38 },  // Valor/Descrição
      { wch: 14 },  // Categoria/Valor
      { wch: 12 },  // Valor/Situação
      { wch: 20 },  // %/Conta
    ];

    // Mesclar título
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    ];

    // Definir altura da linha do título
    ws['!rows'] = [{ hpt: 30 }];

    XLSX.utils.book_append_sheet(workbook, ws, 'RESUMO');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return { exportToExcel, exportToCSV, exportFullReport };
}