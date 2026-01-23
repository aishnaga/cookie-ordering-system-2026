import { createContext, useContext, useState, useEffect } from 'react';

const FamilyContext = createContext();

export function FamilyProvider({ children }) {
  const [selectedFamily, setSelectedFamily] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedFamily');
    if (saved) {
      setSelectedFamily(JSON.parse(saved));
    }
  }, []);

  const selectFamily = (family) => {
    setSelectedFamily(family);
    localStorage.setItem('selectedFamily', JSON.stringify(family));
  };

  const clearFamily = () => {
    setSelectedFamily(null);
    localStorage.removeItem('selectedFamily');
  };

  return (
    <FamilyContext.Provider value={{ selectedFamily, selectFamily, clearFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
