import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeWithLogo = () => {
  const [url, setUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const canvasRef = useRef(null);

  // Generate QR code
  const generateQR = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    try {
      // Generate QR code with high error correction (H level = 30% recovery)
      const qrDataUrl = await QRCode.toDataURL(canvasRef.current, url, {
        width: 800,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction for logo overlay
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
  const drawQRWithLogo = (qrImageUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw logo if present
      if (logoFile) {
        const logoImg = new Image();
        logoImg.onload = () => {
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
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        };
        logoImg.src = URL.createObjectURL(logoFile);
      }
    };
    img.src = qrImageUrl;
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      
      // Regenerate QR with new logo
      if (qrDataUrl) {
        drawQRWithLogo(qrDataUrl);
      }
    } else {
      alert('Please upload a PNG or JPG image');
    }
  };

  // Download QR code as PNG
  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'qr-code-with-logo.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create Your Branded QR Code</h2>
      
      {/* URL Input */}
      <div style={styles.inputGroup}>
        <label>Your Website URL:</label>
        <input
          type="url"
          placeholder="https://yourwebsite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.input}
        />
      </div>
      
      {/* Logo Upload */}
      <div style={styles.inputGroup}>
        <label>Your Logo (PNG or JPG):</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleLogoUpload}
          style={styles.fileInput}
        />
        {logoPreview && (
          <div style={styles.logoPreview}>
            <img src={logoPreview} alt="Logo preview" style={styles.previewImage} />
          </div>
        )}
      </div>
      
      {/* Generate Button */}
      <button onClick={generateQR} style={styles.button}>
        Generate QR Code
      </button>
      
      {/* QR Code Canvas */}
      <canvas
        ref={canvasRef}
        width="400"
        height="400"
        style={styles.canvas}
      />
      
      {/* Download Button */}
      {qrDataUrl && (
        <button onClick={downloadQR} style={styles.downloadButton}>
          Download QR Code as PNG
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: '20px',
    textAlign: 'left'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '5px'
  },
  fileInput: {
    marginTop: '5px'
  },
  logoPreview: {
    marginTop: '10px'
  },
  previewImage: {
    maxWidth: '100px',
    maxHeight: '100px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '5px'
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
    width: '100%'
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
    marginTop: '20px',
    width: '100%',
    height: 'auto'
  }
};

export default QRCodeWithLogo;
