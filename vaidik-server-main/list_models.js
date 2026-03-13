const { OpenAI } = require('openai');

async function listModels() {
  const openai = new OpenAI({
    apiKey: "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"
  });

  try {
    const list = await openai.models.list();
    const sorted = list.data.map(m => m.id).sort();
    console.log(JSON.stringify(sorted, null, 2));
  } catch (error) {
    console.error('Error fetching models:', error.message);
  }
}

listModels();
