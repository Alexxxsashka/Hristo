import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Order } from '../types';
import { formatEnum } from './format';

// Add type definition for jspdf-autotable to avoid TS errors
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateOrdersReport = (orders: Order[], filters: { status: string, search: string }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleString();

  // --- Header ---
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HRISTO AIRSOFT STORE', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ORDERS REVENUE REPORT', 14, 30);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, pageWidth - 14, 30, { align: 'right' });

  // --- Filters Info ---
  let yPos = 50;
  doc.setTextColor(113, 113, 122); // zinc-500
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT PARAMETERS', 14, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Status Filter: ${formatEnum(filters.status)}`, 14, yPos + 6);
  doc.text(`Search Query: ${filters.search || 'None'}`, 14, yPos + 12);
  doc.text(`Results Count: ${orders.length}`, 14, yPos + 18);

  // --- Financial Summary ---
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);

  const summaryX = pageWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('FINANCIAL SUMMARY', summaryX, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Revenue:`, summaryX, yPos + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`EUR ${totalRevenue.toFixed(2)}`, summaryX + 35, yPos + 6);
  
  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'normal');
  doc.text(`Avg. Order Value:`, summaryX, yPos + 12);
  doc.text(`EUR ${avgOrderValue.toFixed(2)}`, summaryX + 35, yPos + 12);
  
  doc.text(`Total Items Sold:`, summaryX, yPos + 18);
  doc.text(`${totalItems} units`, summaryX + 35, yPos + 18);

  // --- Orders Table ---
  yPos += 30;
  
  const tableColumn = ["Order ID", "Customer", "Date", "Items", "Status", "Total"];
  const tableRows = orders.map(order => [
    order.id.slice(-8).toUpperCase(),
    order.shipping?.fullName || 'Guest',
    new Date(order.createdAt).toLocaleDateString(),
    order.items.length,
    formatEnum(order.status).toUpperCase(),
    `EUR ${order.total.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      3: { halign: 'center' },
      4: { fontStyle: 'bold', halign: 'center' },
      5: { fontStyle: 'bold', halign: 'right' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    }
  });

  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170); // zinc-400
  doc.text('End of Report', pageWidth / 2, finalY, { align: 'center' });

  // Save the PDF
  doc.save(`Orders_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
