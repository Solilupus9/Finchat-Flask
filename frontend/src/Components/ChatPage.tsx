import {useEffect, useState} from 'react';
import SideBar from './SideBar.tsx';
import PDFViewer from './PDFViewer.tsx';
import Chat from './Chat.tsx';
import styles from './styles/ChatPage.module.css';
import {messageContext} from "./ContextVars.tsx";

interface Message {
	id: number;
	content: string;
	role: string;
}

interface Chat {
	id: number;
	pdf_name: string;
	pdf_url: string;
}

// export const messageContext = createContext<[Message[], boolean]>([[], false]);

function ChatPage() {
	const [chats, setChats] = useState<Chat[]>([]);
	const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
	const [selectedChatId, setSelectedChatId] = useState(0);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [context, setContext] = useState('');

	useEffect(() => {
		async function fetchChats() {
			try {
				const response = await fetch('/api/chats');
				const data = await response.json();
				setChats(data);
				if (data.length > 0) {
					setSelectedPdfUrl(data.at(-1).pdf_url);
					setSelectedChatId(s => s == 0 ? data.at(-1).id : s);
				}
			} catch (error) {
				console.error('Error fetching chats:', error);
			}
		}

		fetchChats().then(() => console.log('Chats fetched'));
	}, []);

	useEffect(() => {
		console.log('Selected chat:', selectedChatId);
		if (selectedChatId) {
			fetchMessages(selectedChatId).then(() => console.log('Messages fetched'));
		}
	}, [selectedChatId]);

	async function fetchMessages(chatId: number) {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/messages/${chatId}`);
			if (!response.ok) {
				console.error(`Error fetching messages: ${response.statusText}`);
			}
			const data = await response.json();
			setMessages(data);
			console.log('Messages:', data);

			// Check if the chat is already initialized
			const initChatCheckResponse = await fetch(`/api/check_chat_initialized/${chatId}`);
			const initChatCheckData = await initChatCheckResponse.json();

			if (!initChatCheckData.initialized) {
				// Send messages to the endpoint to initialize the chat
				const initChatResponse = await fetch('/api/init_chat', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({chat_id: chatId, messages: data}),
				});

				if (!initChatResponse.ok) {
					console.error(`Error initializing chat: ${initChatResponse.statusText}`);
				} else {
					console.log('Chat initialized successfully');
				}
			} else {
				console.log('Chat already initialized');
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
		}
		setIsLoading(false);
	}

	function handleChatSelect(chatId: number, pdfUrl: string) {
		setSelectedPdfUrl(pdfUrl);
		setSelectedChatId(chatId);
	}

	return (
		<div className={`${styles.chatPage} d-flex flex-row`}>
			<SideBar chats={chats} onSelectPdf={handleChatSelect} selectedChatId={selectedChatId} setChats={setChats} setSelectedChatId={setSelectedChatId}/>
			<PDFViewer pdfUrl={selectedPdfUrl} context={context}/>
			<messageContext.Provider value={{messages, isLoading}}>
				<div className="flex-grow-1">
					<Chat chatId={selectedChatId} onNewMessage={fetchMessages} setContext={setContext}/>
				</div>
			</messageContext.Provider>
		</div>
	);
}

export default ChatPage;