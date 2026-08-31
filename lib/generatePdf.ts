import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CompanySettings } from './firebase';
import { logger } from './logger';
import { getAssetUrl } from './assetHelper';

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
  companySettings?: Partial<CompanySettings>;
  includeWarranty?: boolean;
  documentType?: 'orcamento' | 'ordem_servico';
};

const createLogoBadgeCanvas = (phone = '47 99706-4183', instagram = 'jc_eletricistajoinville'): string => {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw background rounded rectangle (top corners rounded)
    const r = 50;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    
    // Fill base gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, size);
    bgGrad.addColorStop(0, '#141418');
    bgGrad.addColorStop(0.5, '#0c0c0f');
    bgGrad.addColorStop(1, '#060608');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Subtle Carbon Fiber / Diagonal Striped Texture
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 4;
    for (let x = -size; x < size * 2; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size, size);
      ctx.stroke();
    }
    ctx.restore();

    // Subtle card border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#262630';
    ctx.stroke();

    // Inner orange glow behind JC
    const radial = ctx.createRadialGradient(size / 2, 190, 10, size / 2, 190, 160);
    radial.addColorStop(0, 'rgba(255, 122, 0, 0.25)');
    radial.addColorStop(0.6, 'rgba(255, 122, 0, 0.08)');
    radial.addColorStop(1, 'rgba(255, 122, 0, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(size / 2, 190, 160, 0, Math.PI * 2);
    ctx.fill();

    // JC Monogram (Large Italic Orange with Orange Outer Stroke and Glow)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textGrad = ctx.createLinearGradient(200, 80, 400, 240);
    textGrad.addColorStop(0, '#FFA845');
    textGrad.addColorStop(0.4, '#FF7A00');
    textGrad.addColorStop(1, '#E65500');

    // Outer Glow / Stroke
    ctx.shadowColor = 'rgba(255, 122, 0, 0.7)';
    ctx.shadowBlur = 30;
    ctx.font = 'italic 900 185px Impact, "Arial Black", sans-serif';
    ctx.strokeStyle = '#FF7A00';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.strokeText('JC', size / 2, 190);

    // Mid Stroke for crisp definition
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFA74D';
    ctx.lineWidth = 5;
    ctx.strokeText('JC', size / 2, 190);

    // Inner Fill
    ctx.fillStyle = textGrad;
    ctx.fillText('JC', size / 2, 190);
    ctx.restore();

    // ELETRICISTA (White Bold with Letter Spacing)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 48px "Montserrat", Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.letterSpacing = '8px';
    ctx.fillText('ELETRICISTA', size / 2, 330);
    ctx.restore();

    // residencial / comercial (Orange)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 24px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#FF7A00';
    ctx.letterSpacing = '2px';
    ctx.fillText('residencial / comercial', size / 2, 385);
    ctx.restore();

    // Horizontal Divider Lines with Lightning Bolt in center
    const lineY = 450;
    
    // Left Line with subtle gradient
    const leftLineGrad = ctx.createLinearGradient(60, lineY, 240, lineY);
    leftLineGrad.addColorStop(0, 'rgba(255, 122, 0, 0.2)');
    leftLineGrad.addColorStop(1, '#FF7A00');
    ctx.strokeStyle = leftLineGrad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, lineY);
    ctx.lineTo(250, lineY);
    ctx.stroke();

    // Right Line with subtle gradient
    const rightLineGrad = ctx.createLinearGradient(350, lineY, 540, lineY);
    rightLineGrad.addColorStop(0, '#FF7A00');
    rightLineGrad.addColorStop(1, 'rgba(255, 122, 0, 0.2)');
    ctx.strokeStyle = rightLineGrad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(350, lineY);
    ctx.lineTo(540, lineY);
    ctx.stroke();

    // Center Lightning Bolt ⚡ (Glowing Orange)
    ctx.save();
    ctx.shadowColor = 'rgba(255, 122, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#FF7A00';
    ctx.beginPath();
    ctx.moveTo(303, 426);
    ctx.lineTo(288, 450);
    ctx.lineTo(298, 450);
    ctx.lineTo(292, 474);
    ctx.lineTo(314, 444);
    ctx.lineTo(304, 444);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    return canvas.toDataURL('image/png', 1.0);
  } catch {
    return '';
  }
};

const getLogoBase64 = async (companySettings?: Partial<CompanySettings>): Promise<string> => {
  if (typeof window === 'undefined') return '';
  const phone = companySettings?.phone || '47 99706-4183';
  const instagram = (companySettings as any)?.instagram || 'jc_eletricistajoinville';
  
  // Render ultra-crisp vector-like badge on canvas instantly
  const dataUrl = createLogoBadgeCanvas(phone, instagram);
  if (dataUrl) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, 500, 500);
          ctx.drawImage(img, 0, 0, 500, 500);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = getAssetUrl('/logo.svg');
  });
};

export const generateQuotePdf = async (data: PdfQuoteData) => {
  try {
    const isOrder = data.documentType === 'ordem_servico';
    const shouldIncludeWarranty = isOrder ? true : (data.includeWarranty !== false);
    const docTitle = isOrder ? 'ORDEM DE SERVIÇO' : 'ORÇAMENTO';

    logger.info('PDF', `Iniciando geração de PDF (${docTitle}) para ${data.clientName || 'Cliente'} (Nº ${data.quoteNumber})`);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

  const logoBase64 = await getLogoBase64(data.companySettings);

  const primaryOrange = [255, 122, 0] as [number, number, number];
  const darkBg = [14, 14, 17] as [number, number, number];
  const grayText = [100, 100, 110] as [number, number, number];

  // Top Banner
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 210, 46, 'F');

  // Orange Accent Line
  doc.setFillColor(...primaryOrange);
  doc.rect(0, 46, 210, 2, 'F');

  const company = data.companySettings || {};
  const compName = company.companyName || 'JC ELETRICISTA';
  const ownerName = company.ownerName || 'Juan Carlos';

  if (logoBase64) {
    // Proportional square badge at top left
    doc.addImage(logoBase64, 'PNG', 14, 4, 38, 38);
  } else {
    // Fallback if logo fails to load
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(compName.toUpperCase(), 14, 24);
  }

  // Header Details next to Logo
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(compName.toUpperCase(), 56, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryOrange);
  doc.text(company.slogan || 'SERVIÇOS ELÉTRICOS RESIDENCIAIS E COMERCIAIS', 56, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 190);
  const companyIg = company.instagram || (company.email && !company.email.includes('@') ? `@${company.email}` : (company.email && company.email.startsWith('@') ? company.email : '@jc_eletricistajoinville'));
  const headerContact = [company.phone || '47 99706-4183', companyIg, company.address].filter(Boolean).join(' • ');
  if (headerContact) {
    doc.text(headerContact, 56, 28);
  }
  doc.text('Qualidade • Segurança • Confiança', 56, 34);

  // Quote Meta Info (Right side of header)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isOrder ? 13 : 15);
  doc.text(docTitle, 196, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 220);
  doc.text(`${isOrder ? 'O.S. Nº:' : 'Nº:'} ${data.quoteNumber || '2026-001'}`, 196, 26, { align: 'right' });
  doc.text(`Data: ${data.date || new Date().toLocaleDateString('pt-BR')}`, 196, 33, { align: 'right' });

  // Client Info Box
  let y = 54;
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
  const obsContent = (typeof data.observations === 'string' && data.observations.trim().length > 0)
    ? data.observations.trim()
    : (company.defaultObservations || `• Orçamento válido por ${company.defaultValidityDays || 15} dias corridos.\n• Garantia de 90 dias sobre a mão de obra.`);

  const splitObs = doc.splitTextToSize(obsContent, obsWidth - 8);
  const textHeight = Math.max(splitObs.length * 3.6 + 10, 26);
  const totalsBoxHeight = data.discount > 0 ? 34 : 26;
  const obsBoxHeight = Math.max(textHeight, totalsBoxHeight);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 228, 232);
  doc.roundedRect(14, totalsY, obsWidth, obsBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryOrange);
  doc.text('OBSERVAÇÕES & CONDIÇÕES', 18, totalsY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 90);
  doc.text(splitObs, 18, totalsY + 11);

  // Signatures at bottom
  let sigY = Math.max(totalsY + obsBoxHeight + 14, 255);
  if (sigY > 270) {
    doc.addPage();
    sigY = 250;
  }

  doc.setDrawColor(180, 180, 190);
  doc.line(20, sigY, 90, sigY);
  doc.line(120, sigY, 190, sigY);
  
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text(ownerName || compName, 55, sigY + 5, { align: 'center' });
  doc.text('Assinatura do Cliente / Aceite', 155, sigY + 5, { align: 'center' });

  // Footer note on Page 1
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 150);
  const footerContact = [company.phone || '47 99706-4183', companyIg, company.address].filter(Boolean).join(' • ');
  doc.text(`${compName.toUpperCase()} • ${company.slogan || 'SERVIÇOS ELÉTRICOS'}`, 105, 284, { align: 'center' });
  if (footerContact) {
    doc.text(footerContact, 105, 288, { align: 'center' });
  }
  doc.setTextColor(170, 170, 180);
  const page1Suffix = shouldIncludeWarranty ? 'Página 1 de 2' : 'Página 1 de 1';
  doc.text(`${page1Suffix} • ${isOrder ? 'Ordem de Serviço Oficial' : 'Orçamento Oficial'}`, 105, 292, { align: 'center' });

  // ==========================================
  // PÁGINA 2: TERMOS DE GARANTIA DOS SERVIÇOS
  // ==========================================
  if (shouldIncludeWarranty) {
    doc.addPage();

    // Top Banner Page 2 (Matching System & Logo Aesthetic)
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, 210, 46, 'F');

    // Orange Accent Line
    doc.setFillColor(...primaryOrange);
    doc.rect(0, 46, 210, 2, 'F');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 4, 38, 38);
    }

    // Header Details next to Logo (Page 2)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TERMO DE GARANTIA DOS SERVIÇOS', 56, 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryOrange);
    doc.text('CONFORMIDADE TÉCNICA ABNT NBR 5410 & NR-10', 56, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 190);
    doc.text(`Responsável Técnico: ${ownerName || 'Juan Carlos'} • ${company.phone || '47 99706-4183'}`, 56, 28);
    doc.text('Qualidade • Segurança • Confiança', 56, 34);

    // Meta Info Right Side
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CERTIFICADO', 196, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(`Ref. ${isOrder ? 'Ordem de Serviço' : 'Orçamento'}: Nº ${data.quoteNumber || '2026-001'}`, 196, 26, { align: 'right' });
    doc.text(`Data: ${data.date || new Date().toLocaleDateString('pt-BR')}`, 196, 33, { align: 'right' });

    // Client Identification Card (Page 2)
    let yP2 = 54;
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(225, 228, 232);
    doc.roundedRect(14, yP2, 182, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryOrange);
    doc.text('DADOS DO CONTRATANTE & CERTIFICADO DE GARANTIA', 18, yP2 + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 24);
    doc.text(`Cliente: ${data.clientName || 'Cliente não informado'}`, 18, yP2 + 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...grayText);
    const p2Local = data.address ? `Local da Instalação: ${data.address}` : 'Local: Conforme documento';
    doc.text(p2Local, 105, yP2 + 12);

    // Warranty Clauses Container
    let clausesY = yP2 + 23;
    const contentWidth = 182;

    const clauses = [
      {
        title: '1. PRAZO DE VALIDADE E COBERTURA LEGAL',
        body: company.warrantyTerms && company.warrantyTerms.trim().length > 15
          ? company.warrantyTerms.trim()
          : `Os serviços e instalações elétricas executados pelo responsável técnico da ${compName.toUpperCase()} possuem garantia legal de 90 (noventa) dias sobre a mão de obra especializada, em estrita conformidade com o Artigo 26, inciso II da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor), a contar da data de conclusão dos trabalhos.`
      },
      {
        title: '2. ESCOPO DOS SERVIÇOS E NORMAS TÉCNICAS APLICADAS',
        body: `A garantia abrange todos os serviços técnicos especificados ${isOrder ? 'na ordem de serviço' : 'no orçamento'} nº ${(data.quoteNumber || '')}, incluindo montagem de quadros de distribuição, cabeamento, circuitos terminais, dispositivos de proteção, tomadas e pontos de iluminação. Todos os procedimentos obedecem rigorosamente aos padrões da ABNT NBR 5410 (Instalações Elétricas de Baixa Tensão) e NR-10 (Segurança em Eletricidade).`
      },
      {
        title: '3. CONDIÇÕES PARA VALIDADE DA GARANTIA',
        body: 'A vigência da garantia é assegurada mediante: a) Utilização de condutores e materiais certificados pelo INMETRO; b) Manutenção dos limites nominais de corrente e dimensionamento dos disjuntores projetados; c) Preservação dos lacres e conexões originais contra umidade e agentes corrosivos.'
      },
      {
        title: '4. HIPÓTESES DE EXCLUSÃO DA COBERTURA',
        body: 'A garantia perderá integralmente sua validade nas seguintes hipóteses:\n• Intervenções, expansões, manutenções ou reparos realizados por terceiros ou pessoas não autorizadas.\n• Sobrecargas causadas por ligação de novos equipamentos de alta potência sem o devido redimensionamento.\n• Danos ocasionados por descargas atmosféricas (raios) em instalações desprovidas de DPS ou variações extremas da rede pública.\n• Avarias por intempéries, infiltrações, queima por agentes externos ou desgaste natural de lâmpadas/componentes consumíveis.'
      },
      {
        title: '5. PROCEDIMENTO PARA ACIONAMENTO DA ASSISTÊNCIA TÉCNICA',
        body: `Caso seja identificada qualquer anormalidade na instalação, o CONTRATANTE deverá comunicar imediatamente a equipe pelo WhatsApp oficial ${company.phone || '47 99706-4183'}, para agendamento de vistoria técnica e atendimento prioritário.`
      }
    ];

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 224, 230);
    doc.roundedRect(14, clausesY, contentWidth, 142, 2, 2, 'FD');

    let currentTextY = clausesY + 7;

    clauses.forEach((clause) => {
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(...primaryOrange);
      doc.text(clause.title, 18, currentTextY);
      currentTextY += 4.2;

      // Body
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 60);
      const splitLines = doc.splitTextToSize(clause.body, contentWidth - 8);
      doc.text(splitLines, 18, currentTextY);
      currentTextY += splitLines.length * 3.3 + 3.2;
    });

    // Acceptance Clause
    let acceptY = 224;
    doc.setFillColor(248, 249, 251);
    doc.setDrawColor(225, 228, 232);
    doc.roundedRect(14, acceptY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 24);
    doc.text('TERMO DE CIÊNCIA E ACEITE DO CONTRATANTE:', 18, acceptY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 90);
    doc.text('O Contratante declara ter recebido os serviços elétricos em perfeitas condições de funcionamento e segurança, concordando com as normas deste termo.', 18, acceptY + 10);

    // Signatures on Page 2
    let sigY2 = 256;
    doc.setDrawColor(180, 180, 190);
    doc.line(20, sigY2, 90, sigY2);
    doc.line(120, sigY2, 190, sigY2);
    
    doc.setFontSize(8);
    doc.setTextColor(...grayText);
    doc.text(`${ownerName || compName} • Responsável Técnico`, 55, sigY2 + 5, { align: 'center' });
    doc.text(`${data.clientName || 'Assinatura do Cliente / Aceite'}`, 155, sigY2 + 5, { align: 'center' });

    // Page 2 Footer
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 150);
    doc.text(`${compName.toUpperCase()} • ${company.slogan || 'SERVIÇOS ELÉTRICOS'}`, 105, 284, { align: 'center' });
    if (footerContact) {
      doc.text(footerContact, 105, 288, { align: 'center' });
    }
    doc.setTextColor(170, 170, 180);
    doc.text(`Página 2 de 2 • Termo de Garantia dos Serviços Prestados`, 105, 292, { align: 'center' });
  }

  // Generate File & Trigger Safe Download across iOS & Android
  const docPrefix = isOrder ? 'Ordem_de_Servico' : 'Orcamento';
  const fileName = `${docPrefix}_${(data.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}_${data.quoteNumber || Date.now()}.pdf`;
  
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
  
  logger.info('PDF', `PDF ${fileName} gerado e baixado com sucesso!`);
  return { doc, blobUrl, fileName };
} catch (err: any) {
  logger.error('PDF', 'Erro crítico ao gerar PDF do orçamento', err?.message || err);
  throw err;
}
};
