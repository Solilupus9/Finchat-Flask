import {ArrowRight, LogIn} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import styles from './styles/MainPage.module.css';
import toast from "react-hot-toast";
import AccountModal from './AccountModal';
import FileUpload from "./FileUpload.tsx";

function MainPage() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [chatsPresent, setChatsPresent] = useState(false);
    const userInfoRef = useRef<HTMLDivElement|null>(null);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch('/api/status', {
                    method: 'GET',
                    credentials: 'include',
                });
                const result = await response.json();
                setIsLoggedIn(result.logged_in);
                setCurrentUserName(result.username);
                setCurrentUserEmail(result.email);
                setChatsPresent(result.n_chats > 0);
            } catch (error) {
                console.error('Error checking login status:', error);
            }
        };
        checkLoginStatus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event:MouseEvent) => {
            if (userInfoRef.current && !userInfoRef.current.contains(event.target as Node)) {
                setShowUserInfo(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userInfoRef]);

    const handleUpdate = async (username: string, email: string, password: string) => {
        try {
            const response = await fetch('/api/update_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password }),
            });
            const result = await response.json();
            if (response.ok) {
                setCurrentUserName(result.username);
                setCurrentUserEmail(result.email);
                setIsModalOpen(false);
                toast.success('User data updated successfully');
            } else {
                console.error('Error updating user:', result.message);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await fetch('/api/sign_out', {
                method: 'POST',
                credentials: 'include',
            });
            setIsLoggedIn(false);
            setCurrentUserName('');
            setCurrentUserEmail('');
            setShowUserInfo(false);
            navigate('/');
            toast.success('Signed out successfully');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const closeUserInfoBox = () => {
        setShowUserInfo(false);
    };

    return (
        <div className={`${styles.mainPage} d-flex flex-column`}>
            {isLoggedIn && (
                <div
                    className={`top-right d-flex justify-content-center align-items-center rounded-circle bg-white border border-3 border-dark ${styles.topRight}`}
                    onClick={() => setShowUserInfo(!showUserInfo)}
                    style={{cursor: 'pointer'}}
                >
                    <span className='fw-bold' style={{fontSize: 20}}>{currentUserName[0]}</span>
                </div>
            )}
            {isLoggedIn && showUserInfo && (
                <div ref={userInfoRef} className={` ${styles.userInfoBox} d-flex flex-column`}>
                    <strong>{currentUserName}</strong>
                    <span className='text-muted'>{currentUserEmail}</span>
                    <button className='btn btn-primary my-2' onClick={() => setIsModalOpen(true)}>Manage Account</button>
                    <button className='btn btn-danger' onClick={handleSignOut}>Sign Out</button>
                </div>
            )}
            <div className={styles.centerContent}>
                <h1 className={`display-3 ${styles.textWhite}`}>Chat with any annual report</h1>
                <div>
                    {!isLoggedIn ? (
                        <>
                            <button type='button' className={'btn btn-dark me-2'} onClick={() => navigate('/sign-in')}>
                                Login to get started
                                <LogIn />
                            </button>
                            <button type='button' className={'btn btn-dark py-2'} onClick={() => navigate('/sign-up')}>
                                Register
                            </button>
                        </>
                    ) : (
                        <div className='d-flex flex-column align-items-center'>
                            {chatsPresent && <button type={'button'} className={'btn btn-dark py-2'}
                                                    onClick={() => navigate('/chat')}>Go to Chats <ArrowRight/>
                            </button>}
                            <FileUpload/>
                        </div>
                    )}
                </div>
            </div>
            <AccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentUserName={currentUserName}
                currentUserEmail={currentUserEmail}
                onUpdate={handleUpdate}
                onSignOut={handleSignOut}
                closeUserInfoBox={closeUserInfoBox}
            />
        </div>
    );
}

export default MainPage;