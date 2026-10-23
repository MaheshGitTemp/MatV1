import React, { createContext, useState } from 'react';

export const TriggerContext = createContext();

export const TriggerProvider = ({ children }) => {
  const [triggerValue, setTriggerValue] = useState('');

  const triggercontx = (val) => {
    setTriggerValue(val);
    console.log(val); // For debugging purposes
  };

  return (
    <TriggerContext.Provider value={{ triggerValue, triggercontx }}>
      {children}
    </TriggerContext.Provider>
  );
};
