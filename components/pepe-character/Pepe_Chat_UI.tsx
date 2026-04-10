'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Trophy } from 'lucide-react';
import { PepeTypewriter } from './Pepe_Chat_Typewriter';
import { ScratchToReveal } from '@/components/magicui/scratch-to-reveal';
import { ACHIEVEMENT_MAP } from '@/lib/achievements/definitions';
import { ACHIEVEMENT_TIERS } from '@/lib/types/achievements';
import { achievementService } from '@/lib/services/achievement-service';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isTyping: boolean;
  typingDuration?: number;
  isUser?: boolean;
  messageType?: 'greeting' | 'funny' | 'staying_power' | 'trading_advice' | 'red_flag' | 'regular' | 'achievement_scratch';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  achievementData?: {
    achievementId: string;
    achievementName: string;
    imagePath?: string;
  };
}

interface PepeMessagesProps {
  className?: string;
  onMicToggle?: (enabled: boolean) => void;
  initialMicEnabled?: boolean;
  maxMessages?: number;
}

export interface PepeMessagesRef {
  addMessage: (text: string, options?: {
    duration?: number;
    isUser?: boolean;
    messageType?: Message['messageType'];
    priority?: Message['priority'];
    achievementData?: Message['achievementData'];
  }) => void;
  clearMessages: () => void;
  addSequentialMessages: (messages: Array<{
    text: string;
    messageType: Message['messageType'];
    delay?: number;
    achievementData?: Message['achievementData'];
  }>) => void;
}

export const PepeMessages = forwardRef<PepeMessagesRef, PepeMessagesProps>(({ 
  className,
  onMicToggle,
  initialMicEnabled = true,
  maxMessages = 10
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [micEnabled, setMicEnabled] = useState(initialMicEnabled);
  const [messageQueue, setMessageQueue] = useState<Array<{
    text: string;
    messageType: Message['messageType'];
    delay?: number;
    achievementData?: Message['achievementData'];
  }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [revealedAchievements, setRevealedAchievements] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMicToggle = () => {
    const newState = !micEnabled;
    setMicEnabled(newState);
    onMicToggle?.(newState);
  };

  const addMessage = useCallback((text: string, options: {
    duration?: number;
    isUser?: boolean;
    messageType?: Message['messageType'];
    priority?: Message['priority'];
    achievementData?: Message['achievementData'];
  } = {}) => {
    const { duration, isUser = false, messageType = 'regular', priority = 'medium', achievementData } = options;
    
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      timestamp: new Date(),
      isTyping: !isUser,
      typingDuration: duration || Math.max(2000, text.length * 50),
      isUser,
      messageType,
      priority,
      achievementData
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      if (updated.length > maxMessages) {
        return updated.slice(-maxMessages);
      }
      return updated;
    });

    
    if (!isUser) {
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, isTyping: false } : msg
          )
        );
      }, newMessage.typingDuration);
    }
  }, [maxMessages]);

  
  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true);
      
      const processQueue = async () => {
        for (const queuedMessage of messageQueue) {
          
          addMessage(queuedMessage.text, { 
            messageType: queuedMessage.messageType,
            achievementData: queuedMessage.achievementData
          });
          
          
          const delay = queuedMessage.delay || Math.max(2000, queuedMessage.text.length * 50) + 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        
        setMessageQueue([]);
        setIsProcessingQueue(false);
      };
      
      processQueue();
    }
  }, [messageQueue, isProcessingQueue, addMessage]);

  const addSequentialMessages = (messages: Array<{
    text: string;
    messageType: Message['messageType'];
    delay?: number;
    achievementData?: Message['achievementData'];
  }>) => {
    setMessageQueue(prev => [...prev, ...messages]);
  };

  const clearMessages = () => {
    setMessages([]);
    setRevealedAchievements(new Set());
  };

  const handleAchievementScratchComplete = (messageId: string, achievementId: string, achievementName: string) => {
    setRevealedAchievements(prev => new Set([...prev, messageId]));
    
    
    setTimeout(() => {
      achievementService.triggerFullScreenCelebration(achievementId, achievementName);
    }, 500);
  };

  
  useImperativeHandle(ref, () => ({
    addMessage,
    clearMessages,
    addSequentialMessages
  }), [addMessage]);

  return (
    <div className={cn("flex flex-col h-full bg-neutral-950", className)}>
      <div className="p-4 flex flex-col h-full">
        {}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐸</span>
            <div>
              <div className="text-md font-medium text-white">Pepe</div>
              <div className="text-sm text-neutral-500">Trading Companion</div>
            </div>
          </div>
          <button
            onClick={handleMicToggle}
            className={cn(
              "p-2 rounded-full transition-all",
              micEnabled 
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
            title={micEnabled ? "Voice enabled" : "Voice disabled"}
          >
            {micEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
        </div>

        {}
        <div className="flex-1 flex flex-col space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent pb-4">
          {}
          {messages.length === 0 && (
            <div className="mr-auto px-4 py-2 text-white bg-neutral-700 rounded-2xl rounded-bl-sm max-w-[85%]">
              <span className="text-md">Hey! Ready to talk tokens? 🐸</span>
            </div>
          )}

          {}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "max-w-[85%]",
                message.isUser ? "ml-auto" : "mr-auto"
              )}
            >
              <div className={cn(
                "px-4 py-2 rounded-2xl",
                message.isUser 
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : cn(
                      "text-white rounded-bl-sm",
                      
                      message.messageType === 'greeting' && "bg-neutral-700",
                      message.messageType === 'funny' && "bg-amber-600/80 border border-amber-500/50",
                      message.messageType === 'staying_power' && "bg-blue-600/80 border border-blue-500/50",
                      message.messageType === 'trading_advice' && "bg-orange-600/80 border border-orange-500/50",
                      message.messageType === 'red_flag' && "bg-red-600/80 border border-red-500/50",
                      message.messageType === 'achievement_scratch' && "bg-gradient-to-r from-purple-600/80 to-yellow-600/80 border border-yellow-500/50",
                      message.messageType === 'regular' && "bg-neutral-700",
                      !message.messageType && "bg-neutral-700"
                    )
              )}>
                {message.messageType === 'achievement_scratch' && message.achievementData ? (
                  
                  <div className="flex flex-col gap-3">
                    {}
                    {message.isTyping ? (
                      <PepeTypewriter
                        text={message.text}
                        duration={message.typingDuration || 3000}
                        onComplete={() => {
                          
                        }}
                      />
                    ) : (
                      <span className="text-md whitespace-pre-wrap break-words">
                        {message.text}
                      </span>
                    )}
                    {}
                    <div className="w-full aspect-square">
                      <ScratchToReveal
                        width={240}
                        height={240}
                        minScratchPercentage={30}
                        onComplete={() => handleAchievementScratchComplete(
                          message.id, 
                          message.achievementData!.achievementId, 
                          message.achievementData!.achievementName
                        )}
                        className="rounded-lg overflow-hidden"
                        gradientColors={['#A97CF8', '#F38CB8', '#FDCC92']}
                      >
                        {}
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-900/90 to-purple-900/90 rounded-lg p-2">
                          {message.achievementData.imagePath ? (
                            <Image
                              src={message.achievementData.imagePath}
                              alt={message.achievementData.achievementName}
                              fill
                              sizes="240px"
                              className="object-contain rounded-lg"
                            />
                          ) : (
                            
                            <div className="text-6xl">🏆</div>
                          )}
                        </div>
                      </ScratchToReveal>
                    </div>
                  </div>
                ) : message.isTyping && !message.isUser ? (
                  <PepeTypewriter
                    text={message.text}
                    duration={message.typingDuration || 3000}
                    onComplete={() => {
                      
                    }}
                  />
                ) : (
                  <span className="text-md whitespace-pre-wrap break-words">
                    {message.text}
                  </span>
                )}
              </div>
              {}
              <div className={cn(
                "mt-1 text-sm text-neutral-500",
                message.isUser ? "text-right" : "text-left"
              )}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </motion.div>
          ))}
          
          <div ref={messagesEndRef} />

        </div>


        {}
        {messages.some(m => m.isTyping) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-neutral-400 flex items-center gap-1"
          >
            <span>Pepe is typing</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              ...
            </motion.span>
          </motion.div>
        )}
      </div>
    </div>
  );
});

PepeMessages.displayName = 'Pepe_Chat_UI';