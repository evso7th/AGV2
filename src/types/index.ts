export type MusicParameters = {
  tempo: number;
  scale: string;
  instrument: string;
  pattern: string;
  noteDensity: number;
};

export type Preset = {
  id: string;
  name: string;
  parameters: MusicParameters;
};
