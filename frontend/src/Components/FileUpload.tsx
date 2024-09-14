import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Inbox, Loader2 } from "lucide-react";
import styles from './styles/MainPage.module.css';

const FileUpload = () => {
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 10) {
            alert('You can upload a maximum of 10 files');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        acceptedFiles.forEach((file) => {
            formData.append('files', file);
        });

        fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            setUploading(false);
            if (data.pdf_urls) {
                navigate('/chat', { state: { pdfUrls: data.pdf_urls } });
            }
        })
        .catch(error => {
            setUploading(false);
            console.error('Error uploading files:', error);
        });
    }, [navigate]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 10,
        maxSize: 10485760 * 10,
    });

    return (
        <div className="p-2 mt-2 bg-light rounded" style={{width: 400}}>
            <div
                {...getRootProps({
                    className: 'border border-primary px-4 py-1 bg-white rounded text-center',
                })}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <>
                        <Loader2 className={`h-10 w-10 text-primary ${styles.spin}`}/>
                        <p className="mt-2 text-primary">
                            Uploading PDF...
                        </p>
                    </>
                ) : (
                    <>
                        <Inbox className="w-10 h-10 text-primary"/>
                        <p className="mt-2 text-muted">Drop PDF Here</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUpload;