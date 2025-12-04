
import { cn } from "@/lib/utils";

const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div 
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          animation: 'bounce-dot 1.4s infinite ease-in-out both',
          animationDelay: '0s'
        }}
      ></div>
      <div 
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: 'hsl(var(--accent))',
          animation: 'bounce-dot 1.4s infinite ease-in-out both',
          animationDelay: '-0.2s'
        }}
      ></div>
      <div 
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          animation: 'bounce-dot 1.4s infinite ease-in-out both',
          animationDelay: '-0.4s'
        }}
      ></div>
    </div>
  );
};

export default LoadingDots;
