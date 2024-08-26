import styles from './styles/ChatPage.module.css';
import {useNavigate} from "react-router-dom";
import {Trash2} from "lucide-react";

interface Chat {
    id: number;
    pdf_name: string;
    pdf_url: string;
}

interface SideBarProps {
    chats: Chat[];
    onSelectPdf: (chatId:number,pdfUrl: string) => void;
    selectedChatId: number;
    setSelectedChatId: (chatId: number) => void;
    setChats: (chats: Chat[]) => void; // Add this prop to update the chat list
}

function SideBar({ chats, onSelectPdf, selectedChatId, setChats,setSelectedChatId }: SideBarProps) {
    const navigate = useNavigate();

    const handleDelete = async (chatId: number) => {
        try {
            const response = await fetch(`/api/delete_chat/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                setChats(chats.filter(chat => chat.id !== chatId));
                setSelectedChatId(0);
                const result=await response.json();
                console.log(result.message);
            } else {
                console.error('Error deleting chat');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <div className={styles.sidebar}>
            <button className={styles.newChatButton} onClick={()=>navigate('/')}>New Chat</button>
            <div className={styles.chatList}>
                {chats.map((chat, index) => (
                    <div
                        key={index}
                        onClick={() => onSelectPdf(chat.id, chat.pdf_url)}
                        className={`mt-2 d-flex align-items-center ${chat.id === selectedChatId ? styles.activeChat : `${styles.chatItem}`}`}
                    >
                        <p className={'my-2 text-truncate'}>{chat.pdf_name}</p>
                        <button type={'button'} className={'btn btn-primary'} onClick={(e) => { e.stopPropagation(); handleDelete(chat.id); }}><Trash2/></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SideBar;