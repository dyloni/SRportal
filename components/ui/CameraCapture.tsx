import React, { useRef, useState, useCallback } from 'react';
import Button from './Button';

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
    title?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, title = 'Capture Photo' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please ensure camera permissions are granted.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    }, [stopCamera]);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    const confirmCapture = useCallback(() => {
        if (capturedImage) {
            onCapture(capturedImage);
            stopCamera();
            onClose();
        }
    }, [capturedImage, onCapture, onClose, stopCamera]);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);

    React.useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button
                    onClick={handleClose}
                    className="text-white text-3xl leading-none hover:text-gray-300"
                >
                    ×
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                {error ? (
                    <div className="text-center">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
                            {error}
                        </div>
                        <Button onClick={startCamera} className="mb-2">
                            Try Again
                        </Button>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                ) : capturedImage ? (
                    <div className="max-w-4xl w-full">
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-auto rounded-lg shadow-lg mb-4"
                        />
                        <div className="flex gap-4 justify-center">
                            <Button onClick={retakePhoto} variant="secondary">
                                Retake Photo
                            </Button>
                            <Button onClick={confirmCapture} className="bg-green-600 hover:bg-green-700">
                                Use This Photo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="relative max-w-4xl w-full">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-auto rounded-lg shadow-lg"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {isCameraActive && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <button
                                    onClick={capturePhoto}
                                    className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:border-brand-pink transition-colors shadow-lg"
                                >
                                    <div className="w-full h-full rounded-full bg-white m-1"></div>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!error && !capturedImage && (
                <div className="p-4 bg-black bg-opacity-50 text-white text-center">
                    <p className="text-sm">Position the document within the frame and tap the button to capture</p>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
