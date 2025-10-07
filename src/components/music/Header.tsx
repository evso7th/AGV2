import { Music4 } from 'lucide-react';

export default function Header() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <Music4 className="w-8 h-8 text-accent" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">
          MathTune Box
        </h1>
      </div>
      <p className="text-muted-foreground mt-2">
        An interactive music box with mathematically generated melodies.
      </p>
    </header>
  );
}
