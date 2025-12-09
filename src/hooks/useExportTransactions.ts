import * as XLSX from 'xlsx';
import { Transaction } from '@/types/dashboard';
import { format } from 'date-fns';

interface ExportableTransaction {
  Data: string;
  Descrição: string;
  Categoria: string;
  Conta: string;
  Tipo: string;
  Valor: number;
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

  return { exportToExcel, exportToCSV };
}
