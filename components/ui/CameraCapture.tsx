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
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);

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
            if (flashEnabled) {
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 200);
            }

            setTimeout(() => {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (video && canvas) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0);
                        const imageData = canvas.toDataURL('image/jpeg', 0.9);
                        setCapturedImage(imageData);
                        stopCamera();
                    }
                }
            }, flashEnabled ? 150 : 0);
        }
    }, [stopCamera, flashEnabled]);

    const toggleFlash = useCallback(() => {
        setFlashEnabled(prev => !prev);
    }, []);

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
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {isFlashing && (
                <div className="absolute inset-0 bg-white z-50 animate-flash pointer-events-none"></div>
            )}

            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-40">
                <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>
                <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {error ? (
                    <div className="text-center px-6 max-w-md">
                        <div className="mb-6">
                            <svg className="w-20 h-20 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-white text-lg mb-2">Camera Access Required</p>
                            <p className="text-gray-400 text-sm">{error}</p>
                        </div>
                        <div className="space-y-3">
                            <Button onClick={startCamera} className="w-full">
                                Try Again
                            </Button>
                            <Button variant="secondary" onClick={handleClose} className="w-full">
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : capturedImage ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 flex items-center justify-center p-4">
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                        <div className="p-6 bg-gradient-to-t from-black/90 to-transparent">
                            <div className="flex gap-4 justify-center max-w-md mx-auto">
                                <Button onClick={retakePhoto} variant="secondary" className="flex-1">
                                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Retake
                                </Button>
                                <Button onClick={confirmCapture} className="flex-1 bg-green-600 hover:bg-green-700">
                                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Use Photo
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative max-w-4xl w-full aspect-[4/3] mx-auto">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover rounded-2xl"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            <div className="absolute inset-0 pointer-events-none">
                                <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="guideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
                                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="30" y="30" width="340" height="240" fill="none" stroke="url(#guideGradient)" strokeWidth="3" strokeDasharray="10,5" rx="8" />
                                    <line x1="30" y1="150" x2="370" y2="150" stroke="url(#guideGradient)" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
                                    <line x1="200" y1="30" x2="200" y2="270" stroke="url(#guideGradient)" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
                                    <circle cx="30" cy="30" r="6" fill="url(#guideGradient)" />
                                    <circle cx="370" cy="30" r="6" fill="url(#guideGradient)" />
                                    <circle cx="30" cy="270" r="6" fill="url(#guideGradient)" />
                                    <circle cx="370" cy="270" r="6" fill="url(#guideGradient)" />
                                </svg>
                            </div>

                            {isCameraActive && (
                                <>
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            onClick={toggleFlash}
                                            className={`p-3 rounded-full backdrop-blur-md transition-all ${
                                                flashEnabled
                                                    ? 'bg-yellow-500/90 text-white shadow-lg shadow-yellow-500/50'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        >
                                            {flashEnabled ? (
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
                                        <div className="w-16 h-16"></div>
                                        <button
                                            onClick={capturePhoto}
                                            className="relative group"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 shadow-lg">
                                                <div className="w-16 h-16 rounded-full bg-white"></div>
                                            </div>
                                        </button>
                                        <div className="w-16 h-16"></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {!error && !capturedImage && (
                <div className="absolute bottom-28 left-0 right-0 text-center px-4 pointer-events-none">
                    <div className="inline-block bg-black/60 backdrop-blur-md rounded-full px-6 py-3">
                        <p className="text-white text-sm font-medium">Align document within the guide frame</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
