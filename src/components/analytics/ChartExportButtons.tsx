import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileImage, FileText } from 'lucide-react';
import { useChartExport } from '@/hooks/useChartExport';

interface ChartExportButtonsProps {
  chartRef: RefObject<HTMLDivElement>;
  filename: string;
  className?: string;
}

export function ChartExportButtons({ 
  chartRef, 
  filename,
  className 
}: ChartExportButtonsProps) {
  const { exportToPNG, exportToPDF } = useChartExport();

  const handleExportPNG = () => {
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    
    exportToPNG(chartRef, { 
      filename,
      backgroundColor: bgColor ? `hsl(${bgColor})` : '#ffffff'
    });
  };

  const handleExportPDF = () => {
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    
    exportToPDF(chartRef, { 
      filename,
      backgroundColor: bgColor ? `hsl(${bgColor})` : '#ffffff'
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPNG}>
          <FileImage className="h-4 w-4 mr-2" />
          Exportar como PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
