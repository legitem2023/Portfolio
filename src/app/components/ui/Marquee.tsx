// components/Marquee.js
export default function Marquee({ text = "This is a custom marquee using CSS animation.", fontSize = "1rem", speed = 10 }) {
  return (
    <div className="marquee-container">
      <div className="marquee">{text}</div>
      <style jsx>{`
        .marquee-container {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }

        .marquee {
          display: inline-block;
          padding-left: 100%;
          font-size: ${fontSize};
          animation: marquee ${speed}s linear infinite;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
