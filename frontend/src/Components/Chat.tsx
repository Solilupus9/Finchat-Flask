import React, { useState } from 'react';
import MessageList from "./MessageList.tsx";
import { SendHorizontal, Loader2 } from 'lucide-react';
import styles from './styles/ChatPage.module.css';

interface Props {
    chatId: number;
    onNewMessage: (chatId: number) => void;
    setContext: (context: string) => void;
}

function Chat({ chatId, onNewMessage, setContext }: Props) {
    const [query, setQuery] = useState('');
    const [responseLoading, setResponseLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            setQuery('');
            setResponseLoading(true);
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({query, chat_id: chatId}), // Include chatId in the request body
            });
            const result = await response.json();
            setContext(result.context);
            console.log(`Response:::${result.response}`);

            const uploadResponse = await fetch(`/api/store_message/${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({query, response: result.response}),
            });
            if (!uploadResponse.ok) {
                console.error('Error storing message');
            } else {
                console.log('Message stored');
                onNewMessage(chatId);
            }
            setResponseLoading(false);
        } catch (error) {
            console.error('Error sending query:', error);
        }
    };
    return (
        <div className={styles.chat}>
            <MessageList />
            <form className={'m-2 d-flex flex-row'} onSubmit={handleSubmit}>
                <div className={`form-group me-2 ${styles.formGroup}`}>
                    <input
                        type={'text'}
                        className={'form-control p-2 w-100'}
                        placeholder={'Enter your query'}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button type={'submit'} className={'btn btn-outline-primary'} disabled={responseLoading || !query}>
                    {responseLoading ? <Loader2 className={styles.spin} /> : <SendHorizontal />}
                </button>
            </form>
        </div>
    );
}

export default Chat;