"use client";

import React from 'react';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';

const CountdownAnalog = ({ targetDate }: any) => {
  return (
    <div className="countdown-wrapper">
      <div className="countdown-container">
        <FlipClockCountdown
          to={targetDate}
          className="flip-clock-countdown"
        >
          <span className="completed-message">The countdown is complete!</span>
        </FlipClockCountdown>
      </div>

      <style jsx>{`
        .countdown-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .countdown-container {
          width: 100%;
          aspect-ratio: 5/1;
          max-width: 100%;
          margin: 0 auto;
          position: relative;
        }
        
        .countdown-container :global(.flip-clock-countdown) {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .countdown-container :global(.flip-clock) {
          width: 100% !important;
          height: 100% !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(2px, 1vw, 8px);
          padding: 0 2px;
        }
        
        .countdown-container :global(.flip-clock__piece) {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0; /* Prevents overflow */
        }
        
        /* Flip card styling with lavender gradient */
        .countdown-container :global(.flip-clock__card) {
          width: 100%;
          height: 75%;
          font-size: clamp(14px, 6vw, 48px);
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Front and back of flip cards */
        .countdown-container :global(.flip-clock__card__top),
        .countdown-container :global(.flip-clock__card__bottom),
        .countdown-container :global(.flip-clock__card__back::before),
        .countdown-container :global(.flip-clock__card__back::after) {
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.95), rgba(216, 191, 216, 0.95)) !important;
          color: #4a2c4a !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5) !important;
        }
        
        /* Hover effect for the gradient */
        .countdown-container :global(.flip-clock__card__top) {
          background: linear-gradient(145deg, rgba(240, 240, 255, 0.98), rgba(226, 201, 226, 0.98)) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.5) !important;
        }
        
        .countdown-container :global(.flip-clock__card__bottom) {
          background: linear-gradient(125deg, rgba(220, 220, 245, 0.95), rgba(206, 181, 206, 0.95)) !important;
        }
        
        /* Divider between flip cards */
        .countdown-container :global(.flip-clock__card__back::before) {
          background: linear-gradient(90deg, rgba(180, 150, 200, 0.5), rgba(150, 120, 170, 0.5)) !important;
        }
        
        /* Labels (Days, Hours, etc) */
        .countdown-container :global(.flip-clock__slot) {
          font-size: clamp(8px, 2vw, 16px);
          margin-top: clamp(2px, 1vh, 8px);
          text-align: center;
          color: #5b3e5b;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.6), rgba(216, 191, 216, 0.6));
          padding: 2px 8px;
          border-radius: 12px;
          backdrop-filter: blur(2px);
          white-space: nowrap;
        }
        
        /* Colon between pieces */
        .countdown-container :global(.flip-clock__colon) {
          color: #9b7e9b !important;
          font-size: clamp(12px, 4vw, 32px) !important;
          font-weight: bold !important;
          margin: 0 1px !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Completed message styling */
        .completed-message {
          display: block;
          text-align: center;
          font-size: clamp(14px, 4vw, 24px);
          color: #5b3e5b;
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.9), rgba(216, 191, 216, 0.9));
          padding: 10px 20px;
          border-radius: 30px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        /* Mobile optimization */
        @media (max-width: 768px) {
          .countdown-container {
            aspect-ratio: 5/1;
          }
          
          .countdown-container :global(.flip-clock__card) {
            height: 70%;
            font-size: clamp(12px, 5vw, 28px);
          }
          
          .countdown-container :global(.flip-clock__slot) {
            font-size: clamp(6px, 1.5vw, 12px);
            padding: 1px 4px;
            margin-top: 1px;
          }
          
          .countdown-container :global(.flip-clock) {
            gap: 1px;
          }
          
          .countdown-container :global(.flip-clock__colon) {
            font-size: clamp(8px, 3vw, 20px) !important;
          }
        }

        /* Small mobile optimization */
        @media (max-width: 480px) {
          .countdown-container :global(.flip-clock__card) {
            height: 65%;
            font-size: clamp(10px, 4vw, 20px);
          }
          
          .countdown-container :global(.flip-clock__slot) {
            font-size: clamp(5px, 1.2vw, 10px);
            padding: 1px 2px;
          }
        }

        /* Very small screens */
        @media (max-width: 320px) {
          .countdown-container :global(.flip-clock__slot) {
            display: none; /* Hide labels on very small screens */
          }
          
          .countdown-container :global(.flip-clock__card) {
            height: 85%;
          }
        }
      `}</style>
    </div>
  );
};

export default CountdownAnalog;
