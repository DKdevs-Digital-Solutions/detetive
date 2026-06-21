import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// Mantém só caracteres seguros (Latin-1, suportado pelas fontes padrão do PDF)
function sanitizeName(value: string): string {
  return (value || 'Participante')
    .normalize('NFC')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^A-Za-zÀ-ÿ0-9 .'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70) || 'Participante';
}

// Código de verificação legível (sem caracteres ambíguos)
function genCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `DET-${r.slice(0, 4)}-${r.slice(4)}`;
}

/**
 * Gera o certificado de participação inteiramente por código (A4 paisagem),
 * com a logo do colégio, moldura, emblema do Detetive, nome, data e código.
 */
export async function buildCertificatePdf(name: string): Promise<Uint8Array> {
  const eventName = process.env.CERT_EVENT_NAME || 'Feira de Ciências e Tecnologias';
  const orgName = process.env.CERT_ORG_NAME || 'Colégio Monsenhor Raeder';

  const doc = await PDFDocument.create();
  const W = 842, H = 595; // A4 paisagem
  const page = doc.addPage([W, H]);

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.05, 0.10, 0.22);
  const cyan = rgb(0.0, 0.52, 0.74);
  const cyanSoft = rgb(0.55, 0.78, 0.9);
  const gold = rgb(0.74, 0.58, 0.16);
  const gray = rgb(0.42, 0.47, 0.54);
  const cream = rgb(0.992, 0.992, 0.972);

  const center = (t: string, font: typeof serif, size: number, y: number, color = navy) => {
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (W - w) / 2, y, size, font, color });
  };

  // Fundo
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: cream });

  // Molduras
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: navy, borderWidth: 2.5 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: cyan, borderWidth: 1 });

  // Cantos em estilo HUD (tema Detetive)
  const bracket = (cx: number, cy: number, dx: number, dy: number) => {
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + dx, y: cy }, thickness: 2, color: cyan });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + dy }, thickness: 2, color: cyan });
  };
  bracket(42, 42, 28, 28);
  bracket(W - 42, 42, -28, 28);
  bracket(42, H - 42, 28, -28);
  bracket(W - 42, H - 42, -28, -28);

  // Logo do colégio (centralizada no topo)
  try {
    const logoBytes = await fs.readFile(path.join(process.cwd(), 'public', 'logo-raeder-colorida.png'));
    const logo = await doc.embedPng(logoBytes);
    const s = Math.min(190 / logo.width, 84 / logo.height);
    const lw = logo.width * s, lh = logo.height * s;
    page.drawImage(logo, { x: (W - lw) / 2, y: H - 56 - lh, width: lw, height: lh });
  } catch {
    // sem logo: usa o nome da instituição como cabeçalho
    center(orgName, sansBold, 16, H - 78, navy);
  }

  // Título
  center('CERTIFICADO DE PARTICIPAÇÃO', serifBold, 30, 398, navy);
  page.drawLine({ start: { x: W / 2 - 150, y: 386 }, end: { x: W / 2 + 150, y: 386 }, thickness: 1.2, color: gold });

  // Introdução
  center('Este certificado é concedido a', serifItalic, 15, 350, gray);

  // Nome (destaque, tamanho dinâmico, sublinhado)
  const safeName = sanitizeName(name);
  let nameSize = 40;
  while (nameSize > 22 && serifBold.widthOfTextAtSize(safeName, nameSize) > 640) nameSize -= 1;
  const nameW = serifBold.widthOfTextAtSize(safeName, nameSize);
  page.drawText(safeName, { x: (W - nameW) / 2, y: 300, size: nameSize, font: serifBold, color: navy });
  const ulW = Math.max(nameW, 220);
  page.drawLine({ start: { x: (W - ulW) / 2 - 14, y: 290 }, end: { x: (W + ulW) / 2 + 14, y: 290 }, thickness: 1, color: cyan });

  // Corpo
  center(`por participar ativamente da ${eventName},`, serif, 14, 252, navy);
  center('explorando inteligência artificial, fake news e o uso crítico da', serif, 14, 232, navy);
  center('tecnologia no projeto interativo Detetive IA.', serif, 14, 212, navy);

  // Data
  const dt = new Date();
  const dateStr = `${dt.getDate()} de ${MONTHS[dt.getMonth()]} de ${dt.getFullYear()}`;
  center(dateStr, serifItalic, 13, 165, gray);

  // Assinatura
  page.drawLine({ start: { x: W / 2 - 135, y: 118 }, end: { x: W / 2 + 135, y: 118 }, thickness: 1, color: navy });
  center(orgName, sansBold, 12, 102, navy);
  center('Coordenação da Feira de Ciências', sans, 10, 88, gray);

  // Código de verificação
  const code = genCode();
  page.drawText(`Codigo de verificacao: ${code}`, { x: 46, y: 42, size: 9, font: sans, color: gray });

  // Emblema do Detetive (selo, canto inferior direito)
  const sx = W - 116, sy = 74;
  page.drawCircle({ x: sx, y: sy, size: 30, borderColor: gold, borderWidth: 2 });
  page.drawCircle({ x: sx, y: sy, size: 22, borderColor: cyanSoft, borderWidth: 1.2 });
  page.drawCircle({ x: sx, y: sy, size: 8, color: cyan });
  // pequenos ticks em volta do selo
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 6) * i;
    const r1 = 25, r2 = 29;
    page.drawLine({
      start: { x: sx + r1 * Math.cos(a), y: sy + r1 * Math.sin(a) },
      end: { x: sx + r2 * Math.cos(a), y: sy + r2 * Math.sin(a) },
      thickness: 0.8, color: gold,
    });
  }
  page.drawText('DETETIVE IA', { x: sx - sans.widthOfTextAtSize('DETETIVE IA', 6) / 2, y: sy - 44, size: 6, font: sansBold, color: gray });

  // Metadados
  doc.setTitle(`Certificado de Participação - ${safeName}`);
  doc.setAuthor(orgName);
  doc.setSubject(`${eventName} - Projeto Detetive IA`);
  doc.setCreator('Detetive IA');
  doc.setProducer('Detetive IA');

  return doc.save();
}
