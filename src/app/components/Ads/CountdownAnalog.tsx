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
          labels={['DAYS', 'HOURS', 'MINUTES', 'SECONDS']}
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
          overflow: hidden; /* Prevents overflow */
        }

        .countdown-container {
          width: 100%;
          aspect-ratio: 5/1;
          max-width: 100%;
          margin: 0 auto;
          position: relative;
          overflow: visible; /* Allow internal elements to be visible */
        }
        
        .countdown-container :global(.flip-clock-countdown) {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scale(1); /* Ensure no scaling issues */
          transform-origin: center;
        }
        
        .countdown-container :global(.flip-clock) {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 2px !important;
          padding: 0 !important;
          margin: 0 !important;
          flex-wrap: nowrap !important;
        }
        
        .countdown-container :global(.flip-clock__piece) {
          flex: 1 1 0px !important;
          min-width: 0 !important;
          max-width: 25% !important; /* Max 25% for 4 pieces */
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 1px !important;
          box-sizing: border-box !important;
        }
        
        /* Flip card styling */
        .countdown-container :global(.flip-clock__card) {
          width: 100% !important;
          height: 70% !important;
          min-height: 0 !important;
          font-size: clamp(12px, 4vw, 32px) !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          position: relative !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Front and back of flip cards */
        .countdown-container :global(.flip-clock__card__top),
        .countdown-container :global(.flip-clock__card__bottom),
        .countdown-container :global(.flip-clock__card__back) {
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.95), rgba(216, 191, 216, 0.95)) !important;
          color: #4a2c4a !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5) !important;
          overflow: hidden !important;
        }
        
        .countdown-container :global(.flip-clock__card__top) {
          background: linear-gradient(145deg, rgba(240, 240, 255, 0.98), rgba(226, 201, 226, 0.98)) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.5) !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .countdown-container :global(.flip-clock__card__bottom) {
          background: linear-gradient(125deg, rgba(220, 220, 245, 0.95), rgba(206, 181, 206, 0.95)) !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        /* Labels */
        .countdown-container :global(.flip-clock__slot) {
          font-size: clamp(6px, 1.2vw, 12px) !important;
          margin-top: 2px !important;
          text-align: center !important;
          color: #5b3e5b !important;
          font-weight: 600 !important;
          letter-spacing: 0.3px !important;
          text-transform: uppercase !important;
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.8), rgba(216, 191, 216, 0.8));
          padding: 2px 4px !important;
          border-radius: 8px !important;
          backdrop-filter: blur(2px);
          white-space: nowrap !important;
          width: fit-content !important;
          max-width: 90% !important;
          margin-left: auto !important;
          margin-right: auto !important;
          line-height: 1 !important;
        }
        
        /* Colon */
        .countdown-container :global(.flip-clock__colon) {
          color: #9b7e9b !important;
          font-size: clamp(10px, 3vw, 24px) !important;
          font-weight: bold !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: auto !important;
          min-width: 2px !important;
        }
        
        /* Completed message */
        .completed-message {
          display: block;
          text-align: center;
          font-size: clamp(12px, 3vw, 20px);
          color: #5b3e5b;
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.95), rgba(216, 191, 216, 0.95));
          padding: 8px 16px;
          border-radius: 20px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
          width: fit-content;
        }
        
        /* Mobile optimization */
        @media (max-width: 768px) {
          .countdown-container {
            aspect-ratio: 5/1;
          }
          
          .countdown-container :global(.flip-clock__card) {
            height: 65%;
            font-size: clamp(10px, 3.5vw, 24px) !important;
          }
          
          .countdown-container :global(.flip-clock__slot) {
            font-size: clamp(5px, 1vw, 10px) !important;
            padding: 1px 2px !important;
            margin-top: 1px !important;
            letter-spacing: 0.2px !important;
          }
          
          .countdown-container :global(.flip-clock) {
            gap: 1px !important;
          }
          
          .countdown-container :global(.flip-clock__colon) {
            font-size: clamp(8px, 2.5vw, 18px) !important;
          }
          
          .countdown-container :global(.flip-clock__piece) {
            max-width: 25% !important;
            padding: 0 !important;
          }
        }

        /* Small mobile optimization */
        @media (max-width: 480px) {
          .countdown-container :global(.flip-clock__card) {
            height: 60%;
            font-size: clamp(8px, 3vw, 18px) !important;
          }
          
          .countdown-container :global(.flip-clock__slot) {
            font-size: clamp(4px, 0.8vw, 8px) !important;
            padding: 1px !important;
            border-radius: 4px !important;
          }
        }

        /* Hide labels on very small screens if needed */
        @media (max-width: 360px) {
          .countdown-container :global(.flip-clock__slot) {
            display: none;
          }
          
          .countdown-container :global(.flip-clock__card) {
            height: 80%;
          }
        }
      `}</style>
    </div>
  );
};

export default CountdownAnalog;
