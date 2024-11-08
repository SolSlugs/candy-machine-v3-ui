import React, { useEffect, useState } from 'react';
import { Dispatch, SetStateAction } from 'react';

type TimerProps = {
  toTime: bigint;
  solanaTime: bigint;
  setCheckEligibility: Dispatch<SetStateAction<boolean>>;
};

export const Timer = ({ toTime, solanaTime, setCheckEligibility }: TimerProps) => {
  const [remainingTime, setRemainingTime] = useState<bigint>(toTime - solanaTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        return prev - BigInt(1);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = remainingTime / BigInt(86400);
  const hours = (remainingTime % BigInt(86400)) / BigInt(3600);
  const minutes = (remainingTime % BigInt(3600)) / BigInt(60);
  const seconds = remainingTime % BigInt(60);

  if (remainingTime <= BigInt(0)) {
    setCheckEligibility(true);
    return null;
  }

  const formatNumber = (n: bigint) => n.toString().padStart(2, '0');

  if (days > BigInt(0)) {
    return (
      <span className="text-sm font-bold">
        {formatNumber(days)}d {formatNumber(hours)}h {formatNumber(minutes)}m {formatNumber(seconds)}s
      </span>
    );
  }

  if (hours > BigInt(0)) {
    return (
      <span className="text-sm font-bold">
        {formatNumber(hours)}h {formatNumber(minutes)}m {formatNumber(seconds)}s
      </span>
    );
  }

  return (
    <span className="text-sm font-bold">
      {formatNumber(minutes)}m {formatNumber(seconds)}s
    </span>
  );
}; 