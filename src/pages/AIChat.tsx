import React, { useState, useEffect } from 'react';
import { MessageCircle, Mic, MicOff, Send, Upload, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  message: string;
  timestamp: string;
}

interface BookContext {
  id: string;
  title: string;
  author: string | null;
  excerpt?: string;
}

interface Conversation {
  id: string;
  title: string;
  book_id: string | null;
  last_message_preview: string | null;
  updated_at: string;
}

export const AIChat = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const bookId = searchParams.get('bookId');
  const conversationId = searchParams.get('conversationId');
  
  const [message, setMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId);
  const [effectiveBookId, setEffectiveBookId] = useState<string | null>(bookId);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // Track if new conversation mode is active (bypass auto-loading)
  const [isNewConversationMode, setIsNewConversationMode] = useState(false);

  // Fetch the last read book when no bookId is provided
  const { data: lastReadBook } = useQuery({
    queryKey: ['last-read-book', user?.id],
    queryFn: async () => {
      if (!user?.id || bookId || isNewConversationMode) return null; // Skip if in new conversation mode
      
      try {
        const { data, error } = await supabase
          .from('book_progress')
          .select(`
            book_id,
            last_read_at,
            books!inner(id, title, author)
          `)
          .eq('user_id', user.id)
          .order('last_read_at', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          return {
            id: data[0].books.id,
            title: data[0].books.title,
            author: data[0].books.author
          } as BookContext;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching last read book:', error);
        return null;
      }
    },
    enabled: !!user?.id && !bookId && !isNewConversationMode,
    retry: 1
  });

  // Update effective book ID when last read book is fetched
  useEffect(() => {
    if (!bookId && lastReadBook && !isNewConversationMode) {
      setEffectiveBookId(lastReadBook.id);
      
      // Update URL to include the last read book
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('bookId', lastReadBook.id);
      setSearchParams(newSearchParams);
    }
  }, [lastReadBook, bookId, searchParams, setSearchParams, isNewConversationMode]);

  // Fetch recent conversations - FIXED
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['recent-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // First, get the conversations
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('id, title, book_id, last_message_preview, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(10);
        
        if (conversationsError) {
          console.error('Conversations query error:', conversationsError);
          throw conversationsError;
        }

        // If no conversations, return empty array
        if (!conversationsData || conversationsData.length === 0) {
          return [];
        }

        // Get book titles for conversations that have book_id
        const conversationsWithBooks = await Promise.all(
          conversationsData.map(async (conversation) => {
            if (conversation.book_id) {
              try {
                const { data: bookData, error: bookError } = await supabase
                  .from('books')
                  .select('title')
                  .eq('id', conversation.book_id)
                  .single();
                
                if (bookError) {
                  console.warn(`Could not fetch book for conversation ${conversation.id}:`, bookError);
                }
                
                return {
                  ...conversation,
                  book_title: bookData?.title || null
                };
              } catch (error) {
                console.warn(`Error fetching book for conversation ${conversation.id}:`, error);
                return conversation;
              }
            }
            return conversation;
          })
        );

        return conversationsWithBooks as Conversation[];
      } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000
  });

  // Update current conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        setCurrentConversationId(conversation.id);
        
        // Update effective book ID from conversation's book_id
        if (conversation.book_id) {
          setEffectiveBookId(conversation.book_id);
        }
      }
    } else {
      setCurrentConversation(null);
    }
  }, [conversationId, conversations]);

  // Auto-load the most recent conversation for the selected book
  useEffect(() => {
    if (bookId && !conversationId && conversations.length > 0 && !currentConversationId) {
      // Find the most recent conversation for this book
      const bookConversation = conversations.find(conv => conv.book_id === bookId);
      if (bookConversation) {
        console.log('Auto-loading conversation for book:', bookConversation);
        setCurrentConversationId(bookConversation.id);
        setCurrentConversation(bookConversation);
        
        // Update URL to include the conversation ID
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('conversationId', bookConversation.id);
        setSearchParams(newSearchParams);
      }
    }
  }, [bookId, conversationId, conversations, currentConversationId, searchParams, setSearchParams]);

  // Fetch book details - Updated to use effectiveBookId or current conversation's book_id
  const { data: book } = useQuery({
    queryKey: ['book-details', effectiveBookId],
    queryFn: async () => {
      if (!effectiveBookId) return null;
      
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author')
        .eq('id', effectiveBookId)
        .single();
      
      if (error) throw error;
      return data as BookContext;
    },
    enabled: !!effectiveBookId
  });

  // Fetch extracted text for the book
  const { data: extractedText } = useQuery({
    queryKey: ['book-extracted-text', effectiveBookId],
    queryFn: async () => {
      if (!effectiveBookId) return null;
      
      // Try to get processed text first, then fall back to raw OCR text
      const { data: processedText } = await supabase
        .from('book_text_extractions')
        .select('extracted_text')
        .eq('book_id', effectiveBookId)
        .eq('extraction_method', 'processed')
        .maybeSingle();
        
      if (processedText?.extracted_text) {
        return processedText.extracted_text;
      }
      
      // Fall back to raw OCR text if processed text not available
      const { data: rawText } = await supabase
        .from('book_text_extractions')
        .select('extracted_text')
        .eq('book_id', effectiveBookId)
        .eq('extraction_method', 'ocr-tesseract')
        .maybeSingle();
        
      return rawText?.extracted_text || null;
    },
    enabled: !!effectiveBookId
  });

  // Determine if we should show the "no book selected" notification
  const showNoBookNotification = (!bookId && !lastReadBook && user?.id) || isNewConversationMode;

  // Fetch conversation messages if conversationId is provided - FIXED
  const { data: existingMessages } = useQuery({
    queryKey: ['conversation-messages', currentConversationId],
    queryFn: async () => {
      if (!currentConversationId || !user?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Chat messages query error:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          return [];
        }
        
        return data.map(msg => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' as const : 'bot' as const,
          message: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })) as ChatMessage[];
      } catch (error) {
        console.error('Error fetching conversation messages:', error);
        throw error;
      }
    },
    enabled: !!currentConversationId && !!user?.id,
    retry: 2,
    retryDelay: 1000
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, bookId }: { title: string; bookId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          book_id: bookId || null,
          title,
          last_message_preview: null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      setCurrentConversation(data);
      queryClient.invalidateQueries({ queryKey: ['recent-conversations'] });
    }
  });

  // Save message mutation
  const saveMessageMutation = useMutation({
    mutationFn: async ({ conversationId, role, content }: { conversationId: string; role: string; content: string }) => {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        });
      
      if (error) throw error;
      
      // Update conversation's last_message_preview and updated_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_preview: content.substring(0, 100),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (updateError) {
        console.warn('Could not update conversation preview:', updateError);
      }
    }
  });

  // Load existing conversation messages
  useEffect(() => {
    if (existingMessages && existingMessages.length > 0) {
      console.log('Loading existing messages for conversation:', currentConversationId, existingMessages);
      setChatMessages(existingMessages);
    } else if (currentConversationId && existingMessages && existingMessages.length === 0) {
      // If we have a conversation ID but no messages, it's a new or empty conversation
      console.log('Conversation exists but has no messages yet');
      setChatMessages([]);
    }
  }, [existingMessages, currentConversationId]);

  // Initialize chat with appropriate welcome message
  useEffect(() => {
    // Only show welcome message if we don't have a current conversation
    // and we haven't loaded any existing messages
    if (!currentConversationId && !existingMessages?.length) {
      if (book) {
        setChatMessages([{
          id: 'welcome-1',
          type: 'bot',
          message: `Hello! I'm your AI reading assistant. I see you're interested in discussing "${book.title}"${book.author ? ` by ${book.author}` : ''}. What would you like to know about this book?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else if (!bookId) {
        setChatMessages([{
          id: 'welcome-1',
          type: 'bot',
          message: 'Hello! I\'m your AI reading assistant. I can help you understand books, answer questions, and provide tutoring. Please select a book first, or ask me general reading-related questions.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }
  }, [book, bookId, currentConversationId, existingMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setIsLoading(true);
    
    try {
      // Create conversation if it doesn't exist
      let conversationToUse = currentConversationId;
      if (!conversationToUse) {
        const title = book ? `Chat about ${book.title}` : `General Chat - ${new Date().toLocaleDateString()}`;
        const newConversation = await createConversationMutation.mutateAsync({ 
          title, 
          bookId: book?.id 
        });
        conversationToUse = newConversation.id;
        
        // Update URL with conversation ID
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('conversationId', newConversation.id);
        setSearchParams(newSearchParams);
      }
      
      // Save user message
      await saveMessageMutation.mutateAsync({
        conversationId: conversationToUse,
        role: 'user',
        content: currentMessage
      });
      
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));
      
      const { data, error } = await supabase.functions.invoke('chat-with-book', {
        body: {
          message: currentMessage,
          bookContext: book ? {
            title: book.title,
            author: book.author,
            excerpt: extractedText || 'Book content not yet extracted'
          } : null,
          conversationHistory
        }
      });
      
      if (error) throw error;
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, botMessage]);
      
      // Save bot message
      await saveMessageMutation.mutateAsync({
        conversationId: conversationToUse,
        role: 'assistant',
        content: data.response
      });
      
      // Refresh conversations list
      refetchConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadConversation = (conversation: Conversation) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('conversationId', conversation.id);
    if (conversation.book_id) {
      newSearchParams.set('bookId', conversation.book_id);
      setEffectiveBookId(conversation.book_id); // Update effective book ID immediately
    }
    setSearchParams(newSearchParams);
    setCurrentConversationId(conversation.id);
    setCurrentConversation(conversation);
    setIsNewConversationMode(false); // Exit new conversation mode
  };

  const handleStartNewConversation = () => {
    // Reset all relevant states
    setCurrentConversationId(null);
    setCurrentConversation(null);
    setChatMessages([]);
    setEffectiveBookId(null);
    setIsNewConversationMode(true);
    
    // Completely clear URL parameters
    setSearchParams(new URLSearchParams());
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    setIsListening(false);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="space-y-4">
      {/* No Book Selected Notification */}
      {showNoBookNotification && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            No book selected and no recent reading history found. Please upload a book or select one from your library to start chatting.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col">
        <Card className="border-stone-200 flex-1 flex flex-col">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-stone-800 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-600" />
              AI Reading Assistant
              </div>
              <span className="text-lg">{book ? book.title : ""}</span>
              {isVoiceMode && (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Voice Mode
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[400px]">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-lg ${msg.type === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-3 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-stone-100 text-stone-800'
                    }`}>
                      <p className="whitespace-pre-line">{msg.message}</p>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 px-3">
                      {msg.timestamp}
                    </p>
                  </div>
                  
                  {msg.type === 'user' && (
                    <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-stone-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="max-w-lg">
                    <div className="p-3 rounded-lg bg-stone-100 text-stone-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="border-t border-stone-200 p-4 space-y-3">
              {isVoiceMode ? (
                <div className="flex items-center justify-center p-8">
                  <Button
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full ${
                      isListening 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask me anything about your books..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleSendMessage} disabled={!message.trim() || isLoading}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoiceMode}
                  className={isVoiceMode ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
                >
                  {isVoiceMode ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isVoiceMode ? 'Exit Voice Mode' : 'Voice Mode'}
                </Button>
                
                {isListening && (
                  <span className="text-sm text-red-600 font-medium">
                    Listening... Speak now
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.open('/uploads', '_blank')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Book for Chat
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleStartNewConversation}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start New Conversation
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Mic className="w-4 h-4 mr-2" />
              Voice Tutor Session
            </Button>
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversations.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">
                No conversations yet. Start chatting to see your history here!
              </p>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className="p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors"
                  onClick={() => handleLoadConversation(conversation)}
                >
                  <p className="text-sm font-medium text-stone-800 mb-1">
                    {conversation.title}
                  </p>
                  {conversation.last_message_preview && (
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {conversation.last_message_preview}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    {new Date(conversation.updated_at).toLocaleDateString()} at{' '}
                    {new Date(conversation.updated_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800">AI Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Ask questions about any book in your library</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Get summaries and explanations</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Voice conversations and tutoring</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Upload new books for instant analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
};