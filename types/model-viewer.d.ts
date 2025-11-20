declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-scale'?: string;
        'camera-controls'?: boolean;
        'touch-action'?: string;
        'shadow-intensity'?: string;
        'skybox-image'?: string;
        'skybox-height'?: string;
        'max-camera-orbit'?: string;
        style?: React.CSSProperties;
      },
      HTMLElement
    >;
  }
          }
