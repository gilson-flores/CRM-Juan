import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type PdfQuoteData = {
  quoteNumber: string;
  date: string;
  clientName: string;
  clientDoc?: string;
  clientPhone?: string;
  clientEmail?: string;
  address: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  observations?: string;
};

export const generateQuotePdf = (data: PdfQuoteData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryOrange = [255, 122, 0] as [number, number, number];
  const darkBg = [20, 20, 24] as [number, number, number];
  const grayText = [100, 100, 110] as [number, number, number];

  // Top Banner
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 210, 38, 'F');

  // Orange Accent Line
  doc.setFillColor(...primaryOrange);
  doc.rect(0, 38, 210, 2, 'F');

  // Company Name & Slogan
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('JC ELETRICISTA', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryOrange);
  doc.text('SERVIÇOS ELÉTRICOS RESIDENCIAIS E COMERCIAIS', 14, 23);

  doc.setTextColor(190, 190, 200);
  doc.setFontSize(8);
  doc.text('Instalações • Manutenções • Quadros • Padrão de Entrada • Laudos', 14, 30);

  // Quote Meta Info (Right side of header)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ORÇAMENTO', 196, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text(`Nº: ${data.quoteNumber || '2026-001'}`, 196, 23, { align: 'right' });
  doc.text(`Data: ${data.date || new Date().toLocaleDateString('pt-BR')}`, 196, 30, { align: 'right' });

  // Client Info Box
  let y = 48;
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 228, 232);
  doc.roundedRect(14, y, 182, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryOrange);
  doc.text('DADOS DO CLIENTE & LOCAL DA OBRA', 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 24);
  doc.text(data.clientName || 'Cliente não informado', 18, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  const addressText = data.address ? `Local: ${data.address}` : 'Local: Conforme combinado';
  doc.text(addressText, 18, y + 19);

  const contactInfo = [
    data.clientPhone ? `Tel/Whats: ${data.clientPhone}` : '',
    data.clientDoc ? `CPF/CNPJ: ${data.clientDoc}` : '',
    data.clientEmail ? `E-mail: ${data.clientEmail}` : ''
  ].filter(Boolean).join('  |  ');

  if (contactInfo) {
    doc.setFontSize(8);
    doc.text(contactInfo, 18, y + 25);
  }

  // Items Table
  const tableRows = data.items.map((item, index) => [
    (index + 1).toString().padStart(2, '0'),
    item.description,
    item.quantity.toString(),
    `R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `R$ ${(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: y + 36,
    head: [['Item', 'Descrição do Serviço / Material', 'Qtd', 'V. Unitário', 'Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [20, 20, 24],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 45],
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Summary / Totals
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  let totalsY = finalY + 8;

  // If table is near bottom, create new page
  if (totalsY > 230) {
    doc.addPage();
    totalsY = 20;
  }

  // Totals Box (Right aligned)
  const totalsBoxX = 116;
  const totalsBoxWidth = 80;
  
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 228, 232);
  doc.roundedRect(totalsBoxX, totalsY, totalsBoxWidth, data.discount > 0 ? 34 : 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text('Subtotal:', totalsBoxX + 6, totalsY + 8);
  doc.text(`R$ ${data.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 6, totalsY + 8, { align: 'right' });

  if (data.discount > 0) {
    doc.text('Desconto:', totalsBoxX + 6, totalsY + 16);
    doc.setTextColor(220, 38, 38);
    doc.text(`- R$ ${data.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 6, totalsY + 16, { align: 'right' });
    
    // Total row
    doc.setDrawColor(220, 220, 225);
    doc.line(totalsBoxX + 6, totalsY + 20, totalsBoxX + totalsBoxWidth - 6, totalsY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 24);
    doc.text('TOTAL:', totalsBoxX + 6, totalsY + 28);
    doc.setTextColor(...primaryOrange);
    doc.text(`R$ ${data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 6, totalsY + 28, { align: 'right' });
  } else {
    // Total row without discount
    doc.setDrawColor(220, 220, 225);
    doc.line(totalsBoxX + 6, totalsY + 12, totalsBoxX + totalsBoxWidth - 6, totalsY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 24);
    doc.text('TOTAL:', totalsBoxX + 6, totalsY + 20);
    doc.setTextColor(...primaryOrange);
    doc.text(`R$ ${data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 6, totalsY + 20, { align: 'right' });
  }

  // Observations Box (Left aligned)
  const obsWidth = 96;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 228, 232);
  doc.roundedRect(14, totalsY, obsWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryOrange);
  doc.text('OBSERVAÇÕES & CONDIÇÕES', 18, totalsY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 90);
  const obsContent = data.observations || '• Orçamento válido por 15 dias corridos.\n• Garantia sobre os serviços executados.\n• Materiais por conta do contratante, salvo acordo prévio.';
  const splitObs = doc.splitTextToSize(obsContent, obsWidth - 8);
  doc.text(splitObs, 18, totalsY + 12);

  // Signatures at bottom
  let sigY = Math.max(totalsY + 44, 255);
  if (sigY > 270) {
    doc.addPage();
    sigY = 250;
  }

  doc.setDrawColor(180, 180, 190);
  doc.line(20, sigY, 90, sigY);
  doc.line(120, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text('JC Eletricista', 55, sigY + 5, { align: 'center' });
  doc.text('Assinatura do Cliente / Aceite', 155, sigY + 5, { align: 'center' });

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 170);
  doc.text('Documento gerado pelo sistema JC Eletricista CRM • Salvo em Google Sheets & Drive', 105, 290, { align: 'center' });

  // Generate File & Trigger Safe Download across iOS & Android
  const fileName = `Orcamento_${(data.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}_${data.quoteNumber || Date.now()}.pdf`;
  
  // Safe cross-platform save:
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Trigger download / open
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  return { doc, blobUrl, fileName };
};
