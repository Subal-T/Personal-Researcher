const { GoogleGenAI } = require('@google/genai');

/**
 * Service to interface with the Google Gemini API.
 */
class GeminiService {
  constructor() {
    this.ai = null;
    this.modelName = 'gemini-2.5-flash';
  }

  /**
   * Initializes the Google Gen AI client.
   * Throws an error if the API key is missing or is the placeholder value.
   */
  init() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if we should run in mock mode
    this.isMockMode = !apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '';

    if (!this.isMockMode && !this.ai) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Generates a structured research report using the Gemini API.
   * @param {string} topic The research topic.
   * @param {string} context Optional additional context.
   * @returns {Promise<string>} The generated report markdown.
   */
  async generateResearchReport(topic, context) {
    this.init();

    if (this.isMockMode) {
      // Return a structured simulated report matching the layout expected by the frontend
      return `## Executive Summary
This is a simulated research report generated in **Mock Mode** because no valid Google Gemini API Key was configured in the \`.env\` file.
* Topic analyzed: **${topic}**
* Context provided: *${context || 'None'}*
* This mock response confirms the application integration, markdown parsing, and styling layout are working correctly.

## Key Insights
* **Modern Integration**: The backend uses the official \`@google/genai\` SDK to connect to Gemini 2.5 Flash.
* **Responsive Styling**: CSS is optimized for clean presentation with glassmorphism panels, interactive animations, and responsive grids.
* **Client-side Parsing**: Custom JavaScript dynamically splits markdown content into respective SaaS dashboard cards.

## Opportunities
* **API Configuration**: Replace \`YOUR_API_KEY\` with a real Gemini API Key from Google AI Studio to unlock actual intelligence.
* **Custom Customization**: Enhance prompt formatting to adapt to specific fields of research.
* **Extended Formats**: Add capabilities to download reports as PDF or markdown document formats.

## Risks
* **Rate Limits**: Free tier Gemini API keys are subject to rate limiting; proper handling of code 429 is built-in.
* **Data Privacy**: Ensure sensitive research context is not sent over open public endpoints without authorization.

## Recommendations
* **Obtain API Key**: Visit [Google AI Studio](https://aistudio.google.com/) to get a free API Key.
* **Configure Environment**: Update \`GEMINI_API_KEY\` in your \`.env\` file.
* **Restart Server**: Restart the Node process for changes to take effect.`;
    }

    // Construct the prompt exactly as specified
    let prompt = `Generate a professional research report.\n\nTopic:\n${topic}\n`;
    
    if (context && context.trim().length > 0) {
      prompt += `\nContext:\n${context}\n`;
    }

    prompt += `\nReturn ONLY the following headings.\n\nExecutive Summary\n\nKey Insights\n\nOpportunities\n\nRisks\n\nRecommendations\n\nUse bullet points.\nMake the report factual, concise, and professional.`;

    try {
      // Call Gemini API using the official SDK syntax
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      if (!response || !response.text) {
        throw new Error('Received an empty response from Gemini API.');
      }

      return response.text;
    } catch (error) {
      console.error('Gemini API Integration Error:', error);
      
      const errorMessage = error.message || '';
      const status = error.status || (error.response && error.response.status);
      
      // Provide meaningful user-facing errors
      if (status === 400 || status === 403 || errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('key is invalid') || errorMessage.includes('invalid key')) {
        throw new Error('Invalid Gemini API Key. Please verify your API key in the .env file.');
      } else if (status === 429 || errorMessage.includes('429') || errorMessage.includes('ResourceExhausted') || errorMessage.includes('quota')) {
        throw new Error('Gemini API rate limit exceeded. Please try again in a few moments.');
      } else if (status === 503 || errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('Unavailable')) {
        throw new Error('Gemini API service is currently unavailable or overloaded. Please try again shortly.');
      } else if (errorMessage.toLowerCase().includes('timeout') || error.code === 'ETIMEDOUT') {
        throw new Error('Gemini API request timed out. Please check your connection and try again.');
      }
      
      throw new Error(error.message || 'An error occurred while communicating with Gemini API.');
    }
  }
}

module.exports = new GeminiService();
