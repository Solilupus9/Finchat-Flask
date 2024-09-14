import styles from './styles/ChatPage.module.css';
import {useNavigate} from "react-router-dom";
import {Trash2, ChevronDown, ChevronRight} from "lucide-react";
import {useState} from "react";
import toast from "react-hot-toast";

interface Chat {
	id: number;
	pdf_names: string[];
	pdf_urls: string[];
}

interface SideBarProps {
	chats: Chat[];
	onSelectPdf: (chatId: number, pdfUrl: string) => void;
	selectedChatId: number;
	setSelectedChatId: (chatId: number) => void;
	setChats: (chats: Chat[]) => void;
}

function SideBar({chats, onSelectPdf, selectedChatId, setChats, setSelectedChatId}: SideBarProps) {
	const navigate = useNavigate();
	const [isDeleting, setIsDeleting] = useState(false);
	const [expandedGroups, setExpandedGroups] = useState<number[]>(chats.map(chat => chat.id));

	const toggleGroup = (chatId: number) => {
		setExpandedGroups(prev =>
			prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
		);
	};

	async function handleDelete(chatId: number) {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/delete_chat/${chatId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (response.ok) {
				const updatedChats = chats.filter(chat => chat.id !== chatId);
				setChats(updatedChats);
				if (updatedChats.length > 0) {
					setSelectedChatId(updatedChats[0].id);
					window.location.reload();
				} else {
					navigate('/');
				}
				const result = await response.json();
				console.log(result.message);
			} else {
				console.error('Error deleting chat');
			}
			toast.success('Chat deleted successfully');
		} catch (error) {
			console.error('Error deleting chat:', error);
		}
		setIsDeleting(false);
	}

	return (
		<div className={styles.sidebar}>
			<button className={styles.newChatButton} onClick={() => navigate('/')}>New Chat</button>
			<div className={styles.chatList}>
				{chats.map((chat, index) => (
					<div key={index} className={`mt-2 ${styles.chatItem}`}>
						{chat.pdf_names.length > 1 ? (
							<div>
								<div className="d-flex align-items-center">
									<button className="btn btn-link" onClick={() => toggleGroup(chat.id)}>
										{expandedGroups.includes(chat.id) ? <ChevronDown/> : <ChevronRight/>}
									</button>
									<span>Group Chat {chat.id}</span>
									<button type={'button'} className={'btn btn-primary'} onClick={(e) => {
										e.stopPropagation();
										handleDelete(chat.id);
									}} disabled={isDeleting}>
										{isDeleting ?
											<span className="spinner-border spinner-border-sm" role="status"
												  aria-hidden="true"></span> : <Trash2/>}
									</button>
								</div>
								{expandedGroups.includes(chat.id) && (
									<div className="ml-4">
										{chat.pdf_names.map((pdf_name, pdf_index) => (
											<div key={pdf_index}
												 onClick={() => onSelectPdf(chat.id, chat.pdf_urls[pdf_index])}
												 className={`d-flex flex-row align-items-center ${chat.id === selectedChatId ? styles.activeChat : ''}`}>
												<p className={'my-2 text-truncate'}>{pdf_name}</p>
											</div>
										))}
									</div>
								)}
							</div>
						) : (
							<div onClick={() => onSelectPdf(chat.id, chat.pdf_urls[0])}
								 className={`d-flex  ${chat.id === selectedChatId ? styles.activeChat : ''}`}>
								<p className={'my-2 text-truncate'}>{chat.pdf_names[0]}</p>
								<button type={'button'} className={'btn btn-primary'} onClick={(e) => {
									e.stopPropagation();
									handleDelete(chat.id);
								}} disabled={isDeleting}>
									{isDeleting ? <span className="spinner-border spinner-border-sm" role="status"
														aria-hidden="true"></span> : <Trash2/>}
								</button>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export default SideBar;