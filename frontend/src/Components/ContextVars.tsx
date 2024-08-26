// MessageContext.tsx
import { createContext } from 'react';

interface Message {
  id: number;
  content: string;
  role: string;
}

interface MessageContextType {
  messages: Message[];
  isLoading: boolean;
}

const defaultMessageContext: MessageContextType = {
  messages: [],
  isLoading: false,
};

export const messageContext = createContext<MessageContextType>(defaultMessageContext);