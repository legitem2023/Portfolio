import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeWithLogoProps {}

const QRCodeWithLogo: React.FC<QRCodeWithLogoProps> = () => {
  // Fixed URL and logo path - no user input needed
  const url = 'https://vendorcity.net';
  const logoUrl = '/VendorCity.webp';
  
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<number>(400);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load logo image once on mount
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setLogoImage(img);
      setLogoLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load logo from:', logoUrl);
      // Still generate QR without logo
      setLogoLoaded(true);
    };
    img.src = logoUrl;
  }, []);

  // Calculate canvas size based on parent container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        // Make canvas responsive but not exceed parent width
        // Max size 400px, min size 200px
        const newSize = Math.min(Math.max(parentWidth - 40, 200), 400);
        setCanvasSize(newSize);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Generate QR code (canvas size is now dynamic)
  const generateQR = async (): Promise<void> => {
    if (!canvasRef.current) {
      console.error('Canvas reference is null');
      return;
    }

    try {
      // Generate QR code with current canvas dimensions
      const qrDataUrl = await QRCode.toDataURL(canvasRef.current, url, {
        width: canvasSize,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrDataUrl(qrDataUrl);
      drawQRWithLogo(qrDataUrl);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  };

  // Draw QR code with logo overlay
  const drawQRWithLogo = (qrImageUrl: string): void => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) {
      console.error('Canvas or context is null');
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw logo if loaded
      if (logoImage) {
        // Calculate logo size (20% of QR code)
        const logoSize = canvas.width * 0.2;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;
        
        // Draw white background circle for logo
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load QR image');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    
    img.src = qrImageUrl;
  };

  // Auto-generate QR when logo loads or canvas size changes
  useEffect(() => {
    if (logoLoaded && canvasRef.current && canvasSize) {
      generateQR();
    }
  }, [logoLoaded, canvasSize]);

  // Download QR code as PNG (preserves original quality)
  const downloadQR = (): void => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'qr-code-with-logo.png';
      link.href = canvasRef.current.toDataURL();
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
      
      {/* Container that limits canvas size */}
      <div ref={containerRef} style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            ...styles.canvas,
            width: '100%',
            height: 'auto',
            maxWidth: `${canvasSize}px`
          }}
        />
      </div>
      
      {/* Download Button */}
      {qrDataUrl && (
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
  canvasContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: '20px'
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
  canvas: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    display: 'block'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px'
  }
};

export default QRCodeWithLogo;
