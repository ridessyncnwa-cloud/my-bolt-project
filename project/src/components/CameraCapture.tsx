import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Check, X } from 'lucide-react';

type CameraCaptureProps = {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  title: string;
  instructions: string;
};

export default function CameraCapture({ onCapture, onClose, title, instructions }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      setError('Unable to access camera. Please check your permissions.');
      setIsLoading(false);
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        onCapture(blob);
      })
      .catch((err) => {
        console.error('Error converting image:', err);
        setError('Failed to process image');
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-red-600 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
              <p className="text-sm text-white/90 mt-1">{instructions}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white">Starting camera...</p>
                </div>
              </div>
            )}

            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex justify-center space-x-4">
            {!capturedImage ? (
              <button
                onClick={capturePhoto}
                disabled={isLoading || !!error}
                className="bg-gradient-to-r from-blue-600 to-red-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Camera className="h-5 w-5" />
                <span>Capture Photo</span>
              </button>
            ) : (
              <>
                <button
                  onClick={retakePhoto}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-300 transition-all flex items-center space-x-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-full font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center space-x-2"
                >
                  <Check className="h-5 w-5" />
                  <span>Confirm</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
