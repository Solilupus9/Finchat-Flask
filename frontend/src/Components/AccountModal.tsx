import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserName: string;
    currentUserEmail: string;
    onUpdate: (username: string, email: string, password: string) => void;
    onSignOut: () => void;
    closeUserInfoBox: () => void;
}

function AccountModal({ isOpen, onClose, currentUserName, currentUserEmail, onUpdate, onSignOut, closeUserInfoBox }: AccountModalProps) {
    const [username, setUsername] = useState(currentUserName);
    const [email, setEmail] = useState(currentUserEmail);
    const [password, setPassword] = useState('');
    const modalRef = useRef<HTMLDivElement | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(username, email, password);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modalRef, onClose]);

    useEffect(() => {
        if (isOpen) {
            closeUserInfoBox();
        }
    }, [isOpen, closeUserInfoBox]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content" ref={modalRef}>
                    <div className="modal-header">
                        <h5 className="modal-title">Manage Account</h5>
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary">Update</button>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-danger" onClick={onSignOut}>Sign Out</button>
                        <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>, document.getElementById('modal-root') as HTMLElement
    );
}

export default AccountModal;