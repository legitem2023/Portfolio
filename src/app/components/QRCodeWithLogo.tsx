import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeWithLogoProps {}

const QRCodeWithLogo: React.FC<QRCodeWithLogoProps> = () => {
  // Fixed URL and logo path
  const url = 'https://vendorcity.net';
  const logoUrl = '/VendorCity.webp';
  
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
            dark: '#4B0082', // Indigo color
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
        
        // Step 3: Calculate font size and text metrics
        const fontSize = Math.floor(qrCanvas.width * 0.08);
        const textHeight = fontSize; // Approximate height of text (font size in pixels)
        const gapPx = textHeight / 2; // Gap is half the height of the text itself
        
        // Total padding: top text height + top gap + bottom gap + bottom text height
        const padding = textHeight + gapPx + gapPx + textHeight;
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = qrCanvas.width;
        finalCanvas.height = qrCanvas.height + padding;
        const ctx = finalCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Fill background with white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Calculate Y offset for QR code (start after top text and its gap)
        const qrYOffset = textHeight + gapPx;
        ctx.drawImage(qrCanvas, 0, qrYOffset);
        
        // Draw logo if loaded
        if (logoImg) {
          // Calculate logo size (20% of QR code)
          const logoSize = qrCanvas.width * 0.2;
          const logoX = (finalCanvas.width - logoSize) / 2;
          const logoY = qrYOffset + (qrCanvas.height - logoSize) / 2;
          
          // Draw white background circle for better logo visibility
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(finalCanvas.width / 2, logoY + logoSize / 2, logoSize / 2 + 10, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw indigo border
          ctx.strokeStyle = '#4B0082';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(finalCanvas.width / 2, logoY + logoSize / 2, logoSize / 2 + 8, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        }
        
        // Step 4: Set font for text
        ctx.font = `bold ${fontSize}px "Arial", "Helvetica", sans-serif`;
        ctx.fillStyle = '#4B0082'; // Indigo color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add "Scan me" text at top - positioned with gap = half text height above QR code
        // The text center is at half of textHeight from top edge
        const topTextY = textHeight / 2;
        ctx.fillText('Scan me', finalCanvas.width / 2, topTextY);
        
        // Step 5: Add URL text at the bottom - gap = half text height below QR code
        const bottomTextY = qrYOffset + qrCanvas.height + gapPx + (textHeight / 2);
        ctx.fillText(url, finalCanvas.width / 2, bottomTextY);
        
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
              dark: '#4B0082',
              light: '#FFFFFF'
            }
          });
          
          const fontSize = Math.floor(fallbackCanvas.width * 0.08);
          const textHeight = fontSize;
          const gapPx = textHeight / 2;
          const padding = textHeight + gapPx + gapPx + textHeight;
          
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = fallbackCanvas.width;
          finalCanvas.height = fallbackCanvas.height + padding;
          const ctx = finalCanvas.getContext('2d');
          
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            
            const qrYOffset = textHeight + gapPx;
            ctx.drawImage(fallbackCanvas, 0, qrYOffset);
            
            ctx.font = `bold ${fontSize}px "Arial", "Helvetica", sans-serif`;
            ctx.fillStyle = '#4B0082';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Scan me', finalCanvas.width / 2, textHeight / 2);
            ctx.fillText(url, finalCanvas.width / 2, qrYOffset + fallbackCanvas.height + gapPx + (textHeight / 2));
            
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
          <button onClick={copyUrlToClipboard} style={styles.copyButton}>
            Copy URL
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
    backgroundColor: '#4B0082', // Indigo color
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
