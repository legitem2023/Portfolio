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
        
        // Step 3: Create final canvas with extra space for text
        const padding = 80; // Space for top and bottom text
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
        
        // Draw QR code (shifted down by padding/2 to make room for text)
        const qrYOffset = padding / 2;
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
        
        // Step 4: Add text "Scan me" at the top
        ctx.font = `bold ${Math.floor(finalCanvas.width * 0.08)}px "Arial", "Helvetica", sans-serif`;
        ctx.fillStyle = '#4B0082'; // Indigo color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add "Scan me" text at top
        const topTextY = qrYOffset / 2.50;
        ctx.fillText('Scan me', finalCanvas.width / 2, topTextY);
        
        // Add small decorative elements (optional)
        ctx.font = `${Math.floor(finalCanvas.width * 0.03)}px "Arial", "Helvetica", sans-serif`;
        ctx.fillStyle = '#666666';
        
        // Add URL text at bottom
        const bottomTextY = qrYOffset + qrCanvas.height + (padding / 1.5);
        ctx.fillText(url, finalCanvas.width / 2, bottomTextY);
        
        // Step 5: Convert final canvas to image URL
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
          
          // Create canvas with text for fallback
          const padding = 80;
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = fallbackCanvas.width;
          finalCanvas.height = fallbackCanvas.height + padding;
          const ctx = finalCanvas.getContext('2d');
          
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            
            const qrYOffset = padding / 2;
            ctx.drawImage(fallbackCanvas, 0, qrYOffset);
            
            ctx.font = `bold ${Math.floor(finalCanvas.width * 0.08)}px "Arial", "Helvetica", sans-serif`;
            ctx.fillStyle = '#4B0082';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Scan me', finalCanvas.width / 2, qrYOffset / 2);
            
            ctx.font = `bold ${Math.floor(finalCanvas.width * 0.08)}px "Arial", "Helvetica", sans-serif`;
            ctx.fillStyle = '#666666';
            ctx.fillText(url, finalCanvas.width / 2, qrYOffset + fallbackCanvas.height + (padding / 2));
            
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
        <>
          <button onClick={downloadQR} style={styles.downloadButton}>
            Download QR Code as PNG
          </button>
        </>
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
  urlInfo: {
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
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
    marginTop: '20px',
    width: '100%',
    transition: 'background-color 0.3s'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px'
  }
};

export default QRCodeWithLogo;
