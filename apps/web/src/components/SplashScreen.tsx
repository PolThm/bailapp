import { useEffect, useState } from 'react';
import dancingCoupleLogo from '@/components/icons/dancing-couple.png';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onFinish after fade animation completes
      setTimeout(onFinish, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <img
        src={dancingCoupleLogo}
        alt="Bailapp"
        className="h-32 w-32 mb-6 animate-pulse"
      />
      <h1 className="text-4xl font-bold text-white">Bailapp</h1>
      <p className="text-white/80 mt-2">Dance. Create. Learn.</p>
    </div>
  );
}

