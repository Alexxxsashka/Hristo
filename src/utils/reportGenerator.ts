import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, ServiceRequest } from '../types';
import { formatEnum } from './format';

export const generateOrdersReport = (orders: Order[], filters: { status: string, search: string, dateRange?: { start: Date, end: Date } }) => {
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
  const reportTitle = filters.dateRange 
    ? `ORDERS REVENUE REPORT (${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()})`
    : 'ORDERS REVENUE REPORT';
  doc.text(reportTitle, 14, 30);
  
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

export const generateProductsReport = (products: any[], orders: Order[], dateRange?: { start: Date, end: Date }) => {
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
  const reportTitle = dateRange 
    ? `PRODUCT PERFORMANCE (${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()})`
    : 'PRODUCT PERFORMANCE & INVENTORY REPORT';
  doc.text(reportTitle, 14, 30);
  
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

export const generateSingleOrderInvoice = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date(order.createdAt).toLocaleDateString();

  // --- Header ---
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HRISTO AIRSOFT STORE', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE / PURCHASE RECEIPT', 14, 35);
  
  doc.setFontSize(10);
  doc.text(`Order ID: #${order.id.slice(-8).toUpperCase()}`, pageWidth - 14, 25, { align: 'right' });
  doc.text(`Date: ${date}`, pageWidth - 14, 32, { align: 'right' });
  doc.text(`Status: ${order.status.toUpperCase()}`, pageWidth - 14, 39, { align: 'right' });

  let yPos = 65;

  // --- Billing & Shipping ---
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INFORMATION', 14, yPos);
  doc.text('SHIPPING ADDRESS', pageWidth / 2, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${order.shipping?.fullName || 'N/A'}`, 14, yPos + 6);
  doc.text(`${order.shipping?.email || 'N/A'}`, 14, yPos + 11);
  doc.text(`${order.shipping?.phone || 'N/A'}`, 14, yPos + 16);
  
  doc.text(`${order.shipping?.address || 'N/A'}`, pageWidth / 2, yPos + 6);
  doc.text(`${order.shipping?.city || 'N/A'}, ${order.shipping?.postalCode || ''}`, pageWidth / 2, yPos + 11);
  doc.text(`${order.shipping?.method === 'pickup' ? 'Local Pickup' : 'Standard Shipping'}`, pageWidth / 2, yPos + 16);

  // --- Order Items Table ---
  yPos += 30;
  
  const tableColumn = ["Product Description", "SKU", "Price", "Qty", "Total"];
  const tableRows = order.items.map(item => [
    item.name,
    item.sku || 'N/A',
    `EUR ${item.price.toFixed(2)}`,
    item.quantity,
    `EUR ${(item.price * item.quantity).toFixed(2)}`
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
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { fontStyle: 'bold', halign: 'right' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    }
  });

  // --- Financial Totals ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - 60;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(`EUR ${(order.total - (order.shippingCost || 0)).toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
  
  doc.text('Shipping:', summaryX, finalY + 6);
  doc.text(`EUR ${(order.shippingCost || 0).toFixed(2)}`, pageWidth - 14, finalY + 6, { align: 'right' });
  
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY + 10, pageWidth - 14, finalY + 10);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', summaryX, finalY + 18);
  doc.text(`EUR ${order.total.toFixed(2)}`, pageWidth - 14, finalY + 18, { align: 'right' });

  // --- Payment Info ---
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text(`Payment Method: ${order.payment?.method?.toUpperCase() || 'N/A'}`, 14, finalY + 10);
  doc.text(`Payment Status: ${order.payment?.status?.toUpperCase() || 'N/A'}`, 14, finalY + 15);
  if (order.payment?.transactionId) {
    doc.text(`Transaction ID: ${order.payment.transactionId}`, 14, finalY + 20);
  }

  // --- Footer ---
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('Thank you for shopping at Hristo Airsoft Store!', pageWidth / 2, pageWidth + 60, { align: 'center' }); // Offset might be wrong, using fixed pos
  doc.text('If you have any questions, contact us at shop@hristo.hr', pageWidth / 2, pageWidth + 65, { align: 'center' });

  // Save the PDF
  doc.save(`Invoice_${order.id.slice(-8).toUpperCase()}.pdf`);
};

export const exportOrdersToCSV = (orders: Order[]) => {
  const headers = ["Order ID", "Date", "Customer", "Email", "Items Count", "Status", "Total EUR"];
  const rows = orders.map(order => [
    order.id,
    new Date(order.createdAt).toISOString(),
    order.shipping?.fullName || 'Guest',
    order.shipping?.email || 'N/A',
    order.items.length,
    order.status,
    order.total.toFixed(2)
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateCommunicationsReport = (messages: any[], serviceRequests: ServiceRequest[], dateRange?: { start: Date, end: Date }) => {
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
  const reportTitle = dateRange 
    ? `COMMUNICATIONS REPORT (${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()})`
    : 'COMMUNICATIONS & SERVICE REQUESTS REPORT';
  doc.text(reportTitle, 14, 30);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, pageWidth - 14, 30, { align: 'right' });

  // --- Statistics Section ---
  let yPos = 50;
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY STATISTICS', 14, yPos);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Contact Messages: ${messages.length}`, 14, yPos + 8);
  doc.text(`Total Service Requests: ${serviceRequests.length}`, 14, yPos + 14);
  doc.text(`Pending Service Requests: ${serviceRequests.filter(r => r.status === 'Pending').length}`, 14, yPos + 20);

  // --- Combined Table ---
  yPos += 30;
  
  const tableColumn = ["Type", "Date", "Sender / Client", "Subject / Status", "Content Preview"];
  
  const msgRows = messages.map(m => [
    "MESSAGE",
    new Date(m.date).toLocaleDateString(),
    m.name,
    m.subject,
    m.message.slice(0, 50) + (m.message.length > 50 ? '...' : '')
  ]);

  const srRows = serviceRequests.map(r => [
    "SERVICE",
    new Date(r.date || Date.now()).toLocaleDateString(),
    r.userId,
    formatEnum(r.status).toUpperCase(),
    r.weaponName + " - " + r.description.slice(0, 30)
  ]);

  const tableRows = [...msgRows, ...srRows].sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());

  autoTable(doc, {
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      4: { cellWidth: 60 }
    },
    styles: { fontSize: 7.5, cellPadding: 2.5 }
  });

  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('End of Communications Report', pageWidth / 2, finalY, { align: 'center' });

  // Save the PDF
  doc.save(`Communications_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateDashboardStatsReport = (data: { 
  orders: Order[], 
  messages: any[], 
  serviceRequests: ServiceRequest[], 
  users: any[],
  dateRange: { start: Date, end: Date }
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleString();

  // --- Header ---
  doc.setFillColor(171, 16, 23); // #ab1017 - Hristo Red
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('HRISTO AIRSOFT STORE', 14, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`EXECUTIVE DASHBOARD PERFORMANCE REPORT`, 14, 35);
  doc.text(`${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`, 14, 41);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, pageWidth - 14, 41, { align: 'right' });

  // --- Key Metrics Section ---
  let yPos = 60;
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY PERFORMANCE INDICATORS (KPI)', 14, yPos);

  const totalRevenue = data.orders.reduce((sum, o) => sum + o.total, 0);
  const totalItems = data.orders.reduce((sum, o) => sum + o.items.length, 0);
  
  const metrics = [
    { label: 'Total Revenue', value: `EUR ${totalRevenue.toLocaleString()}`, color: [16, 185, 129] },
    { label: 'Total Orders', value: data.orders.length.toString(), color: [24, 24, 27] },
    { label: 'Total Items Sold', value: totalItems.toString(), color: [24, 24, 27] },
    { label: 'New Communications', value: (data.messages.length + data.serviceRequests.length).toString(), color: [24, 24, 27] },
    { label: 'Service Volume', value: data.serviceRequests.length.toString(), color: [24, 24, 27] },
    { label: 'New Registered Users', value: data.users.length.toString(), color: [24, 24, 27] }
  ];

  yPos += 15;
  metrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 14 + (col * (pageWidth / 2 - 14));
    const y = yPos + (row * 15);
    
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, x, y);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 50, y);
  });

  // --- Order Breakdown Table ---
  yPos += 50;
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES BREAKDOWN BY STATUS', 14, yPos);

  const statusCounts = data.orders.reduce((acc: any, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const statusRows = Object.entries(statusCounts).map(([status, count]) => [
    formatEnum(status).toUpperCase(),
    count,
    ((Number(count) / data.orders.length) * 100).toFixed(1) + '%'
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Status", "Order Count", "Percentage"]],
    body: statusRows,
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
    styles: { halign: 'center' }
  });

  // --- Top Products Summary ---
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP PERFORMING PRODUCTS', 14, yPos);

  const productSales = new Map<string, { name: string, qty: number, revenue: number }>();
  data.orders.forEach(o => {
    o.items.forEach(item => {
      const current = productSales.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
      productSales.set(item.productId, {
        name: item.name,
        qty: current.qty + item.quantity,
        revenue: current.revenue + (item.price * item.quantity)
      });
    });
  });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map(p => [p.name, p.qty, `EUR ${p.revenue.toLocaleString()}`]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Product Name", "Units Sold", "Total Revenue"]],
    body: topProducts,
    theme: 'striped',
    headStyles: { fillColor: [171, 16, 23] }
  });

  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('Hristo Airsoft Store - Internal Business Intelligence Report', pageWidth / 2, 280, { align: 'center' });
  doc.text(`Page 1 of 1`, pageWidth - 14, 280, { align: 'right' });

  // Save the PDF
  doc.save(`Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateUsersReport = (users: any[], dateRange?: { start: Date, end: Date }) => {
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
  const reportTitle = dateRange 
    ? `USER REGISTRY & ROLES AUDIT (${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()})`
    : 'USER REGISTRY & SECURITY ROLES REPORT';
  doc.text(reportTitle, 14, 30);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, pageWidth - 14, 30, { align: 'right' });

  // --- Statistics calculation ---
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'manager').length;
  const standardUsersCount = users.filter(u => u.role !== 'admin' && u.role !== 'manager').length;

  // --- Summary Section ---
  let yPos = 50;
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('USER POPULATION SUMMARY', 14, yPos);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Accounts: ${totalUsers}`, 14, yPos + 8);
  doc.text(`Administrators (admin): ${adminCount}`, 14, yPos + 14);
  
  const summaryX = pageWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('ROLE BREAKDOWN', summaryX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`Managers (manager): ${managerCount}`, summaryX, yPos + 8);
  doc.text(`Customers (user): ${standardUsersCount}`, summaryX, yPos + 14);

  // --- Users Table ---
  yPos += 25;
  
  const tableColumn = ["User ID", "Name", "Email", "Phone", "Role", "Rank", "Registered"];
  const tableRows = users.map(u => [
    u.id.slice(-8).toUpperCase(),
    u.username || 'N/A',
    u.email || 'N/A',
    u.phone || 'N/A',
    (u.role || 'user').toUpperCase(),
    (u.rank || 'recruit').toUpperCase(),
    u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      4: { fontStyle: 'bold', halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.text[0] === 'ADMIN') {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
        } else if (data.cell.text[0] === 'MANAGER') {
          data.cell.styles.textColor = [37, 99, 235]; // blue-600
        }
      }
    }
  });

  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('Confidential - User Registry & System Roles Security Audit', pageWidth / 2, finalY, { align: 'center' });

  // Save the PDF
  doc.save(`Users_Roles_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
