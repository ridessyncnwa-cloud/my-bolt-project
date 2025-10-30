import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Autocomplete, DirectionsRenderer, Polyline, Circle } from '@react-google-maps/api';
import { MapPin, Loader } from 'lucide-react';

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 36.3729,
  lng: -94.2089,
};

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type HotSpot = {
  lat: number;
  lng: number;
  intensity: number;
};

type MapWithAutocompleteProps = {
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  onPickupChange: (location: Location) => void;
  onDropoffChange: (location: Location) => void;
  showRoute?: boolean;
};

export function MapWithAutocomplete({
  pickupLocation,
  dropoffLocation,
  onPickupChange,
  onDropoffChange,
}: MapWithAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as any,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<boolean>(false);
  const [hotSpots, setHotSpots] = useState<HotSpot[]>([]);
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  useEffect(() => {
    if (currentLocation && !pickupLocation && isLoaded && map) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: currentLocation }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: results[0].formatted_address,
          };
          onPickupChange(location);
          console.log('Auto-filled pickup location:', location.address);
        } else if (status === 'REQUEST_DENIED') {
          console.warn('Geocoding API not enabled. Using coordinates as address.');
          const location = {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
          };
          onPickupChange(location);
        } else {
          console.error('Geocoding failed:', status);
        }
      });
    }
  }, [currentLocation, pickupLocation, isLoaded, map, onPickupChange]);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Requesting geolocation...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Current location:', pos);

          const isInNWA = pos.lat >= 35.85 && pos.lat <= 36.55 && pos.lng >= -94.65 && pos.lng <= -93.95;
          console.log('Is in NWA:', isInNWA);

          if (isInNWA) {
            setCurrentLocation(pos);
            if (map) {
              map.panTo(pos);
            }
          } else {
            console.log('Location outside NWA service area, using default center');
            if (map) {
              map.panTo(defaultCenter);
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (map) {
            map.panTo(defaultCenter);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Location updated:', pos);

          const isInNWA = pos.lat >= 35.85 && pos.lat <= 36.55 && pos.lng >= -94.65 && pos.lng <= -93.95;

          if (isInNWA) {
            setCurrentLocation(pos);
          }
        },
        (error) => {
          console.error('Geolocation watch error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => {
        console.log('Clearing geolocation watch');
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, [map]);

  const onPickupLoad = (autocomplete: google.maps.places.Autocomplete) => {
    pickupAutocompleteRef.current = autocomplete;

    const nwaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(35.85, -94.65),
      new google.maps.LatLng(36.55, -93.95)
    );
    autocomplete.setBounds(nwaBounds);
    autocomplete.setOptions({ strictBounds: true });
  };

  const onDropoffLoad = (autocomplete: google.maps.places.Autocomplete) => {
    dropoffAutocompleteRef.current = autocomplete;

    const nwaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(35.85, -94.65),
      new google.maps.LatLng(36.55, -93.95)
    );
    autocomplete.setBounds(nwaBounds);
    autocomplete.setOptions({ strictBounds: true });
  };

  const onPickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || '',
        };
        onPickupChange(location);

        if (map) {
          map.panTo(location);
          map.setZoom(14);
        }
      }
    }
  };

  const onDropoffPlaceChanged = () => {
    if (dropoffAutocompleteRef.current) {
      const place = dropoffAutocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || '',
        };
        onDropoffChange(location);

        if (map && pickupLocation) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickupLocation);
          bounds.extend(location);
          map.fitBounds(bounds);
        }
      }
    }
  };

  useEffect(() => {
    if (pickupLocation && dropoffLocation && isLoaded) {
      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: pickupLocation,
          destination: dropoffLocation,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
          provideRouteAlternatives: true,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            console.log('Route calculated:', result);

            if (result.routes && result.routes.length > 1) {
              const routesWithTraffic = result.routes.map((route, index) => ({
                route,
                index,
                duration: route.legs[0]?.duration_in_traffic?.value || route.legs[0]?.duration?.value || 0,
              }));

              routesWithTraffic.sort((a, b) => a.duration - b.duration);

              const bestRoute = routesWithTraffic[0];
              const optimizedResult = {
                ...result,
                routes: [bestRoute.route],
              };

              console.log(`Selected fastest route (${bestRoute.index + 1} of ${result.routes.length}) with duration: ${Math.ceil(bestRoute.duration / 60)} min`);
              setDirections(optimizedResult as google.maps.DirectionsResult);
            } else {
              setDirections(result);
            }

            setDirectionsError(false);
          } else {
            console.error('Directions request failed:', status);
            setDirections(null);
            setDirectionsError(true);
          }
        }
      );
    } else {
      setDirections(null);
      setDirectionsError(false);
    }
  }, [pickupLocation, dropoffLocation, isLoaded]);

  useEffect(() => {
    const generateHotSpots = () => {
      const baseLocation = currentLocation || defaultCenter;
      const spots: HotSpot[] = [];
      const numSpots = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < numSpots; i++) {
        spots.push({
          lat: baseLocation.lat + (Math.random() - 0.5) * 0.05,
          lng: baseLocation.lng + (Math.random() - 0.5) * 0.05,
          intensity: Math.random() * 0.7 + 0.3,
        });
      }
      setHotSpots(spots);
    };

    generateHotSpots();
    const interval = setInterval(generateHotSpots, 15000);

    return () => clearInterval(interval);
  }, [currentLocation]);

  const center = pickupLocation || dropoffLocation || currentLocation || defaultCenter;

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
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={currentLocation && !pickupLocation && !dropoffLocation ? 15 : 11}
            onLoad={onLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {directions ? (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 5,
                    strokeOpacity: 0.8,
                  },
                }}
              />
            ) : (
              <>
                {pickupLocation && dropoffLocation && directionsError && (
                  <Polyline
                    path={[pickupLocation, dropoffLocation]}
                    options={{
                      strokeColor: '#3B82F6',
                      strokeWeight: 5,
                      strokeOpacity: 0.6,
                      geodesic: true,
                    }}
                  />
                )}
                {pickupLocation && (
                  <Marker
                    position={pickupLocation}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#3B82F6',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                    label={{
                      text: 'P',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                )}
                {dropoffLocation && (
                  <Marker
                    position={dropoffLocation}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#EF4444',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                    label={{
                      text: 'D',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </>
            )}

            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#10B981',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                }}
                label={{
                  text: '📍',
                  fontSize: '16px',
                }}
                title="Your Current Location"
                zIndex={9999}
              />
            )}

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
          </GoogleMap>

          <div className="absolute top-4 left-4 right-4 space-y-2 z-10">
            <div className="bg-white rounded-lg shadow-lg">
              <Autocomplete
                onLoad={onPickupLoad}
                onPlaceChanged={onPickupPlaceChanged}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    className="w-full pl-10 pr-4 py-3 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded-lg"
                    defaultValue={pickupLocation?.address || ''}
                  />
                </div>
              </Autocomplete>
            </div>

            <div className="bg-white rounded-lg shadow-lg">
              <Autocomplete
                onLoad={onDropoffLoad}
                onPlaceChanged={onDropoffPlaceChanged}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-600" />
                  <input
                    type="text"
                    placeholder="Enter dropoff location"
                    className="w-full pl-10 pr-4 py-3 text-sm border-0 focus:ring-2 focus:ring-red-500 rounded-lg"
                    defaultValue={dropoffLocation?.address || ''}
                  />
                </div>
              </Autocomplete>
            </div>
          </div>
        </div>
    </div>
  );
}
