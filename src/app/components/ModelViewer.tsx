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
            <div style={{
  background: 'radial-gradient(circle, white, indigo)',
  borderRadius: '8px'
}}>
  <model-viewer
    src={data}
    alt="A 3D model"
    ar
    ar-scale="fixed"
    camera-controls
    touch-action="pan-y"
    shadow-intensity="2"
    skybox-height="1m"
    max-camera-orbit="auto 90deg auto"
    className="aspect-[4/3]"
    style={{ 
        width: '100%', 
        minWidth: '400px',
        height: 'auto',
        minHeight: '300px'
    }}
/>
</div>
        </div>
    );
};

export default ModelViewer;
