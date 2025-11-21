import Script from 'next/script';
import React from 'react';

interface ModelViewerProps {
  data: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ data }) => {
    return (
        <div className="canvas">
            <Script
                type="module"
                src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
                strategy="lazyOnload"
            />
            {/* @ts-ignore */}
            <model-viewer
                src={data}
                alt="A 3D model"
                ar
                ar-scale="fixed"
                camera-controls 
                touch-action="pan-y"
                shadow-intensity="2"
                skybox-image="https://modelviewer.dev/shared-assets/environments/whipple_creek_regional_park_1k_HDR.jpg"
                skybox-height="2m"
                max-camera-orbit="auto 90deg auto"
                style={{ width: '400px', height: '400px', backgroundColor: 'red' }}
            />
        </div>
    );
};

export default ModelViewer;
