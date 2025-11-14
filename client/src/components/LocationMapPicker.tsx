import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapPickerProps {
  latitude: number;
  longitude: number;
  radius: number;
  onLocationChange?: (lat: number, lng: number) => void;
  editable?: boolean;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMapPicker({
  latitude,
  longitude,
  radius,
  onLocationChange,
  editable = true,
}: LocationMapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);

  useEffect(() => {
    setPosition([latitude, longitude]);
  }, [latitude, longitude]);

  const handleLocationChange = (lat: number, lng: number) => {
    if (!editable) return;
    setPosition([lat, lng]);
    onLocationChange?.(lat, lng);
  };

  return (
    <div className={t("components.locationmappicker.name.w_full_h_400px_rounded_lg_overflow_hidden_border_border_gray_300_dark_border_gray_700")}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">{t('components.LocationMapPicker.openstreetmap')}</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {editable && <MapClickHandler onLocationChange={handleLocationChange} />}
        
        <Marker position={position} />
        
        <Circle
          center={position}
          radius={radius}
          pathOptions={{
            color: "blue",
            fillColor: "blue",
            fillOpacity: 0.1,
          }}
        />
      </MapContainer>
    </div>
  );
}
