import { googleGenai } from '@genkit-ai/google-genai';
import { listModels } from 'genkit/plugins';

async function getModels() {
  const models = await listModels(googleGenai());
  console.log(models);
}

getModels();
