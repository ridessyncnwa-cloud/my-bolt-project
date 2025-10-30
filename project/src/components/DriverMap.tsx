import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';
import { Loader } from 'lucide-react';

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 36.3729,
  lng: -94.2089,
};

type HotSpot = {
  lat: number;
  lng: number;
  intensity: number;
};

type DriverMapProps = {
  isActive: boolean;
};

export function DriverMap({ isActive }: DriverMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as any,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);
  const [hotSpots, setHotSpots] = useState<HotSpot[]>([]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);
          map.panTo(pos);
        },
        () => {
          console.log('Error: The Geolocation service failed.');
        }
      );
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Driver: Requesting geolocation...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Driver current location:', pos);

          const isInNWA = pos.lat >= 35.85 && pos.lat <= 36.55 && pos.lng >= -94.65 && pos.lng <= -93.95;
          console.log('Driver is in NWA:', isInNWA);

          if (isInNWA) {
            setCurrentLocation(pos);
            if (map) {
              map.panTo(pos);
            }
          } else {
            console.log('Driver location outside NWA service area, using default center');
            if (map) {
              map.panTo(defaultCenter);
            }
          }
        },
        (error) => {
          console.error('Driver geolocation error:', error);
          if (map) {
            map.panTo(defaultCenter);
          }
        }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Driver location updated:', pos);

          const isInNWA = pos.lat >= 35.85 && pos.lat <= 36.55 && pos.lng >= -94.65 && pos.lng <= -93.95;

          if (isInNWA) {
            setCurrentLocation(pos);
          }
        },
        (error) => {
          console.error('Driver geolocation watch error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => {
        console.log('Driver: Clearing geolocation watch');
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, [map]);

  useEffect(() => {
    if (!isActive) return;

    const generateHotSpots = () => {
      const spots: HotSpot[] = [];
      const numSpots = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < numSpots; i++) {
        spots.push({
          lat: currentLocation.lat + (Math.random() - 0.5) * 0.05,
          lng: currentLocation.lng + (Math.random() - 0.5) * 0.05,
          intensity: Math.random() * 0.7 + 0.3,
        });
      }
      setHotSpots(spots);
    };

    generateHotSpots();
    const interval = setInterval(generateHotSpots, 15000);

    return () => clearInterval(interval);
  }, [isActive, currentLocation]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error loading maps</p>
          <p className="text-sm text-gray-600">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation}
          zoom={14}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          <>
            {console.log('Driver: Rendering user marker at:', currentLocation)}
            <Marker
              position={currentLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: '#10B981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
              label={{
                text: '👤',
                fontSize: '20px',
              }}
              title="Your Location"
              zIndex={1000}
            />
          </>

          {isActive && (
            <>

              {hotSpots.map((spot, index) => (
                <Circle
                  key={index}
                  center={{ lat: spot.lat, lng: spot.lng }}
                  radius={500}
                  options={{
                    fillColor: '#EF4444',
                    fillOpacity: spot.intensity * 0.3,
                    strokeColor: '#DC2626',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              ))}
            </>
          )}
        </GoogleMap>
    </div>
  );
}
