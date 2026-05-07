import * as React from "react";

const SVGComponent = (props: any) => (
  <svg
    width={120}
    height={120}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g>
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0 0; 0 -2; 0 1; 0 0"
        dur="0.8s"
        repeatCount="indefinite"
      />

      <path
        d="M12 4V14"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="butt"
      />

      <path
        d="M8 11 L12 15 L16 11"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </g>

    <line
      x1={6}
      y1={18}
      x2={18}
      y2={18}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="butt"
    />

    <line
      x1={18}
      y1={15}
      x2={18}
      y2={19}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="butt"
    />

    <line
      x1={6}
      y1={15}
      x2={6}
      y2={19}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="butt"
    />
  </svg>
);

export default SVGComponent;
