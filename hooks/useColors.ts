import { useEffect, useState } from 'react';

const useColors = () => {
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);

  useEffect(() => {
    setPrimaryColor(localStorage.getItem('primaryColor'));
    setSecondaryColor(localStorage.getItem('secondaryColor'));
  }, []);

  const applyColor = (colorType: 'primary' | 'secondary', color: string) => {
    if (colorType === 'primary') {
      document.documentElement.style.setProperty('--primary-color', color);
      localStorage.setItem('primaryColor', color);
      setPrimaryColor(color);
    } else {
      document.documentElement.style.setProperty('--secondary-color', color);
      localStorage.setItem('secondaryColor', color);
      setSecondaryColor(color);
    }
  };

  return {
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
    applyColor,
  };
};

export default useColors;
