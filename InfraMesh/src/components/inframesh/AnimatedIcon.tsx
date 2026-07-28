// src/components/inframesh/AnimatedIcon.tsx
import { useState, useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import iconAnimation from "@/assets/my-icon.json";

interface AnimatedIconProps {
  className?: string;
  loop?: boolean;
  speed?: number; // <-- Add a speed prop
}

export function AnimatedIcon({ className = "w-6 h-6", loop = true, speed = 1 }: AnimatedIconProps) {
  const [isMounted, setIsMounted] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={className} />;
  }

  // @ts-ignore
  const LottieComponent = Lottie.default || Lottie;

  return (
    <div className={className}>
      <LottieComponent 
        lottieRef={lottieRef}
        animationData={iconAnimation} 
        loop={loop} 
        style={{ width: '100%', height: '100%' }} 
        onDOMLoaded={() => {
          // Set the speed as soon as the animation loads!
          if (lottieRef.current) {
            lottieRef.current.setSpeed(speed);
          }
        }}
      />
    </div>
  );
}