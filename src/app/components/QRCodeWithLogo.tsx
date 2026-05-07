import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeWithLogoProps {}

const QRCodeWithLogo: React.FC<QRCodeWithLogoProps> = () => {
  // Fixed URL and logo path
  const url = 'https://vendorcity.net';
  const logoUrl = '/VendorCity_Store.webp';
  
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  // Generate QR code with logo and text entirely in script
  useEffect(() => {
    const generateQRWithLogo = async () => {
      try {
        setIsGenerating(true);
        
        // Step 1: Generate QR code as canvas with indigo color
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, url, {
          width: 600,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#4E4E71', // Indigo color
            light: '#FFFFFF'
          }
        });
        
        // Step 2: Load the logo image
        let logoImg: HTMLImageElement | null = null;
        try {
          logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load logo'));
            img.src = logoUrl;
          });
        } catch (error) {
          console.error('Logo loading failed:', error);
        }
        
        // Step 3: Calculate font size and use NEGATIVE gap to overlap text into QR code
        const fontSize = Math.floor(qrCanvas.width * 0.08);
        const textHeight = fontSize;
        const gapPx = 30; // Negative gap - text overlaps/embeds into QR code by 1.5 pixels
        const whiteBorder = 15; // 15px white border
        
        // Total padding: top text height + top gap + bottom gap + bottom text height + white border top/bottom
        const padding = textHeight + gapPx + gapPx + textHeight;
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = qrCanvas.width + (whiteBorder * 2);
        finalCanvas.height = qrCanvas.height + padding + (whiteBorder * 2);
        const ctx = finalCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Fill entire canvas with WHITE border
        ctx.fillStyle = '#4E4E71';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Fill white background for the content area (already white, but keeping for clarity)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(whiteBorder, whiteBorder, qrCanvas.width, qrCanvas.height + padding);
        
        // Calculate Y offset for QR code (text will overlap into QR code because of negative gap)
        const qrYOffset = whiteBorder + textHeight + gapPx;
        ctx.drawImage(qrCanvas, whiteBorder, qrYOffset);
        
        // Draw logo if loaded
        if (logoImg) {
          // Calculate logo size (20% of QR code)
          const logoSize = qrCanvas.width * 0.2;
          const logoX = whiteBorder + (finalCanvas.width - (whiteBorder * 2) - logoSize) / 2;
          const logoY = qrYOffset + (qrCanvas.height - logoSize) / 2;
          
          // Draw white background circle for better logo visibility
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 10, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw indigo border
          ctx.strokeStyle = '#4E4E71';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 8, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        }
        
        // Step 4: Set font for text
        ctx.font = `bold ${fontSize}px "Arial", "Helvetica", sans-serif`;
        ctx.fillStyle = '#4E4E71'; // Indigo color
        ctx.textAlign = 'center';
        
        // Add "Scan me" text at top - overlapping into QR code by 1.5px
        ctx.textBaseline = 'bottom';
        const topTextY = qrYOffset + 1.5;
        ctx.fillText('Scan me', whiteBorder + (qrCanvas.width / 2), topTextY);
        
        // Step 5: Add URL text at the bottom - overlapping into QR code by 1.5px
        ctx.textBaseline = 'top';
        const bottomTextY = qrYOffset + qrCanvas.height - 1.5;
        ctx.fillText(url, whiteBorder + (qrCanvas.width / 2), bottomTextY);
        
        // Step 6: Convert final canvas to image URL
        const imageUrl = finalCanvas.toDataURL('image/png');
        setFinalImageUrl(imageUrl);
        
      } catch (error) {
        console.error('Failed to generate QR code with logo:', error);
        
        // Fallback: Generate QR code without logo if everything fails
        try {
          const fallbackCanvas = document.createElement('canvas');
          await QRCode.toCanvas(fallbackCanvas, url, {
            width: 600,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#4E4E71',
              light: '#FFFFFF'
            }
          });
          
          const fontSize = Math.floor(fallbackCanvas.width * 0.08);
          const textHeight = fontSize;
          const gapPx = -1.5;
          const whiteBorder = 15;
          const padding = textHeight + gapPx + gapPx + textHeight;
          
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = fallbackCanvas.width + (whiteBorder * 2);
          finalCanvas.height = fallbackCanvas.height + padding + (whiteBorder * 2);
          const ctx = finalCanvas.getContext('2d');
          
          if (ctx) {
            // Fill entire canvas with white border
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            
            const qrYOffset = whiteBorder + textHeight + gapPx;
            ctx.drawImage(fallbackCanvas, whiteBorder, qrYOffset);
            
            ctx.font = `bold ${fontSize}px "Arial", "Helvetica", sans-serif`;
            ctx.fillStyle = '#4E4E71';
            ctx.textAlign = 'center';
            
            ctx.textBaseline = 'bottom';
            ctx.fillText('Scan me', whiteBorder + (fallbackCanvas.width / 2), qrYOffset + 1.5);
            
            ctx.textBaseline = 'top';
            ctx.fillText(url, whiteBorder + (fallbackCanvas.width / 2), qrYOffset + fallbackCanvas.height - 1.5);
            
            setFinalImageUrl(finalCanvas.toDataURL('image/png'));
          } else {
            setFinalImageUrl(fallbackCanvas.toDataURL('image/png'));
          }
        } catch (fallbackError) {
          console.error('Fallback QR generation also failed:', fallbackError);
        }
      } finally {
        setIsGenerating(false);
      }
    };
    
    generateQRWithLogo();
  }, []);

  // Download QR code
  const downloadQR = () => {
    if (finalImageUrl) {
      const link = document.createElement('a');
      link.download = 'qr-code-indigo.png';
      link.href = finalImageUrl;
      link.click();
    }
  };

  // Copy URL to clipboard
  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard: ' + url);
  };

  return (
    <div style={styles.container}>
      
      {/* Display generated QR code as image */}
      <div style={styles.imageWrapper}>
        {isGenerating ? (
          <div style={styles.loading}>
            <p>Generating QR Code...</p>
          </div>
        ) : (
          finalImageUrl && (
            <img 
              src={finalImageUrl} 
              alt="QR Code with Logo - Scan me"
              style={styles.qrImage}
            />
          )
        )}
      </div>
      
      {/* Download Button */}
      {finalImageUrl && !isGenerating && (
        <div style={styles.buttonGroup}>
          <button onClick={downloadQR} style={styles.downloadButton}>
            Download QR Code as PNG
          </button>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  },
  imageWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: '20px',
    minHeight: '300px'
  },
  qrImage: {
    width: '100%',
    maxWidth: '450px',
    height: 'auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    display: 'block',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  },
  downloadButton: {
    backgroundColor: '#4E4E71', // Indigo color
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.3s'
  },
  copyButton: {
    backgroundColor: '#6A5ACD', // Slate blue for contrast
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.3s'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    width: '100%'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  }
};

export default QRCodeWithLogo;
