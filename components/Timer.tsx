import React, { useEffect, useState } from 'react';
import { Dispatch, SetStateAction } from 'react';

type TimerProps = {
  toTime: bigint;
  solanaTime: bigint;
  setCheckEligibility: Dispatch<SetStateAction<boolean>>;
};

export const Timer = ({ toTime, solanaTime, setCheckEligibility }: TimerProps) => {
  console.log("Timer component mounted with:", {
    toTime: toTime.toString(),
    solanaTime: solanaTime.toString(),
    difference: (toTime - solanaTime).toString()
  });

  const [remainingTime, setRemainingTime] = useState<bigint>(toTime - solanaTime);

  useEffect(() => {
    console.log("Timer props updated:", {
      toTime: toTime.toString(),
      solanaTime: solanaTime.toString(),
      newDifference: (toTime - solanaTime).toString()
    });
    setRemainingTime(toTime - solanaTime);
  }, [toTime, solanaTime]);

  useEffect(() => {
    console.log("Setting up timer interval, remaining time:", remainingTime.toString());
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - BigInt(1);
        if (next <= BigInt(0)) {
          console.log("Timer reached zero, triggering eligibility check");
          setCheckEligibility(true);
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);
    
    return () => {
      console.log("Cleaning up timer interval");
      clearInterval(interval);
    };
  }, [setCheckEligibility]);

  if (remainingTime <= BigInt(0)) {
    console.log("Timer returning null due to zero/negative time");
    return null;
  }

  const days = remainingTime / BigInt(86400);
  const hours = (remainingTime % BigInt(86400)) / BigInt(3600);
  const minutes = (remainingTime % BigInt(3600)) / BigInt(60);
  const seconds = remainingTime % BigInt(60);

  const formatNumber = (n: bigint) => n.toString().padStart(2, '0');

  return (
    <div className="font-press-start text-sm text-primary text-center">
      {days > BigInt(0) && (
        <span>{formatNumber(days)}d </span>
      )}
      {(days > BigInt(0) || hours > BigInt(0)) && (
        <span>{formatNumber(hours)}h </span>
      )}
      {(days > BigInt(0) || hours > BigInt(0) || minutes > BigInt(0)) && (
        <span>{formatNumber(minutes)}m </span>
      )}
      <span>{formatNumber(seconds)}s</span>
    </div>
  );
}; 