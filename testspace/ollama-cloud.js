// Ollama Cloud API client
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

async function main() {
  if (!OLLAMA_API_KEY) {
    console.error('Error: OLLAMA_API_KEY is not set');
    process.exit(1);
  }

  try {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OLLAMA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma4:31b',
        messages: [
          {
            role: 'user',
            content: 'Hello! Tell me a short joke.'
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, response.statusText);
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log(data.message?.content || JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

main();
