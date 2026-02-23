// Netlify function to submit feedback to Google Sheets
exports.handler = async function(event, context) {
  // Your Google Sheet URL for feedback (you'll need to create a second sheet or tab)
  // For now, we'll just log it. You can add a Google Apps Script webhook here.
  const FEEDBACK_WEBHOOK = process.env.FEEDBACK_WEBHOOK_URL || '';
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }
  
  try {
    const feedback = JSON.parse(event.body);
    
    // Send to Google Apps Script webhook
    if (FEEDBACK_WEBHOOK) {
      await fetch(FEEDBACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://naastoday.com',
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Feedback received'
      })
    };
  } catch (error) {
    console.error('Error processing feedback:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process feedback'
      })
    };
  }
};
