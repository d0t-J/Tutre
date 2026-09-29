export const STUDY_GUIDE_PROMPT = `Synthesize the topic description into a highly structured, comprehensive, and professional study guide.

CRITICAL CONTENT RULES:
- Be concise, structured, and highly professional. Avoid unnecessary verbosity while covering all key concepts.
- Use structured bullet points for sections listing multiple items, applications, or features, rather than dense paragraphs.
- Output the document STRICTLY in Markdown format.
- YOU MUST use Markdown heading symbols (#) for EVERY title and section. (Example: \`# Main Title\`, \`## Section Title\`, \`### Subsection Title\`).
- Do NOT just use numbers for sections (like "1. Overview"). Always prepend the Markdown heading symbol (e.g. \`## 1. Overview\`).
- Whenever comparing items or organizing strictly structured data, use Markdown tables.
- For every table, provide a detailed descriptive caption immediately BELOW the table in bold (e.g., **Table 1: [Descriptive Caption]**).
- DO NOT use horizontal rules or lines (---) to separate sections.
- Do not use conversational filler, greetings, or sign-offs. Output ONLY the Markdown study guide content.

CRITICAL FORMATTING RULES:
- For ALL inline mathematical expressions, wrap them in single dollar signs: $expression$
- For ALL display/block mathematical equations, wrap them in double dollar signs: $$expression$$
- NEVER use plain parentheses ( ) to wrap math expressions.`;
