import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports the dashboard canvas to a multi-page portrait A4 PDF.
 * 
 * - Header: Dashboard name at the top of each page
 * - Footer: Export date/time at the bottom of each page
 * - Smart page breaks: never cuts a widget in half
 */
export async function exportDashboardToPDF(
  canvasElement: HTMLElement,
  dashboardName: string
): Promise<void> {
  // A4 portrait dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  const headerHeight = 15; // mm reserved for header
  const footerHeight = 12; // mm reserved for footer
  const margin = 10; // mm margin on left/right
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = pdfHeight - headerHeight - footerHeight;

  // Format current date/time for footer
  const now = new Date();
  const dateTimeStr = now.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // --- Smart Page Break Calculation ---
  // Find the bottom edges of all widget rows to use as natural break points
  const containerRect = canvasElement.getBoundingClientRect();
  const scrollTop = canvasElement.scrollTop;
  const widgetElements = canvasElement.querySelectorAll('.react-grid-item');
  
  // Collect the bottom edge of every widget (relative to the canvas scroll top)
  const widgetBottoms = new Set<number>();
  widgetElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const bottom = rect.bottom - containerRect.top + scrollTop;
    widgetBottoms.add(Math.round(bottom));
  });

  // Sort bottom edges so we can find the best break point for each page
  const sortedBottoms = Array.from(widgetBottoms).sort((a, b) => a - b);
  const totalScrollHeight = canvasElement.scrollHeight;

  // Capture the full scrollable content of the canvas element
  const canvas = await html2canvas(canvasElement, {
    scale: 2, // Higher resolution for crisp charts
    useCORS: true,
    logging: false,
    scrollY: 0,
    scrollX: 0,
    windowWidth: canvasElement.scrollWidth,
    windowHeight: canvasElement.scrollHeight,
    height: canvasElement.scrollHeight,
    width: canvasElement.scrollWidth,
  });

  const imgWidth = canvas.width;
  const scaleFactor = 2; // matches html2canvas scale

  // Ratio: mm per CSS pixel
  const mmPerPx = contentWidth / (imgWidth / scaleFactor);

  // Convert contentHeight (mm) to CSS pixels for break calculation
  const maxPageHeightPx = contentHeight / mmPerPx;

  // Calculate smart page breaks (in CSS pixels from top of canvas)
  const pageBreaks: number[] = [0]; // First page starts at 0
  let currentY = 0;

  while (currentY < totalScrollHeight) {
    const idealBreak = currentY + maxPageHeightPx;

    if (idealBreak >= totalScrollHeight) {
      // Last page — no need for another break
      break;
    }

    // Find the largest widget bottom that fits within this page
    let bestBreak = idealBreak;
    for (let i = sortedBottoms.length - 1; i >= 0; i--) {
      if (sortedBottoms[i] <= idealBreak && sortedBottoms[i] > currentY) {
        bestBreak = sortedBottoms[i];
        break;
      }
    }

    // If no widget bottom was found before idealBreak, just use idealBreak as fallback
    pageBreaks.push(bestBreak);
    currentY = bestBreak;
  }

  // Add the total height as the final boundary
  pageBreaks.push(totalScrollHeight);

  const totalPages = pageBreaks.length - 1;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    // --- Header ---
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(33, 33, 33);
    pdf.text(dashboardName, pdfWidth / 2, headerHeight - 3, { align: 'center' });

    // Header underline
    pdf.setDrawColor(25, 118, 210); // MUI primary blue
    pdf.setLineWidth(0.5);
    pdf.line(margin, headerHeight, pdfWidth - margin, headerHeight);

    // --- Content Slice ---
    const sliceStartPx = pageBreaks[page];
    const sliceEndPx = pageBreaks[page + 1];
    const sliceHeightPx = sliceEndPx - sliceStartPx;

    // Convert CSS pixels to canvas pixels (multiply by scale)
    const srcY = sliceStartPx * scaleFactor;
    const srcH = sliceHeightPx * scaleFactor;

    // Create a temporary canvas for this page's slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = Math.max(1, Math.round(srcH));
    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        canvas,
        0, Math.round(srcY),
        imgWidth, Math.round(srcH),
        0, 0,
        imgWidth, Math.round(srcH)
      );
    }

    const pageImgData = pageCanvas.toDataURL('image/png');
    const sliceHeightMm = sliceHeightPx * mmPerPx;

    pdf.addImage(
      pageImgData,
      'PNG',
      margin,
      headerHeight + 1,
      contentWidth,
      sliceHeightMm
    );

    // --- Footer ---
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Exported on: ${dateTimeStr}`,
      margin,
      pdfHeight - footerHeight + 6
    );
    pdf.text(
      `Page ${page + 1} of ${totalPages}`,
      pdfWidth - margin,
      pdfHeight - footerHeight + 6,
      { align: 'right' }
    );

    // Footer top line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pdfHeight - footerHeight, pdfWidth - margin, pdfHeight - footerHeight);
  }

  // Trigger download
  const safeFileName = dashboardName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  pdf.save(`${safeFileName}_${now.toISOString().slice(0, 10)}.pdf`);
}
