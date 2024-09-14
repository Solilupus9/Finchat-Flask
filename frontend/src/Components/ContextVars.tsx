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
	pageNumbers: number[];
	setActivatedPageNumber: (pageNumber: number) => void;
}

const defaultMessageContext: MessageContextType = {
	messages: [],
	isLoading: false,
	pageNumbers: [],
	setActivatedPageNumber: function () {},
};

export const messageContext = createContext<MessageContextType>(defaultMessageContext);