import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.tsx';
import { MessageCircle, X, Send, CheckCheck } from 'lucide-react';
const logoImage = '/taxsync-logo.png';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 'hours',
    question: 'Clinic Hours',
    answer: 'We are open Monday to Saturday, 8:00 AM - 6:00 PM. Closed on Sundays and public holidays.'
  },
  {
    id: 'services',
    question: 'Our Services',
    answer: 'We offer comprehensive dental services including: Teeth Cleaning, Dental Fillings, Root Canal Therapy, Teeth Whitening, Braces & Orthodontics, Dental Implants, and more!'
  },
  {
    id: 'pricing',
    question: 'Pricing & Payment',
    answer: 'Consultation fees start at ₱500. Treatment costs vary by procedure. We accept cash, credit/debit cards, and installment plans through our partner banks.'
  },
  {
    id: 'appointment',
    question: 'Book Appointment',
    answer: 'You can book an appointment through your patient portal, call us at +63 (02) 8123-4567, or visit our clinic directly. Online booking is available 24/7!'
  },
  {
    id: 'location',
    question: 'Location & Contact',
    answer: '📍 123 Dental Street, Makati City, Metro Manila 1234\n📞 +63 (02) 8123-4567\n📧 info@aureliadental.com'
  },
  {
    id: 'emergency',
    question: 'Emergency Care',
    answer: 'For dental emergencies during clinic hours, call +63 (02) 8123-4567. After hours, please visit the nearest hospital emergency room.'
  }
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFAQClick = (faq: FAQ) => {
    // Add user question
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: faq.question,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages([userMessage]);
    setShowChat(true);
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Add bot answer after delay
    setTimeout(() => {
      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        text: faq.answer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Update user message status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'read' }
            : msg
        )
      );
    }, 1000);
  };

  const handleChatWithSupport = () => {
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      text: "Hello! I'm here to help. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setShowChat(true);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        text: "Thank you for your message! A member of our staff will respond shortly. In the meantime, feel free to explore our FAQ section for quick answers.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Update status
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, status: 'read' }
              : msg
          )
        );
      }, 500);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setShowChat(false);
      setMessages([]);
    }, 300);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl bg-[#007BFF] hover:bg-[#0056b3] z-50 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-[380px] h-[600px] shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col bg-white transition-all duration-300 animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#007BFF] to-[#0056b3] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img 
                  src={logoImage} 
                  alt="Aurelia Dental" 
                  className="w-10 h-10 rounded-full bg-white p-1"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">Aurelia Dental Clinic</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white/90">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!showChat ? (
              /* FAQ View */
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Welcome Message */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-[#007BFF]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Welcome! 👋</h3>
                  <p className="text-sm text-gray-600">
                    How can we help you today? Choose a topic below or chat with our support team.
                  </p>
                </div>

                {/* FAQ Pills */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Frequent Questions
                  </p>
                  <div className="space-y-2">
                    {faqs.map(faq => (
                      <button
                        key={faq.id}
                        onClick={() => handleFAQClick(faq)}
                        className="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 text-left transition-all duration-200 group"
                      >
                        <p className="text-sm font-medium text-gray-900 group-hover:text-[#007BFF]">
                          {faq.question}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat with Support Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleChatWithSupport}
                    className="w-full bg-[#007BFF] hover:bg-[#0056b3] text-white rounded-xl p-4 transition-colors duration-200 font-medium"
                  >
                    💬 Chat with Support
                  </button>
                </div>
              </div>
            ) : (
              /* Chat View */
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[75%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {message.sender === 'bot' && (
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarImage src={logoImage} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              AD
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.sender === 'user'
                                ? 'bg-[#007BFF] text-white rounded-br-sm'
                                : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-line">{message.text}</p>
                          </div>
                          
                          <div className={`flex items-center space-x-1 mt-1 px-1 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.sender === 'user' && message.status && (
                              <CheckCheck 
                                className={`w-3 h-3 ${
                                  message.status === 'read' 
                                    ? 'text-blue-500' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-end space-x-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={logoImage} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            AD
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                {messages.length > 0 && !isTyping && (
                  <div className="px-4 py-2 bg-white border-t border-gray-200">
                    <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                      {faqs.slice(0, 3).map(faq => (
                        <button
                          key={faq.id}
                          onClick={() => handleFAQClick(faq)}
                          className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors"
                        >
                          {faq.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={inputValue}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                      onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 border-gray-300 rounded-full px-4 focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="rounded-full w-10 h-10 p-0 bg-[#007BFF] hover:bg-[#0056b3] disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
