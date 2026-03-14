const { OpenAI } = require('openai');

async function testChat() {
  const openai = new OpenAI({
    apiKey: "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"
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log('Success:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error Details:');
    if (error.status) console.error('Status:', error.status);
    console.error('Message:', error.message);
    if (error.type) console.error('Type:', error.type);
    if (error.code) console.error('Code:', error.code);
  }
}

testChat();
