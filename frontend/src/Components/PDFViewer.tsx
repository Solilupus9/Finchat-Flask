import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
    pdfUrl: string;
    context?: string;
}

function PDFViewer({ pdfUrl }: PDFViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const highlightPluginInstance = highlightPlugin();

    return (
        <div className={'w-50 mx-0'}>
            {pdfUrl ? (
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js`}>
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                        theme={'dark'}
                    />
                </Worker>
            ) : (
                <p>Loading PDF...</p>
            )}
        </div>
    );
}

export default PDFViewer;