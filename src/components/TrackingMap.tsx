import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrackingMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: {
    id: string;
    position: [number, number];
    label: string;
    timestamp?: string;
  }[];
  historyPath?: [number, number][];
}

const RecenterMap = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const TrackingMap: React.FC<TrackingMapProps> = ({ 
  center = [20.5937, 78.9629], // Default to India center
  zoom = 5, 
  markers = [], 
  historyPath = [] 
}) => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap center={center} zoom={zoom} />

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-900">{marker.label}</p>
                {marker.timestamp && (
                  <p className="text-xs text-slate-500">
                    Last seen: {new Date(marker.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {historyPath.length > 1 && (
          <Polyline 
            positions={historyPath} 
            color="#3b82f6" 
            weight={4} 
            opacity={0.6}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
