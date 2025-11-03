// Google Calendar API Configuration Template
// INSTRUCTIONS:
// 1. Copy this file and rename it to 'config.js' (without .example)
// 2. Replace the placeholder values with your actual API keys from Google Cloud Console
// 3. NEVER commit the config.js file to GitHub

const API_CONFIG = {
    // Get your API Key from: https://console.cloud.google.com/apis/credentials
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    
    // Get your Client ID from: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com'
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
}
