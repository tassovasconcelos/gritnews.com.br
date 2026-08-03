import * as pdfjsLib from 'pdfjs-dist';
import { ArticleBlock } from '../types';

// Configure pdfjs worker using CDN compatible with pdfjs-dist version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfResult {
  title: string;
  subtitle: string;
  summary: string;
  fullText: string;
  pagesText: string[];
  pageImages: string[]; // Base64 JPEGs of rendered pages/images
  blocks: ArticleBlock[];
  pdfDataUrl: string;
  fileName: string;
}

/**
 * Renders a PDF page to a canvas and returns a compressed JPEG data URL
 */
async function renderPageToCanvasImage(page: pdfjsLib.PDFPageProxy, scale = 1.2): Promise<string> {
  try {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!context) return '';

    // White background
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      canvas: canvas as any,
      viewport: viewport
    }).promise;

    // Return compressed JPEG image
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (err) {
    console.error('Error rendering PDF page to image:', err);
    return '';
  }
}

/**
 * Main function to extract text and images from a PDF file
 */
export async function extractPdfContent(file: File): Promise<ExtractedPdfResult> {
  const fileName = file.name;
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Read array buffer for PDFjs
  const arrayBuffer = await file.arrayBuffer();
  
  // Create a lightweight compressed data URL for attachment preview (to avoid LocalStorage quota crash)
  let pdfDataUrl = '';
  try {
    // If file is smaller than 1.5MB, use readAsDataURL, otherwise compress/truncate notice
    if (file.size <= 1.5 * 1024 * 1024) {
      const reader = new FileReader();
      pdfDataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }
  } catch (e) {
    console.warn('PDF file too large for full inline base64, using lightweight reference:', e);
  }

  let fullText = '';
  const pagesText: string[] = [];
  const pageImages: string[] = [];

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = Math.min(pdf.numPages, 12); // Process up to 12 pages

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        pagesText.push(pageText);
        fullText += ` ${pageText}`;
      }

      // Render page image (for pages 1 to 5 to avoid heavy memory)
      if (i <= 5) {
        const pageImg = await renderPageToCanvasImage(page, 1.2);
        if (pageImg) {
          pageImages.push(pageImg);
        }
      }
    }
  } catch (err) {
    console.error('Error parsing PDF with pdfjs:', err);
  }

  // Fallback if no text extracted (e.g. scanned image PDF)
  if (!fullText.trim()) {
    fullText = `Documento em PDF "${fileName}". Conteúdo visual e dados consolidados extraídos diretamente da publicação original.`;
  }

  // Generate intense, high-impact journalistic headline & structure
  const firstParagraphs = fullText
    .split(/(?:\.\s+|\n+)/)
    .filter(p => p.trim().length > 20);

  const rawTitle = firstParagraphs[0] || cleanName;
  const headline = rawTitle.length > 90 ? rawTitle.substring(0, 90) + '...' : rawTitle;

  const title = headline.charAt(0).toUpperCase() + headline.slice(1);
  const subtitle = firstParagraphs[1] 
    ? (firstParagraphs[1].length > 130 ? firstParagraphs[1].substring(0, 130) + '...' : firstParagraphs[1])
    : `Reportagem e investigação especial baseada no documento oficial "${fileName}"`;

  const summary = firstParagraphs.slice(0, 3).join(' ') 
    ? (firstParagraphs.slice(0, 3).join(' ').substring(0, 260) + '...')
    : `Análise profunda e dados exclusivos extraídos da publicação em PDF "${fileName}". Documentação completa anexada para consulta pública e transparência.`;

  // Build INTENSE, multi-block journalistic structure
  const blocks: ArticleBlock[] = [];

  // Head
  blocks.push({
    id: `b-head-${Date.now()}-1`,
    type: 'heading2',
    content: `🔥 Exclusivo: O Impacto e os Fatos de "${title}"`
  });

  // Callout badge box
  blocks.push({
    id: `b-callout-${Date.now()}-1`,
    type: 'callout',
    content: `📌 **DOCUMENTO OFICIAL ANEXADO**: Esta matéria foi gerada a partir da análise direta do arquivo PDF "${fileName}". A íntegra das imagens, páginas e gráficos está disponível para visualização e download no leitor integrado abaixo.`
  });

  // First paragraph with intensity
  const introText = firstParagraphs.slice(0, 2).join(' ') || 
    `O documento registrado sob o nome "${fileName}" traz revelações e dados cruciais para a compreensão do cenário atual. Ao examinar cada uma de suas páginas, sobressai a urgência de dar visibilidade a esses fatos com precisão e clareza jornalística.`;
  
  blocks.push({
    id: `b-p-${Date.now()}-1`,
    type: 'paragraph',
    content: introText
  });

  // Insert First Rendered Image from PDF if available!
  if (pageImages[0]) {
    blocks.push({
      id: `b-img-${Date.now()}-1`,
      type: 'image',
      content: pageImages[0],
      caption: `📸 Registro Oficial — Página 1 do Documento PDF "${fileName}"`
    });
  }

  // Highlight Quote (Aspas intensas)
  const quoteText = firstParagraphs[2] || `“Quando os fatos são documentados com rigor, a informação deixa de ser opinião e passa a ser transformação.”`;
  blocks.push({
    id: `b-quote-${Date.now()}-1`,
    type: 'quote',
    content: quoteText.length > 200 ? quoteText.substring(0, 200) + '...' : quoteText
  });

  // Second Heading
  blocks.push({
    id: `b-head-${Date.now()}-2`,
    type: 'heading3',
    content: '⚡ Análise dos Fatos e Desdobramentos'
  });

  // Second Paragraphs
  const midText = firstParagraphs.slice(2, 5).join(' ') ||
    `A análise pormenorizada do arquivo revela indicadores chave que moldam as próximas decisões na área. O engajamento com estas informações é fundamental para garantir a transparência das ações e a prestação de contas à sociedade.`;

  blocks.push({
    id: `b-p-${Date.now()}-2`,
    type: 'paragraph',
    content: midText
  });

  // Insert Second Rendered Image from PDF if available!
  if (pageImages[1]) {
    blocks.push({
      id: `b-img-${Date.now()}-2`,
      type: 'image',
      content: pageImages[1],
      caption: `📸 Registro Visual e Gráficos — Página 2 do PDF "${fileName}"`
    });
  } else if (pageImages[0]) {
    blocks.push({
      id: `b-img-${Date.now()}-2`,
      type: 'image',
      content: pageImages[0],
      caption: `📷 Documentação anexada do relatório "${fileName}"`
    });
  }

  // Additional paragraphs if full text available
  if (firstParagraphs.length > 5) {
    blocks.push({
      id: `b-head-${Date.now()}-3`,
      type: 'heading3',
      content: '🔍 Conclusão e Transparência de Dados'
    });
    blocks.push({
      id: `b-p-${Date.now()}-3`,
      type: 'paragraph',
      content: firstParagraphs.slice(5, 8).join(' ')
    });
  }

  // Insert 3rd image if present
  if (pageImages[2]) {
    blocks.push({
      id: `b-img-${Date.now()}-3`,
      type: 'image',
      content: pageImages[2],
      caption: `📸 Detalhe e Evidência — Página 3 do PDF "${fileName}"`
    });
  }

  // Final Callout
  blocks.push({
    id: `b-callout-${Date.now()}-2`,
    type: 'callout',
    content: `📢 **Compartilhe esta informação**: O acesso à informação confiável fortalece a cidadania. Baixe o PDF anexado e compartilhe esta reportagem com sua rede.`
  });

  return {
    title,
    subtitle,
    summary,
    fullText,
    pagesText,
    pageImages,
    blocks,
    pdfDataUrl,
    fileName
  };
}
