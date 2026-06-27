const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

/**
 * POST /api/research
 * Generates a research report based on a topic and optional context.
 */
router.post('/', async (req, res) => {
  try {
    const { topic, context } = req.body;

    // 1. Validation: Topic cannot be empty and has a max length of 200 chars
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Topic cannot be empty. Please enter a valid research topic.'
      });
    }

    if (topic.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Topic is too long. The maximum allowed length is 200 characters.'
      });
    }

    // 2. Validation: Context is optional but has a max length of 1000 chars
    if (context && typeof context === 'string' && context.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Context is too long. The maximum allowed length is 1000 characters.'
      });
    }

    // 3. Generate the report
    const report = await geminiService.generateResearchReport(topic, context);

    // 4. Return success response
    return res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Research Route Error:', error);
    
    // Determine the status code based on error message
    let status = 500;
    const message = error.message || 'An unexpected error occurred while generating the report.';
    
    if (message.includes('Invalid Gemini API Key')) {
      status = 401; // Unauthorized
    } else if (message.includes('rate limit')) {
      status = 429; // Too Many Requests
    } else if (message.includes('unavailable') || message.includes('overloaded')) {
      status = 503; // Service Unavailable
    } else if (message.includes('timed out')) {
      status = 504; // Gateway Timeout
    }
    
    return res.status(status).json({
      success: false,
      error: message
    });
  }
});

module.exports = router;
