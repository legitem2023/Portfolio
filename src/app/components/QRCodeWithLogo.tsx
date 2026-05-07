import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeWithLogoProps {}

const QRCodeWithLogo: React.FC<QRCodeWithLogoProps> = () => {
  // Fixed URL and logo path
  const url = 'https://vendorcity.net';
  const logoUrl = '/VendorCity.webp';
  
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  // Generate QR code with logo entirely in script
  useEffect(() => {
    const generateQRWithLogo = async () => {
      try {
        setIsGenerating(true);
        
        // Step 1: Generate QR code as canvas
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, url, {
          width: 800,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Step 2: Load the logo image
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load logo'));
          img.src = logoUrl;
        });
        
        // Step 3: Create final canvas and combine QR + Logo
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = qrCanvas.width;
        finalCanvas.height = qrCanvas.height;
        const ctx = finalCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Draw QR code
        ctx.drawImage(qrCanvas, 0, 0);
        
        // Calculate logo size (20% of QR code)
        const logoSize = finalCanvas.width * 0.2;
        const logoX = (finalCanvas.width - logoSize) / 2;
        const logoY = (finalCanvas.height - logoSize) / 2;
        
        // Draw white background circle for better logo visibility
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(finalCanvas.width / 2, finalCanvas.height / 2, logoSize / 2 + 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw white border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(finalCanvas.width / 2, finalCanvas.height / 2, logoSize / 2 + 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        
        // Step 4: Convert final canvas to image URL
        const imageUrl = finalCanvas.toDataURL('image/png');
        setFinalImageUrl(imageUrl);
        
      } catch (error) {
        console.error('Failed to generate QR code with logo:', error);
        
        // Fallback: Generate QR code without logo if logo fails
        try {
          const fallbackCanvas = document.createElement('canvas');
          await QRCode.toCanvas(fallbackCanvas, url, {
            width: 800,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setFinalImageUrl(fallbackCanvas.toDataURL('image/png'));
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
      link.download = 'qr-code-with-logo.png';
      link.href = finalImageUrl;
      link.click();
    }
  };

  return (
    <div style={styles.container}>
      <h2>VendorCity Branded QR Code</h2>
      
      {/* Display URL info */}
      <div style={styles.urlInfo}>
        <p><strong>Website:</strong> {url}</p>
      </div>
      
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
              alt="QR Code with Logo"
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
          <p style={styles.hint}>
            Logo automatically loaded from: {logoUrl}
          </p>
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
    maxWidth: '400px',
    height: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
    display: 'block'
  },
  downloadButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '20px',
    width: '100%'
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
