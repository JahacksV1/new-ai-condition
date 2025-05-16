import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse as parseUrl } from 'url';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SERP_API_KEY = process.env.SERP_API_KEY || 'YOUR_SERP_API_KEY'; // Set this in your .env file

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platformName, customPrompt } = req.body;
    
    if (!platformName) {
      return res.status(400).json({ error: 'Platform name is required' });
    }

    // Detect the company's official domain
    const officialDomain = await detectOfficialDomain(platformName);
    
    // Generate search queries
    const queries = generateSearchQueries(platformName, officialDomain, customPrompt);
    
    // Search for policy documents using the detected domain if possible
    const searchResults = await searchPlatformPolicies(queries, officialDomain);
    
    if (searchResults.length === 0) {
      console.log(`[API] No search results found for ${platformName}`);
      return res.status(200).json({
        success: false,
        message: 'No policy documents found',
        fallbackText: generateFallbackText(platformName)
      });
    }

    // Log the search results
    console.log(`[API] Found ${searchResults.length} search results for ${platformName}:`, 
      searchResults.map(url => url.substring(0, 100) + (url.length > 100 ? '...' : '')));

    // Extract content from search results (up to 3 URLs)
    const extractedContent = await Promise.all(
      searchResults.slice(0, 3).map(url => extractContentFromUrl(url, platformName))
    );

    // Filter out failed extractions
    const validContent = extractedContent.filter(item => item && item.content && item.content.length > 100);

    if (validContent.length === 0) {
      console.log(`[API] No valid content extracted for ${platformName}`);
      return res.status(200).json({
        success: false,
        message: 'Could not extract content from any of the URLs',
        fallbackText: generateFallbackText(platformName, searchResults)
      });
    }

    // Analyze and structure the extracted content
    const structuredPolicy = await analyzePolicyContent(platformName, validContent, customPrompt);

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

// Function to detect the official domain for a company
async function detectOfficialDomain(platformName) {
  try {
    const formattedName = platformName.toLowerCase().replace(/\s+/g, '');
    
    // Check common TLDs
    const possibleDomains = [
      `${formattedName}.com`,
      `${formattedName}.org`,
      `${formattedName}.net`,
      `${formattedName}.io`
    ];

    // For multi-word companies, also check with dash
    if (platformName.includes(' ')) {
      const dashedName = platformName.toLowerCase().replace(/\s+/g, '-');
      possibleDomains.push(`${dashedName}.com`);
    }

    // Use SerpAPI to find official domain
    const query = `${platformName} official website`;
    
    // If we have a SERP API key, use it to validate the domain
    if (SERP_API_KEY && SERP_API_KEY !== 'YOUR_SERP_API_KEY') {
      const searchResponse = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: SERP_API_KEY,
          num: 5
        }
      });
      
      const organicResults = searchResponse.data.organic_results || [];
      
      for (const result of organicResults) {
        if (result.link) {
          const urlObj = parseUrl(result.link);
          const hostname = urlObj.hostname;
          
          // Check if the hostname contains the company name
          if (hostname && hostname.includes(formattedName)) {
            return hostname;
          }
        }
      }
    }
    
    // If SERP API fails or no good result, use OpenAI to guess the domain
    const domainPrompt = `
What is the official website domain for ${platformName}?
Return only the domain name (e.g., "example.com") with no additional text or explanation.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You provide concise technical information about company domains.' },
        { role: 'user', content: domainPrompt }
      ],
      max_tokens: 20
    });
    
    const suggestedDomain = completion.choices[0].message.content.trim().toLowerCase();
    
    // Clean up any extra text to ensure we just have the domain
    const domainPattern = /([a-z0-9][a-z0-9-]*\.(?:com|org|net|io|app|co))/i;
    const match = suggestedDomain.match(domainPattern);
    
    return match ? match[0] : possibleDomains[0]; // Fallback to first possible domain if no match
  } catch (error) {
    console.error('Error detecting official domain:', error);
    // Fallback to basic domain name guessing if everything fails
    return `${platformName.toLowerCase().replace(/\s+/g, '')}.com`;
  }
}

// Generate search queries based on platform name and custom prompt
function generateSearchQueries(platformName, officialDomain, customPrompt) {
  const domainPart = officialDomain ? `site:${officialDomain}` : '';
  
  const defaultQueries = [
    `${domainPart} ${platformName} terms of service`,
    `${domainPart} ${platformName} user agreement`,
    `${domainPart} ${platformName} arbitration clause`,
    `${domainPart} ${platformName} dispute resolution`,
    `${domainPart} ${platformName} legal terms`,
  ];
  
  // If we have a custom prompt, add it as a query as well
  if (customPrompt) {
    defaultQueries.push(`${domainPart} ${platformName} ${customPrompt}`);
  }
  
  return defaultQueries;
}

// Function to search for platform policies using SerpAPI
async function searchPlatformPolicies(queries, officialDomain) {
  try {
    if (SERP_API_KEY && SERP_API_KEY !== 'YOUR_SERP_API_KEY') {
      // Use SerpAPI for real search results
      const searchPromises = queries.map(async (query) => {
        try {
          const response = await axios.get('https://serpapi.com/search', {
            params: {
              q: query,
              api_key: SERP_API_KEY,
              num: 3
            }
          });

          const organicResults = response.data.organic_results || [];
          return organicResults.map(result => result.link);
        } catch (error) {
          console.error(`Error searching with query "${query}":`, error);
          return [];
        }
      });

      // Collect all search results
      const searchResultsArrays = await Promise.all(searchPromises);
      let allSearchResults = searchResultsArrays.flat();
      
      // Filter for unique URLs
      allSearchResults = [...new Set(allSearchResults)];
      
      // Filter for URLs that belong to the official domain if specified
      if (officialDomain) {
        allSearchResults = allSearchResults.filter(url => {
          try {
            const urlObj = parseUrl(url);
            return urlObj.hostname.includes(officialDomain) || 
                   officialDomain.includes(urlObj.hostname);
          } catch (e) {
            return false;
          }
        });
      }
      
      // Filter for policy-like URLs
      const policyKeywords = ['terms', 'policy', 'legal', 'agreement', 'arbitration', 'dispute'];
      const policyUrls = allSearchResults.filter(url => 
        policyKeywords.some(keyword => url.toLowerCase().includes(keyword))
      );
      
      // Return policy URLs if found, otherwise return all search results
      return policyUrls.length > 0 ? policyUrls : allSearchResults;
    } else {
      // Fallback to simulated search
      console.warn('SERP_API_KEY not configured. Using simulated search results.');
      return simulateDomainBasedSearch(queries[0], officialDomain);
    }
  } catch (error) {
    console.error('Error searching for policies:', error);
    // Fallback to simulated search
    return simulateDomainBasedSearch(queries[0], officialDomain);
  }
}

// Simulate search results based on domain (for when API key is missing)
function simulateDomainBasedSearch(query, officialDomain) {
  const platformName = query.split(' ')[0].toLowerCase();
  const domain = officialDomain || `${platformName}.com`;
  
  // Generate plausible URLs based on the domain
  return [
    `https://${domain}/terms-of-service`,
    `https://${domain}/legal/user-agreement`,
    `https://${domain}/legal/terms`,
    `https://${domain}/legal/arbitration`
  ];
}

// Function to extract content from a URL using web scraping
async function extractContentFromUrl(url, platformName) {
  try {
    console.log(`[API] Attempting to extract content from: ${url}`);
    
    // Make HTTP request to the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);
    
    // Remove script tags, style tags, and hidden elements
    $('script, style, [style*="display:none"], [style*="display: none"], meta, link, noscript').remove();
    
    // Get page title
    const title = $('title').text().trim() || $('h1').first().text().trim() || `${platformName} Policy`;
    
    // Extract the main content
    // Prefer known content containers
    const contentSelectors = [
      'main', 'article', '.content', '.main-content', '.article', 
      '.terms', '.terms-of-service', '.policies', '.legal', 
      '#content', '#main-content', '#terms', '#legal'
    ];
    
    let content = '';
    
    // Try selectors first
    for (const selector of contentSelectors) {
      const selectedContent = $(selector).text();
      if (selectedContent && selectedContent.length > 500) {
        content = selectedContent;
        break;
      }
    }
    
    // If no content found with selectors, get all paragraphs
    if (!content || content.length < 500) {
      content = $('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
    }
    
    // If still no content, get the body text
    if (!content || content.length < 500) {
      content = $('body').text().trim()
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
        .slice(0, 20000);      // Limit to 20,000 characters
    }
    
    // Clean up the content
    content = content
      .replace(/\t/g, ' ')       // Replace tabs with spaces
      .replace(/\s{2,}/g, ' ')   // Replace multiple spaces with a single space
      .replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with double newlines
    
    // If the content is too short or too noisy, it's probably not useful
    if (content.length < 500 || content.length > 100000) {
      console.log(`[API] Content extraction failed or noisy for ${url}: length=${content.length}`);
      return null;
    }
    
    console.log(`[API] Successfully extracted ${content.length} characters from ${url}`);
    
    return {
      url,
      content,
      title
    };
  } catch (error) {
    console.error(`[API] Error extracting content from ${url}:`, error.message);
    return null;
  }
}

// Function to analyze policy content using OpenAI
async function analyzePolicyContent(platformName, extractedContent, customPrompt) {
  try {
    // Combine all extracted content for analysis
    const combinedContent = extractedContent.map(item => 
      `SOURCE: ${item.title}\nURL: ${item.url}\n\n${item.content.substring(0, 15000)}`
    ).join('\n\n' + '-'.repeat(50) + '\n\n');
    
    // Customize the system prompt based on any custom instructions
    let systemPrompt = 'You are a legal document analyzer that extracts and structures policy information.';
    
    if (customPrompt) {
      systemPrompt += ` ${customPrompt}`;
    }
    
    // Use OpenAI to analyze and structure the content
    const userPrompt = `
You are analyzing the Terms of Service and policies for ${platformName}. Below are excerpts from their official documents.

Your task is to extract and organize the following information:

1. RELEVANT POLICIES: Extract all policies relevant to account freezing, ID verification, fund withdrawal restrictions, and user rights. Format as a markdown section with the heading "## RELEVANT POLICIES".

2. ARBITRATION POLICIES: Extract all clauses related to arbitration, dispute resolution, and legal proceedings. Format as a markdown section with the heading "## ARBITRATION POLICIES".

Format your response using Markdown with clear section headers. Include exact quotes where possible, with section numbers if available.

DO NOT MAKE UP OR FABRICATE any policies. If you cannot find specific information on a topic, state "No specific information found about [topic]."

CONTENT TO ANALYZE:
${combinedContent}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
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
    console.error('[API] Error analyzing policy content with OpenAI:', error);
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