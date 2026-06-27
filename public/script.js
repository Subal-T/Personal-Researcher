/**
 * FRONTEND CONTROLLER: AI Research Assistant
 * Vanilla ES6 JavaScript implementing user interaction, state, API calls, and Markdown parsing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. DOM Elements Selection
  // ==========================================================================
  const themeToggle = document.getElementById('theme-toggle');

  const researchForm = document.getElementById('research-form');
  const topicInput = document.getElementById('topic-input');
  const contextInput = document.getElementById('context-input');

  const topicCounter = document.getElementById('topic-counter');
  const contextCounter = document.getElementById('context-counter');

  const generateBtn = document.getElementById('generate-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnText = generateBtn.querySelector('.btn-text');

  const errorConsole = document.getElementById('error-console');
  const errorMessage = document.getElementById('error-message');

  const outputSection = document.getElementById('output-section');
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const clearBtn = document.getElementById('clear-btn');

  const toast = document.getElementById('toast');

  // Report card bodies
  const cardExecBody = document.querySelector('#card-executive-summary .card-body');
  const cardInsightsBody = document.querySelector('#card-key-insights .card-body');
  const cardOppsBody = document.querySelector('#card-opportunities .card-body');
  const cardRisksBody = document.querySelector('#card-risks .card-body');
  const cardRecsBody = document.querySelector('#card-recommendations .card-body');

  // Global State
  let currentReportText = ''; // Stores the raw Markdown report for copy/download

  // ==========================================================================
  // 2. Dark Mode & Theme Toggle Persistence
  // ==========================================================================
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    showToast(`${isDark ? 'Dark' : 'Light'} theme enabled`);
  });

  initTheme();

  // ==========================================================================
  // 3. Input Character Counters & Auto-Resize Textarea
  // ==========================================================================
  const updateCharCounter = (inputEl, counterEl, maxLength) => {
    const currentLen = inputEl.value.length;
    counterEl.textContent = `${currentLen} / ${maxLength}`;

    // Add visual warning when nearing limit (e.g., 90%)
    if (currentLen >= maxLength * 0.9) {
      counterEl.style.color = 'var(--color-risks)';
    } else {
      counterEl.style.color = 'var(--text-muted)';
    }
  };

  topicInput.addEventListener('input', () => {
    updateCharCounter(topicInput, topicCounter, 200);
  });

  contextInput.addEventListener('input', () => {
    updateCharCounter(contextInput, contextCounter, 1000);
    // Auto-resize the textarea height based on content scrollHeight
    contextInput.style.height = 'auto';
    contextInput.style.height = `${contextInput.scrollHeight}px`;
  });

  // ==========================================================================
  // 4. Toast Notification Utility
  // ==========================================================================
  let toastTimeout;
  const showToast = (message) => {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.remove('hidden');
    // Force browser reflow to trigger CSS entry transition
    void toast.offsetWidth;
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      // Hide completely after transition completes
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300);
    }, 2500);
  };

  // ==========================================================================
  // 5. Robust Markdown / Section Parser
  // ==========================================================================

  /**
   * Helper to format inline Markdown tags (Bold, Italic, Code blocks)
   */
  const formatInlineMarkdown = (text) => {
    if (!text) return '';
    // Escape HTML characters to prevent XSS injection
    let safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // 1. Bold: **text** or __text__
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safeText = safeText.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 2. Italic: *text* or _text_
    safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safeText = safeText.replace(/_(.*?)_/g, '<em>$1</em>');

    // 3. Inline code: `code`
    safeText = safeText.replace(/`(.*?)`/g, '<code>$1</code>');

    return safeText;
  };

  /**
   * Converts a block of markdown/text lines into structured HTML bullet list items
   */
  const formatSectionHTML = (text) => {
    if (!text || text.trim() === '') {
      return '<p class="no-content">No specific items provided in this section.</p>';
    }

    const lines = text.split('\n');
    let html = '<ul>';
    let hasItems = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Match common markdown bullet formats: * or - or + or • or numbered list: 1.
      const bulletMatch = trimmed.match(/^[-*+•]\s+(.*)$/) || trimmed.match(/^\d+\.\s+(.*)$/);

      if (bulletMatch) {
        const itemContent = formatInlineMarkdown(bulletMatch[1]);
        html += `<li>${itemContent}</li>`;
        hasItems = true;
      } else {
        // If it's a line that doesn't start with a bullet point, display it as a paragraph style item
        const itemContent = formatInlineMarkdown(trimmed);
        html += `<li class="non-bullet">${itemContent}</li>`;
        hasItems = true;
      }
    });

    html += '</ul>';
    return hasItems ? html : `<p>${formatInlineMarkdown(text)}</p>`;
  };

  /**
   * Parses the raw report Markdown text by slicing content between target headers.
   */
  const parseReport = (text) => {
    const sections = {
      "Executive Summary": "",
      "Key Insights": "",
      "Opportunities": "",
      "Risks": "",
      "Recommendations": ""
    };

    const headers = [
      "Executive Summary",
      "Key Insights",
      "Opportunities",
      "Risks",
      "Recommendations"
    ];

    const positions = [];

    // Locate the matching headers in the response body
    headers.forEach(header => {
      // Regex matches header names on their own line with optional Markdown headers (e.g. ## Executive Summary)
      const regex = new RegExp(`(?:^|\\n)[\\s#*_-]*${header}[\\s*:\\-_]*(?:\\n|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        positions.push({
          header,
          index: match.index,
          length: match[0].length
        });
      }
    });

    // Sort positions sequentially as they appear in the response text
    positions.sort((a, b) => a.index - b.index);

    // Slice content between successive located headers
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index + positions[i].length;
      const end = (i + 1 < positions.length) ? positions[i + 1].index : text.length;
      const content = text.slice(start, end).trim();
      sections[positions[i].header] = content;
    }

    // Fallback: If no headers match, put everything into the Executive Summary
    if (positions.length === 0) {
      sections["Executive Summary"] = text;
    }

    return sections;
  };

  /**
   * Renders the parsed sections into the UI report cards
   */
  const renderReport = (reportText) => {
    currentReportText = reportText;
    const parsedData = parseReport(reportText);

    // Inject formatted HTML into each respective card
    cardExecBody.innerHTML = formatSectionHTML(parsedData["Executive Summary"]);
    cardInsightsBody.innerHTML = formatSectionHTML(parsedData["Key Insights"]);
    cardOppsBody.innerHTML = formatSectionHTML(parsedData["Opportunities"]);
    cardRisksBody.innerHTML = formatSectionHTML(parsedData["Risks"]);
    cardRecsBody.innerHTML = formatSectionHTML(parsedData["Recommendations"]);

    // Reveal output area
    outputSection.classList.remove('hidden');

    // Smooth scroll down to output findings
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ==========================================================================
  // 6. Form Submission / API Call Execution
  // ==========================================================================
  researchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const topic = topicInput.value.trim();
    const context = contextInput.value.trim();

    // Reset error console
    errorConsole.classList.add('hidden');

    // Validation checks
    if (!topic) {
      showError('Topic cannot be empty. Please specify a research topic.');
      return;
    }

    if (topic.length > 200) {
      showError('Research topic must be less than 200 characters.');
      return;
    }

    if (context.length > 1000) {
      showError('Additional context must be less than 1000 characters.');
      return;
    }

    // Set Loading state
    setLoadingState(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic, context })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      // Render the successfully generated report
      renderReport(data.report);
      showToast('Report generated successfully!');

    } catch (error) {
      console.error('Submission error:', error);
      showError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      // Release Loading state
      setLoadingState(false);
    }
  });

  const setLoadingState = (isLoading) => {
    if (isLoading) {
      generateBtn.disabled = true;
      btnSpinner.classList.remove('hidden');
      btnText.textContent = 'Generating...';
    } else {
      generateBtn.disabled = false;
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Generate Research Report';
    }
  };

  const showError = (message) => {
    errorMessage.textContent = message;
    errorConsole.classList.remove('hidden');
    errorConsole.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ==========================================================================
  // 7. Action Button Click Handlers (Copy, Download, Clear)
  // ==========================================================================

  // Copy entire report raw text to clipboard
  copyBtn.addEventListener('click', async () => {
    if (!currentReportText) return;

    try {
      await navigator.clipboard.writeText(currentReportText);
      showToast('Report copied to clipboard!');
    } catch (err) {
      // Fallback fallback text-area copy
      const dummy = document.createElement('textarea');
      document.body.appendChild(dummy);
      dummy.value = currentReportText;
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);
      showToast('Report copied to clipboard!');
    }
  });

  // Download entire report as .txt file
  downloadBtn.addEventListener('click', () => {
    if (!currentReportText) return;

    const topic = topicInput.value.trim() || 'Research_Report';
    const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
    const fileName = `research_report_${sanitizedTopic}.txt`;

    const blob = new Blob([currentReportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showToast('Report downloaded successfully!');
  });

  // Clear all forms, counters, and outputs
  clearBtn.addEventListener('click', () => {
    // Reset forms
    researchForm.reset();

    // Reset text area height
    contextInput.style.height = 'auto';

    // Reset character counters
    updateCharCounter(topicInput, topicCounter, 200);
    updateCharCounter(contextInput, contextCounter, 1000);

    // Hide output and console panels
    outputSection.classList.add('hidden');
    errorConsole.classList.add('hidden');

    // Reset global data state
    currentReportText = '';

    // Scroll window back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Form and report cleared');
  });
});
