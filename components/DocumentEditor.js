// components/DocumentEditor.js

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
// Material UI components
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Avatar,
  IconButton
} from '@mui/material';
// Material UI icons
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  ChatBubble as ChatBubbleIcon,
  Article as ArticleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
// Firebase
import { doc as firestoreDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
// Diff library
import { diffLines } from 'diff';

// Utility function to parse diffs into individual change blocks
const createChangeBlocks = (originalText, newText) => {
  // Get diff results
  const diffResults = diffLines(originalText, newText);
  
  // Prepare arrays to track connected changes
  const blocks = [];
  let currentBlock = null;
  let contextBefore = '';
  let contextAfter = '';
  const contextLineCount = 2; // Number of unchanged lines to show for context
  
  // Process each diff part
  diffResults.forEach((part, index) => {
    if (part.added || part.removed) {
      // Start a new block if needed
      if (!currentBlock) {
        // Get context before (from previous unchanged part if exists)
        if (index > 0 && !diffResults[index-1].added && !diffResults[index-1].removed) {
          const prevLines = diffResults[index-1].value.split('\n');
          // Get up to contextLineCount lines before
          contextBefore = prevLines.slice(Math.max(0, prevLines.length - contextLineCount - 1)).join('\n');
        }
        
        currentBlock = {
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          contextBefore,
          removedLines: [],
          addedLines: [],
          contextAfter: ''
        };
      }
      
      // Add part to current block
      if (part.removed) {
        currentBlock.removedLines.push(part.value);
      } else if (part.added) {
        currentBlock.addedLines.push(part.value);
      }
      
      // If next part is unchanged, or this is the last part, finalize the block
      if (index === diffResults.length - 1 || 
          (index < diffResults.length - 1 && !diffResults[index+1].added && !diffResults[index+1].removed)) {
        // Get context after
        if (index < diffResults.length - 1) {
          const nextLines = diffResults[index+1].value.split('\n');
          // Get up to contextLineCount lines after
          contextAfter = nextLines.slice(0, Math.min(contextLineCount, nextLines.length)).join('\n');
          currentBlock.contextAfter = contextAfter;
        }
        
        // Add completed block
        blocks.push(currentBlock);
        currentBlock = null;
        contextBefore = '';
        contextAfter = '';
      }
    }
  });
  
  // If no blocks were created but there are differences, create a single block with the entire content
  if (blocks.length === 0 && diffResults.some(part => part.added || part.removed)) {
    blocks.push({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      contextBefore: '',
      removedLines: diffResults.filter(part => part.removed).map(part => part.value),
      addedLines: diffResults.filter(part => part.added).map(part => part.value),
      contextAfter: ''
    });
  }
  
  return blocks;
};

// The DiffChangeBlock component renders a single changed block
const DiffChangeBlock = ({ block, onAccept, onReject, isAccepted, isRejected }) => {
  return (
    <Box sx={{ 
      border: '1px solid #ddd', 
      borderRadius: 1, 
      mb: 2, 
      overflow: 'hidden',
      opacity: isRejected ? 0.6 : 1
    }}>
      {/* Context before */}
      {block.contextBefore && (
        <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          <Typography variant="body2" component="pre" sx={{ 
            m: 0, 
            color: '#666',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap'
          }}>
            {block.contextBefore}
          </Typography>
        </Box>
      )}
      
      {/* Diff content */}
      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        {/* Original content */}
        <Box sx={{ 
          flex: 1, 
          p: 1, 
          bgcolor: '#ffeeee', 
          borderRight: '1px solid #ddd',
          position: 'relative'
        }}>
          {block.removedLines.map((line, i) => (
            <Typography key={i} variant="body2" component="pre" sx={{ 
              m: 0, 
              textDecoration: 'line-through',
              color: '#b00000',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap'
            }}>
              {line}
            </Typography>
          ))}
        </Box>
        
        {/* New content */}
        <Box sx={{ 
          flex: 1, 
          p: 1, 
          bgcolor: '#eeffee',
          position: 'relative'
        }}>
          {block.addedLines.map((line, i) => (
            <Typography key={i} variant="body2" component="pre" sx={{ 
              m: 0, 
              color: '#006000',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap'
            }}>
              {line}
            </Typography>
          ))}
        </Box>
      </Box>
      
      {/* Context after */}
      {block.contextAfter && (
        <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderTop: '1px solid #ddd' }}>
          <Typography variant="body2" component="pre" sx={{ 
            m: 0, 
            color: '#666',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap'
          }}>
            {block.contextAfter}
          </Typography>
        </Box>
      )}
      
      {/* Action buttons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        p: 1, 
        bgcolor: '#f0f0f0',
        borderTop: '1px solid #ddd'
      }}>
        {isAccepted ? (
          <Chip
            icon={<CheckIcon />}
            label="Accepted"
            color="success"
            size="small"
          />
        ) : isRejected ? (
          <Chip
            icon={<CancelIcon />}
            label="Rejected"
            color="error"
            size="small"
          />
        ) : (
          <>
            <Button 
              startIcon={<CancelIcon />}
              size="small"
              color="error"
              variant="outlined"
              onClick={() => onReject(block.id)}
              sx={{ mr: 1 }}
            >
              Reject
            </Button>
            <Button 
              startIcon={<CheckIcon />}
              size="small"
              color="success"
              variant="contained"
              onClick={() => onAccept(block.id)}
            >
              Accept
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

// Utility function to show save feedback and clear it after a delay
const showSaveFeedback = (setSaveFeedback, type, message) => {
  setSaveFeedback({ type, message });
  setTimeout(() => setSaveFeedback(null), 3000);
};

export default function DocumentEditor({ document: propDoc }) {
  const router = useRouter();
  const { id: routeId } = router.query;
  const documentId = propDoc?.id || routeId;

  const [docData, setDocData] = useState(propDoc || null);
  const [isLoading, setIsLoading] = useState(!propDoc);
  const [content, setContent] = useState(propDoc?.generatedLetter || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Editor state for inline diff view
  const [showInlineDiff, setShowInlineDiff] = useState(false);
  const [inlineDiffMarkers, setInlineDiffMarkers] = useState({ additions: [], deletions: [] });
  const [currentEditOptions, setCurrentEditOptions] = useState(null);
  const [selectedEditOption, setSelectedEditOption] = useState(null);
  const [activeInlineEdit, setActiveInlineEdit] = useState(null);
  
  // State for chat-based UI
  const [chatHistory, setChatHistory] = useState([]);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for change blocks
  const [changeBlocks, setChangeBlocks] = useState([]);
  const [acceptedBlocks, setAcceptedBlocks] = useState(new Set());
  const [rejectedBlocks, setRejectedBlocks] = useState(new Set());
  
  // Refs
  const chatContainerRef = useRef(null);
  
  // Add a new state for save feedback
  const [saveFeedback, setSaveFeedback] = useState(null);
  
  // Auto-scroll to bottom of chat when history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Document loading logic - now with chat history
  useEffect(() => {
    const fetchOrGenerate = async () => {
      if (!documentId) return;
      if (propDoc) {
        setContent(propDoc.generatedLetter || '');
        setDocData(propDoc);
        
        // Load chat history if available
        if (propDoc.chatHistory && Array.isArray(propDoc.chatHistory)) {
          setChatHistory(propDoc.chatHistory);
        }
        
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const ref = firestoreDoc(db, 'documents', documentId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setContent('⚠️ Document not found');
          setDocData(null);
          return;
        }
        const data = snap.data();

        if (!data.generatedLetter && data.formData) {
          const res = await fetch('/api/generateDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Generation failed');
          data.generatedLetter = json.generatedLetter;
          await updateDoc(ref, { generatedLetter: data.generatedLetter, updatedAt: new Date().toISOString() });
        }
        
        // Load chat history if available
        if (data.chatHistory && Array.isArray(data.chatHistory)) {
          setChatHistory(data.chatHistory);
        }
        
        setDocData(data);
        setContent(data.generatedLetter || '');
      } catch (err) {
        console.error('Fetch/Generate error:', err);
        setContent(`Error: ${err.message}`);
        setDocData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrGenerate();
  }, [documentId, propDoc]);

  // Handle selecting an edit option
  const handleSelectEditOption = (optionId) => {
    if (!currentEditOptions) return;
    
    const selectedOption = currentEditOptions.options.find(option => option.id === optionId);
    if (!selectedOption) return;
    
    try {
      // Create change blocks for side-by-side diff
      const blocks = createChangeBlocks(content, selectedOption.editedText);
      setChangeBlocks(blocks);
      
      // Reset accepted/rejected blocks
      setAcceptedBlocks(new Set());
      setRejectedBlocks(new Set());
      
      // Store active edit for inline view
      setActiveInlineEdit({
        original: content,
        edited: selectedOption.editedText,
        title: selectedOption.title
      });
      
      // Show inline diff view
      setShowInlineDiff(true);
    } catch (error) {
      console.error("Error in handleSelectEditOption:", error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        text: 'Error processing diff view: ' + error.message
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  // Apply the changes from the inline diff to the content
  const handleApplyInlineEdit = async () => {
    if (!activeInlineEdit) return;
    
    // Update content with the edited text
    setContent(activeInlineEdit.edited);
    
    // Reset inline diff state
    setShowInlineDiff(false);
    setActiveInlineEdit(null);
    setChangeBlocks([]);
    setAcceptedBlocks(new Set());
    setRejectedBlocks(new Set());
    
    // Add confirmation to chat history
    const confirmationMessage = {
      id: Date.now(),
      type: 'user_acceptance',
      text: 'Applied changes to document.',
      timestamp: new Date().toISOString()
    };
    const updatedChatHistory = [...chatHistory, confirmationMessage];
    setChatHistory(updatedChatHistory);
    
    // Save chat history and document content to Firestore
    if (documentId) {
      try {
        const docRef = firestoreDoc(db, 'documents', documentId);
        await updateDoc(docRef, {
          chatHistory: updatedChatHistory,
          generatedLetter: activeInlineEdit.edited,
          updatedAt: new Date()
        });
        console.log('Changes applied and saved to Firestore successfully');
        
        // Show save feedback
        showSaveFeedback(setSaveFeedback, 'success', 'All changes saved');
      } catch (error) {
        console.error('Error saving applied changes:', error);
        showSaveFeedback(setSaveFeedback, 'error', 'Failed to save changes');
      }
    }
  };

  // Discard changes from the inline diff
  const handleDiscardInlineEdit = async () => {
    // Reset inline diff state
    setShowInlineDiff(false);
    setActiveInlineEdit(null);
    setChangeBlocks([]);
    setAcceptedBlocks(new Set());
    setRejectedBlocks(new Set());
    
    // Add rejection to chat
    const rejectionMessage = {
      id: Date.now(),
      type: 'ai_rejection',
      text: 'Changes were discarded.',
      timestamp: new Date().toISOString()
    };
    const updatedChatHistory = [...chatHistory, rejectionMessage];
    setChatHistory(updatedChatHistory);
    
    // Save chat history to Firestore
    if (documentId) {
      try {
        const docRef = firestoreDoc(db, 'documents', documentId);
        await updateDoc(docRef, {
          chatHistory: updatedChatHistory,
          updatedAt: new Date()
        });
        console.log('Rejection saved to Firestore successfully');
        
        // Show save feedback
        showSaveFeedback(setSaveFeedback, 'success', 'Discarded all changes');
      } catch (error) {
        console.error('Error saving rejection:', error);
        showSaveFeedback(setSaveFeedback, 'error', 'Failed to record discarded changes');
      }
    }
  };
  
  // Apply a specific change block to the content
  const applyChangeBlockToContent = async (blockId) => {
    const block = changeBlocks.find(b => b.id === blockId);
    if (!block || !activeInlineEdit) return;
    
    // Get all blocks that should be applied (accepted blocks)
    const blocksToApply = changeBlocks.filter(b => 
      acceptedBlocks.has(b.id) || b.id === blockId
    );
    
    // Create a new document with all accepted changes
    let newContent = activeInlineEdit.original;
    blocksToApply.forEach(block => {
      // Simple replacement based on context
      if (block.contextBefore && block.contextAfter) {
        const replacementPattern = block.contextBefore + 
                                  block.removedLines.join('') + 
                                  block.contextAfter;
        const replacement = block.contextBefore + 
                           block.addedLines.join('') + 
                           block.contextAfter;
        newContent = newContent.replace(replacementPattern, replacement);
      }
    });
    
    // If we couldn't apply specific blocks, just use the full edit
    if (newContent === activeInlineEdit.original) {
      newContent = activeInlineEdit.edited;
    }
    
    // Update the content
    setContent(newContent);
    
    // Save changes to Firestore immediately
    if (documentId) {
      try {
        const docRef = firestoreDoc(db, 'documents', documentId);
        await updateDoc(docRef, {
          generatedLetter: newContent,
          updatedAt: new Date()
        });
        console.log('Individual block change saved to Firestore');
        
        // Show save feedback
        showSaveFeedback(setSaveFeedback, 'success', 'Change saved');
      } catch (error) {
        console.error('Error saving document content:', error);
        showSaveFeedback(setSaveFeedback, 'error', 'Failed to save change');
      }
    }
  };

  // Handle accepting a change block
  const handleAcceptChangeBlock = async (blockId) => {
    const newAccepted = new Set(acceptedBlocks);
    newAccepted.add(blockId);
    setAcceptedBlocks(newAccepted);
    
    // Remove from rejected if it was there
    const newRejected = new Set(rejectedBlocks);
    newRejected.delete(blockId);
    setRejectedBlocks(newRejected);
    
    // Apply this block to the content
    await applyChangeBlockToContent(blockId);
    
    // Save the specific acceptance to chat history
    const acceptMessage = {
      id: Date.now(),
      type: 'user_acceptance',
      text: `Accepted change block ${blockId.substring(0, 8)}`,
      timestamp: new Date().toISOString()
    };
    const updatedChatHistory = [...chatHistory, acceptMessage];
    setChatHistory(updatedChatHistory);
    
    // Save chat history to Firestore
    if (documentId) {
      try {
        const docRef = firestoreDoc(db, 'documents', documentId);
        await updateDoc(docRef, {
          chatHistory: updatedChatHistory,
          updatedAt: new Date()
        });
        console.log('Change acceptance saved to chat history');
        
        // Show save feedback
        showSaveFeedback(setSaveFeedback, 'success', 'Change accepted and saved');
      } catch (error) {
        console.error('Error saving change acceptance:', error);
        showSaveFeedback(setSaveFeedback, 'error', 'Failed to save acceptance');
      }
    }
  };
  
  // Reject an individual change block
  const handleRejectChangeBlock = async (blockId) => {
    const newRejected = new Set(rejectedBlocks);
    newRejected.add(blockId);
    setRejectedBlocks(newRejected);
    
    // Remove from accepted if it was there
    const newAccepted = new Set(acceptedBlocks);
    newAccepted.delete(blockId);
    setAcceptedBlocks(newAccepted);
    
    // Save the specific rejection to chat history
    const rejectMessage = {
      id: Date.now(),
      type: 'user_rejection',
      text: `Rejected change block ${blockId.substring(0, 8)}`,
      timestamp: new Date().toISOString()
    };
    const updatedChatHistory = [...chatHistory, rejectMessage];
    setChatHistory(updatedChatHistory);
    
    // Save chat history to Firestore
    if (documentId) {
      try {
        const docRef = firestoreDoc(db, 'documents', documentId);
        await updateDoc(docRef, {
          chatHistory: updatedChatHistory,
          updatedAt: new Date()
        });
        console.log('Change rejection saved to chat history');
        
        // Show save feedback
        showSaveFeedback(setSaveFeedback, 'success', 'Rejection saved');
      } catch (error) {
        console.error('Error saving change rejection:', error);
        showSaveFeedback(setSaveFeedback, 'error', 'Failed to save rejection');
      }
    }
  };
  
  // Handle sending AI instruction
  const handleSendInstruction = async () => {
    if (!aiInstruction.trim()) return;
    
    // Add user message to chat history
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: aiInstruction,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Clear instruction input
    setAiInstruction('');
    
    // Scroll to bottom of chat
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    }
    
    // Show loading state
    setIsProcessing(true);
    
    try {
      // Improved detection of targeted edits with expanded keywords
      const targetedKeywords = [
        'line', 'sentence', 'paragraph', 'section', 'specific', 
        'change this', 'modify this', 'fix this', 'correct this',
        'replace', 'update this part', 'edit this part', 'rewrite this',
        'first', 'second', 'third', 'fourth', 'last'
      ];
      
      // Check if instruction contains any targeted keywords
      const instructionLower = aiInstruction.toLowerCase();
      const isTargetedEdit = targetedKeywords.some(keyword => 
        instructionLower.includes(keyword)
      );
      
      // API call to get AI edits
      const response = await fetch('/api/editDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          instruction: userMessage.text,
          docType: docData?.type || 'letter',
          targetMode: isTargetedEdit ? 'targeted' : 'general'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }
      
      const data = await response.json();
      
      // Store AI response in chat history
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        text: data.explanation || 'Here are the suggested changes:',
        options: data.options,
        timestamp: new Date().toISOString()
      };
      const updatedChatHistory = [...chatHistory, userMessage, aiMessage];
      setChatHistory(updatedChatHistory);
      
      // Store edit options
      setCurrentEditOptions({
        id: aiMessage.id,
        options: data.options
      });
      
      // Save chat history to Firestore
      if (documentId) {
        try {
          const docRef = firestoreDoc(db, 'documents', documentId);
          await updateDoc(docRef, {
            chatHistory: updatedChatHistory,
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      }
      
      // Scroll to bottom of chat
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }, 100);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      
      // Show error message in chat
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        text: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle save and exit document
  const handleSaveAndExit = async () => {
    if (!documentId) {
      showSaveFeedback(setSaveFeedback, 'error', 'No document ID found');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Add save confirmation to chat
      const saveMessage = {
        id: Date.now(),
        type: 'system',
        text: 'Document saved successfully.',
        timestamp: new Date().toISOString()
      };
      const updatedChatHistory = [...chatHistory, saveMessage];
      
      const docRef = firestoreDoc(db, 'documents', documentId);
      
      // Use a synchronous function for the Firestore update
      await updateDoc(docRef, {
        generatedLetter: content,
        chatHistory: updatedChatHistory,
        updatedAt: new Date()
      });
      
      // Success handling
      console.log('Document saved successfully to Firestore');
      showSaveFeedback(setSaveFeedback, 'success', 'Document saved successfully');
      
      // Navigate back to admin page after a brief delay to ensure feedback is seen
      setTimeout(() => {
        router.push('/admin');
      }, 500);
    } catch (error) {
      console.error('Error saving document:', error);
      showSaveFeedback(setSaveFeedback, 'error', 'Failed to save document');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        text: 'Error saving document. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle close without saving
  const handleClose = () => {
    if (window.location.pathname === '/admin') {
      // If we're inside a dialog on the admin page, just close the dialog
      // This will trigger the parent component's onClose handler
      if (router.query.id) {
        // If we have a direct URL with ID, navigate to admin
        router.push('/admin');
      } else {
        // Otherwise we're in a dialog, let the Dialog's onClose handle it
        router.back();
      }
    } else {
      // Otherwise navigate to admin page
      router.push('/admin');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2}>
        {/* Document Editor - Left Side */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3, height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ flexShrink: 0 }}>
                Document Content
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Save feedback */}
                {saveFeedback && (
                  <Chip
                    icon={saveFeedback.type === 'success' ? <CheckIcon /> : <CancelIcon />}
                    label={saveFeedback.message}
                    color={saveFeedback.type === 'success' ? 'success' : 'error'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
                
                {/* Exit without saving button */}
                <IconButton 
                  color="error" 
                  onClick={handleClose}
                  sx={{ border: '1px solid', borderColor: 'error.main' }}
                >
                  <CloseIcon />
                </IconButton>
                
                {/* Save & Exit button */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAndExit}
                  disabled={isSaving}
                  size="large"
                >
                  {isSaving ? 'Saving...' : 'Save & Exit'}
                </Button>
              </Box>
            </Box>
            
            {/* Document editor with inline diff */}
            <Box sx={{ flex: 1, position: 'relative', overflowY: 'auto', minHeight: '500px' }}>
              {showInlineDiff && changeBlocks.length > 0 ? (
                <Box sx={{ position: 'relative', height: '100%' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    zIndex: 10, 
                    display: 'flex', 
                    gap: 1, 
                    p: 1,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    borderRadius: 1,
                    boxShadow: 1
                  }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={handleDiscardInlineEdit}
                    >
                      Discard
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={handleApplyInlineEdit}
                    >
                      Apply All
                    </Button>
                  </Box>
                  
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.5, p: 2 }}>
                    {/* Split the content by change blocks and render with inline diffs */}
                    {changeBlocks.map((block, blockIndex) => {
                      const isAccepted = acceptedBlocks.has(block.id);
                      const isRejected = rejectedBlocks.has(block.id);
                      
                      return (
                        <Box key={block.id} sx={{ mb: 3 }}>
                          {/* Context before the change */}
                          <Box component="pre" sx={{ 
                            whiteSpace: 'pre-wrap', 
                            m: 0,
                            color: 'text.primary'
                          }}>
                            {block.contextBefore}
                          </Box>
                          
                          {/* Diff section with actions */}
                          <Box sx={{ 
                            border: '1px solid',
                            borderColor: isAccepted ? 'success.main' : isRejected ? 'error.main' : 'divider',
                            borderRadius: 1,
                            my: 1,
                            position: 'relative',
                            bgcolor: isAccepted ? 'success.light' : isRejected ? 'error.light' : 'background.paper',
                            opacity: isRejected ? 0.7 : 1
                          }}>
                            {/* Removed content */}
                            {block.removedLines.length > 0 && (
                              <Box component="pre" sx={{ 
                                bgcolor: '#ffeeee',
                                p: 1,
                                m: 0,
                                textDecoration: 'line-through',
                                color: 'error.main',
                                whiteSpace: 'pre-wrap',
                                borderBottom: '1px dashed',
                                borderColor: 'divider'
                              }}>
                                {block.removedLines.join('')}
                              </Box>
                            )}
                            
                            {/* Added content */}
                            {block.addedLines.length > 0 && (
                              <Box component="pre" sx={{ 
                                bgcolor: '#eeffee',
                                p: 1,
                                m: 0,
                                color: 'success.main',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {block.addedLines.join('')}
                              </Box>
                            )}
                            
                            {/* Action buttons */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'flex-end', 
                              p: 0.5,
                              bgcolor: 'background.paper',
                              borderTop: '1px solid',
                              borderColor: 'divider'
                            }}>
                              {isAccepted ? (
                                <Chip
                                  icon={<CheckIcon />}
                                  label="Accepted"
                                  color="success"
                                  size="small"
                                />
                              ) : isRejected ? (
                                <Chip
                                  icon={<CancelIcon />}
                                  label="Rejected"
                                  color="error"
                                  size="small"
                                />
                              ) : (
                                <>
                                  <Button 
                                    startIcon={<CancelIcon />}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleRejectChangeBlock(block.id)}
                                    sx={{ mr: 1 }}
                                  >
                                    Reject
                                  </Button>
                                  <Button 
                                    startIcon={<CheckIcon />}
                                    size="small"
                                    color="success"
                                    variant="contained"
                                    onClick={() => handleAcceptChangeBlock(block.id)}
                                  >
                                    Accept
                                  </Button>
                                </>
                              )}
                            </Box>
                          </Box>
                          
                          {/* Context after the change */}
                          <Box component="pre" sx={{ 
                            whiteSpace: 'pre-wrap', 
                            m: 0,
                            color: 'text.primary'
                          }}>
                            {block.contextAfter}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  variant="outlined"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '100%',
                    },
                    '& .MuiInputBase-inputMultiline': {
                      height: '100% !important',
                      overflowY: 'auto !important',
                      padding: '16px',
                    },
                    height: '100%',
                  }}
                  InputProps={{
                    sx: {
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      lineHeight: 1.6,
                    }
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* AI Assistant - Right Side */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
            <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
              AI Assistant
            </Typography>

            {/* Chat History */}
            <Box 
              ref={chatContainerRef}
              sx={{ 
                flexGrow: 1,
                overflowY: 'auto',
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {chatHistory.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <ChatBubbleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body1">
                    Use the AI assistant to help you edit your document. Try prompts like:
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>• "Make this more formal"</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>• "Add a conclusion paragraph"</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>• "Fix grammar errors"</Typography>
                    <Typography variant="body2">• "Add Binance §9.3 citation"</Typography>
                  </Box>
                </Box>
              ) : (
                chatHistory.map(message => (
                  <Box 
                    key={message.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                    }}
                  >
                    {/* Message content */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: message.type === 'user' 
                          ? 'primary.main' 
                          : message.type === 'error'
                            ? '#ffebee'
                            : message.type === 'system'
                              ? '#e3f2fd'
                              : '#f5f5f5',
                        color: message.type === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1">{message.text}</Typography>
                      
                      {/* Edit options if available */}
                      {message.options && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Choose an edit style:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {message.options.map(option => (
                              <Chip
                                key={option.id}
                                label={option.title}
                                clickable
                                onClick={() => handleSelectEditOption(option.id)}
                                color="primary"
                                variant={selectedEditOption?.id === option.id ? "filled" : "outlined"}
                                sx={{ mb: 1 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                    
                    {/* User or AI indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mb: 1 }}>
                      {message.type !== 'user' && (
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          <ArticleIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : message.type === 'system' ? 'System' : 'AI Assistant'}
                      </Typography>
                      {message.type === 'user' && (
                        <Avatar sx={{ width: 24, height: 24, ml: 1, bgcolor: 'grey.400' }}>
                          <Typography variant="caption">You</Typography>
                        </Avatar>
                      )}
                    </Box>
                  </Box>
                ))
              )}
              
              {isProcessing && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
            
            {/* AI Instruction Input */}
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask the AI assistant to edit your document..."
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                disabled={isProcessing}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendInstruction()}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleSendInstruction}
                disabled={!aiInstruction.trim() || isProcessing}
              >
                {isProcessing ? <CircularProgress size={24} /> : 'Send'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
