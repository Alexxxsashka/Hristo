import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';
import { formatEnum } from './format';

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

  autoTable(doc, {
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

export const generateProductsReport = (products: any[], orders: Order[]) => {
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
  doc.text('PRODUCT PERFORMANCE & INVENTORY REPORT', 14, 30);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, pageWidth - 14, 30, { align: 'right' });

  // --- Analytics Calculation ---
  const salesMap = new Map<string, { qty: number, revenue: number }>();
  orders.forEach(order => {
    if (order.status === 'cancelled' || order.status === 'refunded') return;
    order.items.forEach(item => {
      const current = salesMap.get(item.productId) || { qty: 0, revenue: 0 };
      salesMap.set(item.productId, {
        qty: current.qty + item.quantity,
        revenue: current.revenue + (item.price * item.quantity)
      });
    });
  });

  const outOfStockProducts = products.filter(p => (p.stock || 0) <= 0);
  const totalItemsSold = Array.from(salesMap.values()).reduce((sum, s) => sum + s.qty, 0);
  const totalStockValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

  // --- Summary Section ---
  let yPos = 50;
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTORY SUMMARY', 14, yPos);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Unique Products: ${products.length}`, 14, yPos + 8);
  doc.text(`Out of Stock: ${outOfStockProducts.length}`, 14, yPos + 14);
  doc.text(`Sold Units (All Time): ${totalItemsSold}`, 14, yPos + 20);
  
  const summaryX = pageWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('STOCK VALUE & PERFORMANCE', summaryX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estimated Stock Value: EUR ${totalStockValue.toLocaleString()}`, summaryX, yPos + 8);
  doc.text(`Top Selling Products Table Below`, summaryX, yPos + 14);

  // --- Products Table ---
  yPos += 30;
  
  const tableColumn = ["Product Name", "SKU", "Sold", "Revenue", "Stock", "Status"];
  const tableRows = products
    .map(p => {
      const sales = salesMap.get(p.id) || { qty: 0, revenue: 0 };
      const status = (p.stock || 0) <= 0 ? 'OUT OF STOCK' : ((p.stock || 0) < 5 ? 'LOW STOCK' : 'ACTIVE');
      return [
        p.name,
        p.sku || 'N/A',
        sales.qty,
        `EUR ${sales.revenue.toFixed(2)}`,
        p.stock || 0,
        status
      ];
    })
    .sort((a, b) => (b[2] as number) - (a[2] as number)); // Sort by sold quantity

  autoTable(doc, {
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 60 },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { fontStyle: 'bold', halign: 'center' }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.text[0] === 'OUT OF STOCK') {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
        } else if (data.cell.text[0] === 'LOW STOCK') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        }
      }
    }
  });

  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('Confidential - Inventory Analysis Report', pageWidth / 2, finalY, { align: 'center' });

  // Save the PDF
  doc.save(`Products_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
