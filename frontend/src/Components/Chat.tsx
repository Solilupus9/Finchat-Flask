import React, {useEffect, useState} from 'react';
import MessageList from "./MessageList.tsx";
import {SendHorizontal, Loader2, Mic, MicOff, Square} from 'lucide-react';
import styles from './styles/ChatPage.module.css';

interface Props {
	chatId: number;
	onNewMessage: (chatId: number) => void;
	setContext: (context: string) => void;
	setPageNumbers: (pageNumbers: number[]) => void;
}

function Chat({chatId, onNewMessage, setContext, setPageNumbers}: Props) {
	const [query, setQuery] = useState('');
	const [responseLoading, setResponseLoading] = useState(false);
	const [ttsOn, setTtsOn] = useState(true);
	const [isSpeaking, setIsSpeaking] = useState(false);

	useEffect(() => {
		console.log('IS SPEAKING:', ttsOn);
	}, [ttsOn]);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		try {
			setQuery('');
			setResponseLoading(true);
			const response = await fetch('/api/query', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({query, chat_id: chatId, tts: ttsOn}),
			});
			const result = await response.json();
			setIsSpeaking(ttsOn);
			setContext(result.context);
			setPageNumbers(result.page_numbers);
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
			setIsSpeaking(false);
		} catch (error) {
			console.error('Error sending query:', error);
		}
	}

	async function handleMicButtonClick() {
		if (ttsOn && isSpeaking){
			const response=await fetch('/api/stop_tts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			});
			const result=await response.json();
			console.log(result.message);
			setIsSpeaking(false);
		}
		if (ttsOn && !isSpeaking){
			setTtsOn(false);
		}
		else if (!ttsOn && !isSpeaking){
			setTtsOn(true);
		}
		console.log(`TTS ON: ${ttsOn}, IS SPEAKING: ${isSpeaking}`);
	}

	return (
		<div className={styles.chat}>
			<div className="border-bottom border-dark-subtle bg-primary">
				<h2 className="text-center text-white">Chats</h2>
			</div>
			<MessageList/>
			<form className={'m-2 d-flex flex-row'} onSubmit={handleSubmit}>
				<div className={`form-group flex-grow-1 me-2 ${styles.formGroup}`}>
					<input
						type={'text'}
						className={'form-control p-2 '}
						placeholder={'Enter your query'}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
				<button type={'submit'} className={'btn btn-outline-primary'} disabled={responseLoading || !query}>
					{responseLoading ? <Loader2 className={styles.spin}/> : <SendHorizontal/>}
				</button>
				<button type={'button'} className={'btn btn-outline-primary ms-2'}
						onClick={handleMicButtonClick} disabled={!ttsOn && responseLoading}>
					{ttsOn ? (isSpeaking ? <Square/> : <Mic/>) : <MicOff/>}
				</button>
			</form>
		</div>
	);
}

export default Chat;