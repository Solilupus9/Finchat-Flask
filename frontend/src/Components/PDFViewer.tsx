import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
    pdfUrl: string;
    context?: string;
    pageNumber?: number;
}

function PDFViewer({ pdfUrl,context,pageNumber }: PDFViewerProps) {
    const text= "With our Glide 4.0 framework, we accelerate the digital\n" +
        "journey of enterprises through our innovative digital\n" +
        "application and cloud engineering services.\n" +
        "We achieve this by building efficient API ecosystems,\n" +
        "modernising legacy systems with new-age digital technology\n" +
        "platforms using microservices, migrating to cloud platforms,\n" +
        "cloud-native development, and assuring successful\n" +
        "delivery, following an integrated quality engineering and\n" +
        "DevSecOps approach.";
    const pno=10;
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const highlightPluginInstance = highlightPlugin();

    return (
        <div className={'w-50 mx-0'}>
            {pdfUrl ? (
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
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