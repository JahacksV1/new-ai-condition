import { diffLines } from 'diff';

export default function handler(req, res) {
  const originalText = "This is a test.\nIt has multiple lines.\nSome will be changed.\nOthers will stay the same.";
  const newText = "This is a test.\nIt has multiple lines that were edited.\nSome will be changed.\nThis is a new line.\nOthers will stay the same.";
  
  // Test diffLines function
  try {
    const diffResult = diffLines(originalText, newText);
    
    // Format the results
    const formattedDiff = diffResult.map(part => ({
      added: part.added || false,
      removed: part.removed || false,
      value: part.value
    }));
    
    return res.status(200).json({
      success: true,
      diffResult: formattedDiff
    });
  } catch (error) {
    console.error('Diff error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 