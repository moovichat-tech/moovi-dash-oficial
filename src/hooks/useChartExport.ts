import { RefObject } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ExportOptions {
  filename: string;
  quality?: number;
  backgroundColor?: string;
}

export function useChartExport() {
  /**
   * Exporta um elemento para PNG
   */
  const exportToPNG = async (
    elementRef: RefObject<HTMLElement>,
    options: ExportOptions
  ): Promise<void> => {
    if (!elementRef.current) {
      toast.error('Erro ao capturar gráfico');
      return;
    }

    try {
      toast.loading('Gerando imagem...');

      // Capturar o elemento como canvas
      const canvas = await html2canvas(elementRef.current, {
        scale: 2, // Alta qualidade
        backgroundColor: options.backgroundColor || '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Converter canvas para blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Erro ao gerar imagem');
          return;
        }

        // Criar link de download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${options.filename}.png`;
        link.href = url;
        link.click();

        // Limpar
        URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Imagem exportada com sucesso!');
      }, 'image/png', options.quality || 0.95);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      toast.dismiss();
      toast.error('Erro ao exportar imagem');
    }
  };

  /**
   * Exporta um elemento para PDF
   */
  const exportToPDF = async (
    elementRef: RefObject<HTMLElement>,
    options: ExportOptions
  ): Promise<void> => {
    if (!elementRef.current) {
      toast.error('Erro ao capturar gráfico');
      return;
    }

    try {
      toast.loading('Gerando PDF...');

      // Capturar o elemento como canvas
      const canvas = await html2canvas(elementRef.current, {
        scale: 2,
        backgroundColor: options.backgroundColor || '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Calcular dimensões do PDF (A4)
      const imgWidth = 210; // mm (A4 width)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Criar PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Adicionar imagem ao PDF
      const imgData = canvas.toDataURL('image/png', options.quality || 0.95);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Download
      pdf.save(`${options.filename}.pdf`);

      toast.dismiss();
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.dismiss();
      toast.error('Erro ao exportar PDF');
    }
  };

  /**
   * Exporta múltiplos elementos para um único PDF
   */
  const exportMultipleToPDF = async (
    elements: { ref: RefObject<HTMLElement>; title: string }[],
    filename: string,
    backgroundColor?: string
  ): Promise<void> => {
    try {
      toast.loading('Gerando PDF completo...');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let isFirstPage = true;

      for (const element of elements) {
        if (!element.ref.current) continue;

        // Adicionar nova página (exceto primeira)
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Capturar elemento
        const canvas = await html2canvas(element.ref.current, {
          scale: 2,
          backgroundColor: backgroundColor || '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        // Calcular dimensões
        const imgWidth = 190; // mm (deixar margens)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Adicionar título
        pdf.setFontSize(16);
        pdf.text(element.title, 10, 10);

        // Adicionar imagem
        const imgData = canvas.toDataURL('image/png', 0.95);
        pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
      }

      // Download
      pdf.save(`${filename}.pdf`);

      toast.dismiss();
      toast.success('PDF completo exportado!');
    } catch (error) {
      console.error('Erro ao exportar PDF múltiplo:', error);
      toast.dismiss();
      toast.error('Erro ao exportar PDF completo');
    }
  };

  return {
    exportToPNG,
    exportToPDF,
    exportMultipleToPDF,
  };
}
