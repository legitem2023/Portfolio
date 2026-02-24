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
        
        /* Remove all default spacing */
        .countdown-container :global(.flip-clock-countdown) {
          transform: scale(1);
          transform-origin: center;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          width: auto !important;
          height: auto !important;
          max-width: 100%;
        }
        
        /* Reset flip-clock container */
        .countdown-container :global(.flip-clock) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 2px !important;
          flex-wrap: nowrap !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Remove any default margins/padding from pieces */
        .countdown-container :global(.flip-clock__piece) {
          margin: 0 !important;
          padding: 0 1px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        
        /* Flip card styling - TRANSPARENT LAVENDER */
        .countdown-container :global(.flip-clock__card) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
          font-weight: bold !important;
        }
        
        /* Front and back of flip cards - LAVENDER GRADIENT WITH TRANSPARENCY */
        .countdown-container :global(.flip-clock__card__top),
        .countdown-container :global(.flip-clock__card__bottom),
        .countdown-container :global(.flip-clock__card__back),
        .countdown-container :global(.flip-clock__card__back::before),
        .countdown-container :global(.flip-clock__card__back::after) {
          background: linear-gradient(135deg, rgba(220, 200, 255, 0.85), rgba(200, 170, 240, 0.85)) !important;
          color: #4a2c6a !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(2px);
        }
        
        /* Top part - slightly lighter */
        .countdown-container :global(.flip-clock__card__top) {
          background: linear-gradient(145deg, rgba(230, 215, 255, 0.9), rgba(210, 185, 245, 0.9)) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
        }
        
        /* Bottom part - slightly deeper */
        .countdown-container :global(.flip-clock__card__bottom) {
          background: linear-gradient(125deg, rgba(210, 185, 245, 0.85), rgba(190, 160, 230, 0.85)) !important;
        }
        
        /* Labels - SCALES WITH COUNTDOWN */
        .countdown-container :global(.flip-clock__slot) {
          font-size: calc(0.7em * var(--scale-factor, 1)) !important;
          margin-top: calc(5px * var(--scale-factor, 1)) !important;
          text-align: center !important;
          color: #4a2c6a !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
          background: linear-gradient(135deg, rgba(220, 200, 255, 0.7), rgba(200, 170, 240, 0.7));
          padding: calc(2px * var(--scale-factor, 1)) calc(8px * var(--scale-factor, 1)) !important;
          border-radius: calc(12px * var(--scale-factor, 1)) !important;
          backdrop-filter: blur(2px);
          white-space: nowrap !important;
          line-height: 1.2 !important;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        /* Colon */
        .countdown-container :global(.flip-clock__colon) {
          color: #9b7eb0 !important;
          font-size: calc(1.5em * var(--scale-factor, 1)) !important;
          font-weight: bold !important;
          margin: 0 !important;
          padding: 0 !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Numbers inside flip cards */
        .countdown-container :global(.flip-clock__card__top),
        .countdown-container :global(.flip-clock__card__bottom) {
          font-size: 1em !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        /* Completed message */
        .completed-message {
          display: block;
          text-align: center;
          font-size: 16px;
          color: #4a2c6a;
          background: linear-gradient(135deg, rgba(220, 200, 255, 0.9), rgba(200, 170, 240, 0.9));
          padding: 8px 16px;
          border-radius: 20px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
          width: fit-content;
        }
        
        /* Mobile: scale down the entire countdown and labels proportionally */
        @media (max-width: 768px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.9);
            --scale-factor: 0.9;
          }
        }

        @media (max-width: 600px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.8);
            --scale-factor: 0.8;
          }
        }

        @media (max-width: 480px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.7);
            --scale-factor: 0.7;
          }
        }

        @media (max-width: 375px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.6);
            --scale-factor: 0.6;
          }
        }

        @media (max-width: 320px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.55);
            --scale-factor: 0.55;
          }
        }

        @media (max-width: 280px) {
          .countdown-container :global(.flip-clock-countdown) {
            transform: scale(0.5);
            --scale-factor: 0.5;
          }
          
          .countdown-container :global(.flip-clock__slot) {
            display: none; /* Hide labels on extremely small screens */
          }
        }
      `}</style>
    </div>
  );
};

export default CountdownAnalog;
