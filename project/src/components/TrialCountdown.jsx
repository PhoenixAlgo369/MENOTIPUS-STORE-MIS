import React, { useState, useEffect } from 'react';

const TrialCountdown = ({ user }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!user || !user.createdAt) return;

    // Skip countdown for exempt roles (admin, systems_admin, engineer)
    const exemptRoles = ['admin', 'systems_admin', 'engineer'];
    if (exemptRoles.includes(user.role)) {
      return;
    }

    const calculateTimeLeft = () => {
      const createdDate = new Date(user.createdAt);
      const trialEndDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from creation

      const difference = trialEndDate.getTime() - Date.now();

      if (difference <= 0) {
        setExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      if (timeLeft.days >= 0) {
        setTimeLeft(timeLeft);
      } else {
        setExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  // Don't show countdown for exempt roles
  const exemptRoles = ['admin', 'systems_admin', 'engineer'];
  if (!user || exemptRoles.includes(user.role)) {
    return null;
  }

  if (expired) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
        <div className="flex items-center">
          <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
          </svg>
          <p className="font-bold">Trial Expired!</p>
        </div>
        <p className="mt-2">Your 7-day trial has expired. Please contact an engineer to extend your access.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-4">
      <div className="flex items-center">
        <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
        </svg>
        <p className="font-bold">Trial Period Remaining</p>
      </div>
      <p className="mt-2">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </p>
      <p className="text-sm mt-1">of your 7-day free trial</p>
    </div>
  );
};

export default TrialCountdown;