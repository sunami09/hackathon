import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const Notification = ({ message, type = 'warning', onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClear, 300); 
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, onClear]);
  const notificationClasses = `notification ${type} ${visible ? 'visible' : ''}`;

  if (!message) return null;

  return (
    <div className={notificationClasses}>
      <AlertTriangle size={16} />
      <span>{message}</span>
    </div>
  );
};

export default Notification;