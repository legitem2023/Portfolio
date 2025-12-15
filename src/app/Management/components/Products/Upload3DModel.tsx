import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_3D_MODEL } from '../../../components/graphql/mutation';

function Upload3DModel() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);

  // Using onCompleted and onError callbacks
  const [uploadModel, { loading }] = useMutation(UPLOAD_3D_MODEL, {
    onCompleted: (data) => {
      console.log(data?.upload3DModel);
      if(data?.upload3DModel.success) {
         setUploadData(data);
         setUploadSuccess(true);
         setUploadError(null);
      
         // Reset file input after successful upload
         setFile(null);
         const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = ''; 
      }  
    },
    onError: (error) => {
      console.error('❌ Upload error:', error);
      setUploadError(error.message);
      setUploadSuccess(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null); // Clear previous errors when new file is selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    try {
      // Reset states
      setUploadSuccess(false);
      setUploadError(null);
      
      // Execute mutation
      await uploadModel({
        variables: {
          file: file,
          filename: file.name,
          productId: "68c8c1765038c47a4b9ef519"
        }
      });
      
      // No need to handle success/error here since onCompleted/onError will handle it
    } catch (err) {
      // This catch block might not be needed since onError handles it,
      // but it's good for additional error handling
      console.error('Submission error:', err);
    }
  };

  // Optional: Use useEffect to log or handle side effects
  useEffect(() => {
    if (uploadSuccess) {
      console.log('Upload was successful! Data:', uploadData);
      // You could trigger additional actions here, like:
      // - Refresh a list of models
      // - Show a toast notification
      // - Navigate to another page
    }
  }, [uploadSuccess, uploadData]);

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".glb,.gltf,.obj,.fbx,.stl"
          onChange={handleFileChange}
          required
        />
        
        <button 
          type="submit" 
          disabled={loading || !file}
          style={{ 
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <span style={{ marginRight: '8px' }}>⏳</span>
              Uploading...
            </>
          ) : 'Upload 3D Model'}
        </button>
      </form>

      {/* Error Display */}
      {uploadError && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          padding: '10px',
          marginTop: '10px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <p><strong>❌ Upload Failed:</strong></p>
          <p>{uploadError}</p>
        </div>
      )}

      {/* Success Display */}
      {uploadSuccess && uploadData?.upload3DModel && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724',
          padding: '15px',
          marginTop: '10px',
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ marginTop: 0 }}>✅ Upload Successful!</h3>
          <p><strong>File Name:</strong> {uploadData.upload3DModel.model.filename}</p>
          <p><strong>Upload Date:</strong> {new Date().toLocaleString()}</p>
          <p><strong>Model URL:</strong></p>
          <a 
            href={uploadData.upload3DModel.model.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-block',
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              textDecoration: 'none',
              marginTop: '8px'
            }}
          >
            View/Download Model
          </a>
          
          {/* Optional: Show preview link if available */}
          {uploadData.upload3DModel.model.previewUrl && (
            <div style={{ marginTop: '10px' }}>
              <p><strong>Preview:</strong></p>
              <img 
                src={uploadData.upload3DModel.model.previewUrl} 
                alt="Model preview" 
                style={{ maxWidth: '200px', height: 'auto' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div style={{ 
          backgroundColor: '#e2e3e5', 
          color: '#383d41',
          padding: '10px',
          marginTop: '10px',
          borderRadius: '4px'
        }}>
          <p><strong>⏳ Upload in progress...</strong></p>
          <p>Please wait while your model is being processed.</p>
          <div style={{ 
            width: '100%', 
            height: '4px', 
            backgroundColor: '#ccc',
            borderRadius: '2px',
            marginTop: '8px'
          }}>
            <div style={{ 
              width: '60%', 
              height: '100%', 
              backgroundColor: '#007bff',
              borderRadius: '2px',
              animation: 'loading 1.5s ease-in-out infinite'
            }}></div>
          </div>
          <style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default Upload3DModel;
