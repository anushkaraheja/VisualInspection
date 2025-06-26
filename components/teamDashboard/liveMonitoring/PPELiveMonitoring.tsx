import { WebvisStream } from '@/components/locations/WebvisStream';
import React, { useState, useEffect } from 'react';
import { FaHardHat, FaVest, FaHandPaper } from 'react-icons/fa';
import LiveStream from './liveStream';
import { DeviceStatus } from '@prisma/client';

interface PPELiveMonitoringProps {
  isFarmTenant?: boolean;
  apiEndpoint?: string
  status?: DeviceStatus;
  cameraIndex?: number;
}

const PPELiveMonitoring: React.FC<PPELiveMonitoringProps> = ({
  isFarmTenant,
  apiEndpoint,
  status = DeviceStatus.OFFLINE,
  cameraIndex = 0,
}) => {
  // Array of available video sources
  const videoSources = apiEndpoint ? [apiEndpoint] : [
    'https://brickred-my.sharepoint.com/personal/ankit_katiyar_brickred_in/_layouts/15/embed.aspx?UniqueId=4c642730-45ac-4592-8a46-c546e3cf7d86&embed=%7B%22af%22%3Atrue%2C%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create',
    'https://brickred-my.sharepoint.com/personal/ankit_katiyar_brickred_in/_layouts/15/embed.aspx?UniqueId=8649b056-8f10-42d7-8612-164de3f1a50d&embed=%7B%22af%22%3Atrue%2C%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create',
  ];


  // State to hold the selected video source
  const [selectedVideoSource, setSelectedVideoSource] = useState<string>('');

  // Set video source based on camera status and index
  useEffect(() => {
    if (status === DeviceStatus.ONLINE) {
      // Use alternating video sources for online cameras based on index
      const videoIndex = cameraIndex % videoSources.length;
      setSelectedVideoSource(videoSources[videoIndex]);
    } else {
      // Clear video source for offline cameras
      setSelectedVideoSource('');
    }
  }, [status, cameraIndex, videoSources]);


  // Generate random detection counts for today
  const detectionCounts = {
    helmet: Math.floor(Math.random() * 5) + 1,
    vest: Math.floor(Math.random() * 7) + 1,
    gloves: Math.floor(Math.random() * 4) + 1,
  };

  // In a real implementation, we'd check if zone is active via API
  const isActive = true;

  return (
    <div>
      {/* Streamlined camera feed with requested elements */}
      <div className="relative h-72 bg-gray-400 dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow-inner">
        {/* Only show detection status and live indicator for online cameras */}
        {status === DeviceStatus.OFFLINE && (
          <div className="absolute top-3 right-3 flex space-x-2 z-10">
            {<span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1"></span>
              Missing Helmet
            </span>}
            {isActive && (
              <span className="bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1"></span>
                LIVE
              </span>
            )}
          </div>
        )}

        {/* Video stream or offline message */}
        <div className="absolute inset-0">
          {status === DeviceStatus.ONLINE && selectedVideoSource ? (
            apiEndpoint ? (
              <WebvisStream
                url={selectedVideoSource}
                status={status === DeviceStatus.ONLINE}
                fit={true}
              />
            ) : (
              <iframe
                src={selectedVideoSource}
                className="w-full h-full"
                title="PPE Demo Video"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
              ></iframe>
            )
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-500 dark:bg-gray-700">
              <div className="text-center p-4">
                <div className="text-white text-lg font-medium mb-1">
                  Camera Offline
                </div>
                <div className="text-gray-200 text-sm">
                  This camera is currently unavailable
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom right: Detection counts for today - only for online cameras AND PPE TENANT */}
        {status === DeviceStatus.ONLINE && (
          <div className="absolute bottom-3 right-3 z-10 flex space-x-3">
            <div className="bg-black/40 bg-white px-2.5 py-1.5 rounded-full flex items-center">
              <FaHardHat className="text-yellow-400 h-4 w-4 mr-1.5" />
              <span className="text-black text-xs font-medium">
                Helmet {detectionCounts.helmet}
              </span>
            </div>
            <div className="bg-black/40 bg-white px-2.5 py-1.5 rounded-full flex items-center">
              <FaVest className="text-blue-400 h-4 w-4 mr-1.5" />
              <span className="text-black text-xs font-medium">
                Vest {detectionCounts.vest}
              </span>
            </div>
            <div className="bg-black/40 bg-white px-2.5 py-1.5 rounded-full flex items-center">
              <FaHandPaper className="text-pink-400 h-4 w-4 mr-1.5" />
              <span className="text-black text-xs font-medium">
                Gloves {detectionCounts.gloves}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PPELiveMonitoring;
