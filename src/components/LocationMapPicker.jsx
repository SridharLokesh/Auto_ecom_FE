
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';

const DEFAULT_CENTER = [20.5937, 78.9629]; // India

const markerIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function parseCoordinates(value) {
  if (!value || !value.trim()) return null;

  const parts = value.split(',').map(Number);
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const [longitude, latitude] = parts;

  if (
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return [latitude, longitude];
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 13));
  }, [center, map]);

  return null;
}

export default function LocationMapPicker({ value, onChange }) {
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const selectedPosition = useMemo(
    () => parseCoordinates(value),
    [value]
  );

  const mapCenter = selectedPosition || DEFAULT_CENTER;

  const selectLocation = (latitude, longitude) => {
    setError('');
    onChange(`${longitude.toFixed(6)}, ${latitude.toFixed(6)}`);
  };

  const useCurrentLocation = () => {
    setError('');

    if (!navigator.geolocation) {
      setError('Your browser does not support location detection.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectLocation(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocating(false);
      },
      (locationError) => {
        if (locationError.code === 1) {
          setError(
            'Location permission was denied. Allow location access in your browser settings and try again.'
          );
        } else if (locationError.code === 2) {
          setError('Your current location could not be detected.');
        } else {
          setError(
            'Location detection timed out. Please try again.'
          );
        }

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const searchLocation = async (event) => {
    event.preventDefault();

    const query = searchText.trim();
    if (!query) {
      setError('Enter a place or address to search.');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const url = new URL(
        'https://nominatim.openstreetmap.org/search'
      );

      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '1');
      url.searchParams.set('q', query);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error('Location search is temporarily unavailable.');
      }

      const results = await response.json();

      if (!results.length) {
        setError('No matching place found. Try another search.');
        return;
      }

      selectLocation(
        Number(results[0].lat),
        Number(results[0].lon)
      );
    } catch (searchError) {
      setError(
        searchError.message ||
          'Could not search for this location. Please try again.'
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-500">
          Search for a location
        </label>

        <form
          onSubmit={searchLocation}
          className="flex gap-2"
        >
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Enter dealer address, city or pincode"
            className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0a1f44]"
          />

          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-[#0a1f44] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="w-full rounded-xl border border-[#0a1f44] px-3 py-2 text-sm font-semibold text-[#0a1f44] hover:bg-blue-50 disabled:opacity-60"
      >
        {locating
          ? 'Detecting your location...'
          : 'Use my current location'}
      </button>

      <p className="text-xs text-gray-500">
        You can also click the map or drag the marker to choose
        the exact location.
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          center={mapCenter}
          zoom={selectedPosition ? 13 : 5}
          scrollWheelZoom
          style={{ height: '320px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={mapCenter} />

          <MapClickHandler onSelect={selectLocation} />

          {selectedPosition && (
            <Marker
              position={selectedPosition}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const position = event.target.getLatLng();
                  selectLocation(position.lat, position.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 text-sm">
        <p className="font-semibold text-gray-700">
          Selected coordinates
        </p>

        {selectedPosition ? (
          <p className="mt-1 break-words font-mono text-xs text-gray-600">
            Longitude: {selectedPosition[1].toFixed(6)}
            <br />
            Latitude: {selectedPosition[0].toFixed(6)}
          </p>
        ) : (
          <p className="mt-1 text-gray-500">
            No location selected yet.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
