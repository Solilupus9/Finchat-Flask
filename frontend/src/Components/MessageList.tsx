import { useContext, useEffect, useRef } from "react";
import {messageContext} from "./ContextVars.tsx";
import { Bot, Loader2 } from 'lucide-react';
import styles from './styles/ChatPage.module.css';
import ReactMarkdown from 'react-markdown';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

function MessageList() {
    const messages = useContext(messageContext);
    const lastMessageRef = useRef<HTMLDivElement | null>(null);
    const isLoading = messages.isLoading;
    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const extractHighchartsCode = (content: string): Highcharts.Options | null => {
        const highchartsRegex = /Highcharts\.chart\('container',\s*({[\s\S]*?})\s*\);/;
        const match = content.match(highchartsRegex);
        if (match) {
            try {
                const optionsString = match[1];
                return eval('(' + optionsString + ')');
            } catch (error) {
                console.error('Error parsing Highcharts code:', error);
                return null;
            }
        }
        console.error('Highcharts code not found');
        return null;
    };

    return (
        <div className="flex-grow-1 border border-dark-subtle mx-2 mt-2 rounded-3" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="border-bottom border-dark-subtle bg-primary rounded-top-3">
                <h2 className="text-center text-white">Chats</h2>
            </div>
            {isLoading ? <Loader2 className={styles.spin}/> :
                <div>
                    {messages.messages.map((message, index) => (
                        <div key={index}
                             ref={index === messages.messages.length - 1 ? lastMessageRef : null}
                             className={`d-block p-2 m-2 rounded-3 ${message.role === 'user' ? 'bg-white text-end ms-auto' : 'bg-primary text-start text-white d-flex align-items-center'}`}
                             style={{border: '1px solid #ccc', width: 'fit-content'}}>
                            {message.role === 'model' && <Bot className="me-2"/>}
                            <div>
                                {message.content && message.role === 'model' && message.content.includes('Highcharts')? (
                                    <div style={{width: '100%', height: '100%'}}>
                                        <HighchartsReact
                                        highcharts={Highcharts}
                                        options={extractHighchartsCode(message.content)}
                                        containerProps={{style: {width: '400px', height: '100%'}}}/>
                                    </div>
                                ) : (
                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            }
        </div>
    );
}

export default MessageList;