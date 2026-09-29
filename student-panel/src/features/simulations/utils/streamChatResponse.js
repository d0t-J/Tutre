export async function readSseStream(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let fullText = '';
  let buffer = '';

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      let eolIndex;
      while ((eolIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, eolIndex).trim();
        buffer = buffer.slice(eolIndex + 1);
        
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const dataObj = JSON.parse(line.slice(6));
            const content = dataObj.choices?.[0]?.delta?.content || '';
            fullText += content;
          } catch {
            // Ignore incomplete SSE parse errors
          }
        }
      }
      
      if (fullText.length > 0) {
        onChunk(fullText);
      }
    }
  }

  return fullText;
}
