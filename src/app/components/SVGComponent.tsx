import * as React from "react";

const SVGComponent = (props:any) => (
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
        d="M12 4v10"
        stroke="#111827"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M8.5 10.5L12 14l3.5-3.5"
        stroke="#111827"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <line
      x1={6}
      y1={18}
      x2={18}
      y2={18}
      stroke="#111827"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <line
      x1={18}
      y1={15}
      x2={18}
      y2={18}
      stroke="#111827"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <line
      x1={6}
      y1={15}
      x2={6}
      y2={18}
      stroke="#111827"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);
export default SVGComponent;
