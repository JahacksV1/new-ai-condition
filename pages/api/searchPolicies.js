import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platformName } = req.body;
    
    if (!platformName) {
      return res.status(400).json({ error: 'Platform name is required' });
    }

    // Search for policy documents
    const searchResults = await searchPlatformPolicies(platformName);
    
    if (searchResults.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No policy documents found',
        fallbackText: generateFallbackText(platformName)
      });
    }

    // Extract content from search results (up to 3 URLs)
    const extractedContent = await Promise.all(
      searchResults.slice(0, 3).map(url => extractContentFromUrl(url))
    );

    // Filter out failed extractions
    const validContent = extractedContent.filter(item => item && item.content);

    if (validContent.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Could not extract content from any of the URLs',
        fallbackText: generateFallbackText(platformName)
      });
    }

    // Analyze and structure the extracted content
    const structuredPolicy = await analyzePolicyContent(platformName, validContent);

    return res.status(200).json({
      success: true,
      policyData: structuredPolicy,
      sourceUrls: validContent.map(item => item.url)
    });

  } catch (error) {
    console.error('[API] Error searching policies:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to search and analyze policies',
      fallbackText: 'Error occurred while analyzing policies. Please edit this template manually with relevant policy information.'
    });
  }
}

// Function to search for platform policies
async function searchPlatformPolicies(platformName) {
  try {
    // Use web search API to find relevant policies
    const searchQueries = [
      `${platformName} terms of service official site`,
      `${platformName} user agreement arbitration clause`,
      `${platformName} dispute resolution policy`,
    ];
    
    // For this implementation, we'll use a simulated search function
    // In a production environment, you would replace this with a real web search API (e.g., Bing, Google)
    const searchResults = await simulatedWebSearch(searchQueries);
    return searchResults;
  } catch (error) {
    console.error('Error searching for policies:', error);
    return [];
  }
}

// Simulated web search function (replace with actual search API in production)
async function simulatedWebSearch(queries) {
  // This is a placeholder - in a real implementation, you would call an actual search API
  // For demo purposes, we'll return some dummy URLs based on the queries
  const platformName = queries[0].split(' ')[0].toLowerCase();
  
  const possibleUrls = {
    paypal: [
      'https://www.paypal.com/us/webapps/mpp/ua/useragreement-full',
      'https://www.paypal.com/us/webapps/mpp/ua/legalhub-full',
      'https://www.paypal.com/us/webapps/mpp/ua/disputes-full'
    ],
    binance: [
      'https://www.binance.com/en/terms',
      'https://www.binance.com/en/support/articles/360015700832-Binance-Terms-of-Use',
      'https://www.binance.com/en/support/faq/arbitration-and-dispute-resolution'
    ],
    coinbase: [
      'https://www.coinbase.com/legal/user_agreement',
      'https://www.coinbase.com/legal/arbitration-agreement',
      'https://www.coinbase.com/legal/dispute-resolution'
    ],
    default: [
      `https://www.${platformName}.com/terms`,
      `https://www.${platformName}.com/terms-of-service`,
      `https://www.${platformName}.com/legal`
    ]
  };
  
  // Return URLs based on the detected platform, or default URLs if not found
  const urls = possibleUrls[platformName] || possibleUrls.default;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return urls;
}

// Function to extract content from a URL
async function extractContentFromUrl(url) {
  try {
    // In a real implementation, you would fetch the actual web page and parse its content
    // For this example, we'll simulate the extraction
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract platform name from URL for simulation
    const urlParts = url.split('/');
    const domain = urlParts[2];
    const platformName = domain.split('.')[1];
    
    // Generate simulated content
    const content = simulateContentExtraction(url, platformName);
    
    return {
      url,
      content,
      title: `${platformName.charAt(0).toUpperCase() + platformName.slice(1)} ${url.includes('arbitration') ? 'Arbitration Policy' : 'Terms of Service'}`
    };
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    return null;
  }
}

// Simulate content extraction (replace with actual HTML parsing in production)
function simulateContentExtraction(url, platformName) {
  // This would be replaced with actual web scraping in a production environment
  // Check URL path to determine what kind of content to simulate
  if (url.includes('arbitration') || url.includes('dispute')) {
    return `
    ARBITRATION AGREEMENT FOR ${platformName.toUpperCase()}
    
    You and ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} agree that any dispute, claim or controversy arising out of
    or relating to these Terms or the breach, termination, enforcement, interpretation,
    or validity thereof or the use of the Services (collectively, "Disputes") will be
    settled by binding arbitration, except that each party retains the right to bring
    an individual action in small claims court and the right to seek injunctive or other
    equitable relief in a court of competent jurisdiction to prevent the actual or
    threatened infringement, misappropriation, or violation of a party's copyrights,
    trademarks, trade secrets, patents, or other intellectual property rights.
    
    The arbitration will be conducted in accordance with the Commercial Arbitration Rules
    and the Supplementary Procedures for Consumer Related Disputes of the American
    Arbitration Association ("AAA") then in effect, except as modified by these Terms.
    
    The arbitration will be conducted by a single, neutral arbitrator. If the Dispute is
    for $10,000 or less, the arbitration will be conducted solely on the basis of documents
    submitted to the arbitrator, unless you request a hearing or the arbitrator determines
    that a hearing is necessary. If the Dispute is for more than $10,000, your right to a
    hearing will be determined by the AAA Rules.
    
    YOU AND ${platformName.toUpperCase()} HEREBY WAIVE ANY RIGHTS TO LITIGATE CLAIMS IN A COURT
    OR TO PARTICIPATE IN A CLASS ACTION OR REPRESENTATIVE ACTION WITH RESPECT TO ANY CLAIMS
    SUBJECT TO ARBITRATION. YOU ACKNOWLEDGE THAT YOU MAY NOT OBTAIN THE SAME REMEDIES AS
    IN COURT.
    `;
  } 
  
  if (url.includes('terms') || url.includes('agreement')) {
    return `
    TERMS OF SERVICE FOR ${platformName.toUpperCase()}
    
    1. ACCOUNT CREATION AND USAGE
    
    1.1 Eligibility. To be eligible to use the ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} Services, you must be at least 18 years old.
    
    1.2 Account Registration. You may need to register for a ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} account to access Services. When you register,
    you will be required to provide accurate personal information and you agree to update this information should it change.
    
    1.3 Account Security. You are responsible for maintaining the confidentiality of your account credentials
    and for all activities that occur under your account. You agree to notify ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} immediately of any
    unauthorized use of your account.
    
    2. ACCOUNT SUSPENSION AND TERMINATION
    
    2.1 We may suspend or terminate your access to the Services if:
       (a) you violate these Terms;
       (b) we are required to do so by law or by any regulatory authority;
       (c) we suspect fraud, money laundering, or other illegal activity;
       (d) we suspect any other misuse of your account; or
       (e) your identity verification processes are not completed.
    
    2.2 Account Freezing. ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} reserves the right to freeze your account and/or funds if:
       (a) we detect suspicious activity;
       (b) we are required to do so by law or court order;
       (c) you have violated these Terms;
       (d) your account is subject to pending litigation, investigation, or government proceeding.
    
    3. IDENTITY VERIFICATION
    
    3.1 ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} implements Know-Your-Customer (KYC) and Anti-Money Laundering (AML) procedures.
    You agree to provide all information requested for identity verification purposes.
    
    3.2 ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} reserves the right to refuse service, terminate accounts, or remove
    content if you fail to comply with applicable legal obligations or these Terms.
    `;
  }
  
  // Default content for other URLs
  return `
  GENERAL POLICIES FOR ${platformName.toUpperCase()}
  
  This document outlines the general policies governing the use of ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} services.
  
  A. WITHDRAWAL RESTRICTIONS
  
  ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} may, in its sole discretion, impose limits on withdrawals, including:
  - Daily, weekly, or monthly limits
  - Holding periods for deposits
  - Additional verification requirements for large withdrawals
  - Temporary suspension of withdrawals for security or compliance reasons
  
  B. DISPUTE RESOLUTION
  
  In the event of any dispute between you and ${platformName.charAt(0).toUpperCase() + platformName.slice(1)}, we encourage you to first
  contact our customer support team. If the issue cannot be resolved through customer support,
  please refer to our full Arbitration Agreement for further steps.
  
  C. PRIVACY AND DATA USAGE
  
  ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} collects and processes personal information as described in our Privacy Policy.
  We implement appropriate security measures to protect your personal information.
  `;
}

// Function to analyze policy content using OpenAI
async function analyzePolicyContent(platformName, extractedContent) {
  try {
    // Combine all extracted content for analysis
    const combinedContent = extractedContent.map(item => 
      `SOURCE: ${item.title}\n\n${item.content}`
    ).join('\n\n' + '-'.repeat(50) + '\n\n');
    
    // Use OpenAI to analyze and structure the content
    const prompt = `
You are analyzing the Terms of Service and policies for ${platformName}. Below are excerpts from their official documents.

Your task is to extract and organize the following information:

1. RELEVANT POLICIES: Extract all policies relevant to account freezing, ID verification, fund withdrawal restrictions, and user rights.

2. ARBITRATION POLICIES: Extract all clauses related to arbitration, dispute resolution, and legal proceedings.

Format your response in Markdown with clear section headers and bullet points. Include exact quotes where possible, with section numbers if available.

CONTENT TO ANALYZE:
${combinedContent}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a legal document analyzer that extracts and structures policy information.' },
        { role: 'user', content: prompt }
      ]
    });
    
    const structuredAnalysis = completion.choices[0].message.content.trim();
    
    // Add source links section
    const sourceLinks = extractedContent.map(item => item.url);
    const sourcesSection = `
## SOURCE LINKS

${sourceLinks.map(url => `- [${url}](${url})`).join('\n')}
`;
    
    return structuredAnalysis + '\n\n' + sourcesSection;
  } catch (error) {
    console.error('Error analyzing policy content with OpenAI:', error);
    return generateFallbackText(platformName, extractedContent.map(item => item.url));
  }
}

// Generate fallback text when analysis fails
function generateFallbackText(platformName, urls = []) {
  const sourceSection = urls.length > 0 
    ? `\n\n## SOURCE LINKS\n\n${urls.map(url => `- [${url}](${url})`).join('\n')}`
    : '';
  
  return `
# ${platformName} Policy Analysis

## RELEVANT POLICIES

- **Account Restrictions**: ${platformName} may restrict account access under certain conditions.
- **Identity Verification**: Users must comply with verification procedures.
- **Withdrawal Limitations**: Withdrawals may be subject to limits or holds.
- **Security Measures**: Additional security measures may be implemented at ${platformName}'s discretion.

## ARBITRATION POLICIES

- **Dispute Resolution**: Disputes between users and ${platformName} may be subject to arbitration.
- **Legal Proceedings**: Users may have limitations on bringing legal actions against ${platformName}.
- **Class Action Waiver**: There may be restrictions on participating in class actions.

*Note: This is a template. Please edit this content with actual policy information from ${platformName}.*
${sourceSection}
`;
} 