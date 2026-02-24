"use client";

import React from 'react';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';

const CountdownAnalog = ({ targetDate }) => {
  return (
    <FlipClockCountdown
      to={targetDate}
      // Optional: Add a component to render when the countdown is complete
      className="flip-clock-countdown"
    >
      <span>The countdown is complete!</span>
    </FlipClockCountdown>
  );
};

export default CountdownAnalog;
