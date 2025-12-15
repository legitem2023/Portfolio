import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_3D_MODEL } from '../../../components/graphql/mutation';

function Upload3DModel() {
  const [file, setFile] = useState(null);
  const [uploadModel, { loading, error, data }] = useMutation(UPLOAD_3D_MODEL);

  const handleFileChange = (e:any) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    if (!file) return;

    try {
      await uploadModel({
        variables: {
          file: file,
          filename: file.name,
          productId:""
        }
      });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".glb,.gltf,.obj,.fbx,.stl"
          onChange={handleFileChange}
          required
        />
        
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload 3D Model'}
        </button>
      </form>

      {error && <p className="error">Error: {error.message}</p>}
      
      {data?.upload3DModel?.success && (
        <div className="success">
          <h3>✅ Upload Successful!</h3>
          <p><strong>File:</strong> {data.upload3DModel.model.filename}</p>
          <p><strong>URL:</strong> 
            <a href={data.upload3DModel.model.url} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default Upload3DModel;
