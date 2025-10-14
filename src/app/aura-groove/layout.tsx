
import { AudioEngineProvider } from '@/contexts/audio-engine-context';

export default function AuraGrooveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <AudioEngineProvider>
        {children}
    </AudioEngineProvider>
  );
}
