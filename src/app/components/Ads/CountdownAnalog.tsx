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
          overflow: hidden;
          padding: 0;
          margin: 0;
        }

        .countdown-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* Scale the entire countdown based on container width */
        .countdown-container :global(.flip-clock-countdown) {
          transform: scale(1);
          transform-origin: center;
          margin: 0 auto !important;
          padding: 0 !important;
          width: auto !important;
          height: auto !important;
          max-width: 100%;
        }
        
        /* Let the library handle the internal sizing, we just scale the container */
        .countdown-container :global(.flip-clock) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: clamp(2px, 0.5vw, 5px) !important;
          flex-wrap: nowrap !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* Allow natural sizing */
        .countdown-container :global(.flip-clock__piece) {
          margin: 0 !important;
          padding: 0 1px !important;
        }
        
        /* Flip card styling with lavender gradient - keep original proportions */
        .countdown-container :global(.flip-clock__card) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          font-size: inherit !important;
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
        }
        
        .countdown-container :global(.flip-clock__card__top) {
          background: linear-gradient(145deg, rgba(240, 240, 255, 0.98), rgba(226, 201, 226, 0.98)) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.5) !important;
        }
        
        .countdown-container :global(.flip-clock__card__bottom) {
          background: linear-gradient(125deg, rgba(220, 220, 245, 0.95), rgba(206, 181, 206, 0.95)) !important;
        }
        
        /* Labels */
        .countdown-container :global(.flip-clock__slot) {
          font-size: 0.7em !important;
          margin-top: 5px !important;
          text-align: center !important;
          color: #5b3e5b !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
          background: linear-gradient(135deg, rgba(230, 230, 250, 0.8), rgba(216, 191, 216, 0.8));
          padding: 2px 8px !important;
          border-radius: 12px !important;
          backdrop-filter: blur(2px);
          white-space: nowrap !important;
        }
        
        /* Colon */
        .countdown-container :global(.flip-clock__colon) {
          color: #9b7e9b !important;
          font-size: 1.5em !important;
          font-weight: bold !important;
          margin: 0 2px !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Completed message */
        .completed-message {
          display: block;
          text-align: center;
          font-size: 16px;
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
        
        /* Mobile: scale down the entire countdown */
        @media (max-width: 768px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.9);
          }
        }

        @media (max-width: 600px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.8);
          }
          
          .countdown-container :global(.flip-clock__slot) {
            font-size: 0.6em !important;
            padding: 2px 4px !important;
          }
        }

        @media (max-width: 480px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.7);
          }
          
          .countdown-container :global(.flip-clock__colon) {
            margin: 0 1px !important;
          }
        }

        @media (max-width: 375px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.6);
          }
        }

        @media (max-width: 320px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.55);
          }
          
          .countdown-container :global(.flip-clock__slot) {
            font-size: 0.5em !important;
          }
        }

        @media (max-width: 280px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default CountdownAnalog;
