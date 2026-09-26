"use client";

import L from "leaflet";
import { Check, ExternalLink, LocateFixed, MapPinned, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { toast } from "sonner";

export type PickupLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

const bangkokCenter: [number, number] = [13.7563, 100.5018];

function MapInteraction({ value, onChange }: { value?: PickupLocation; onChange: (location: PickupLocation) => void }) {
  const map = useMap();
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  useEffect(() => {
    if (!value) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      map.setView([value.latitude, value.longitude], 17);
      return;
    }
    map.flyTo([value.latitude, value.longitude], 17, { duration: 0.7 });
  }, [map, value]);
  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
  onClose,
  onConfirm,
}: {
  value?: PickupLocation;
  onChange: (location: PickupLocation) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [locating, setLocating] = useState(false);
  const markerIcon = useMemo(() => L.divIcon({
    className: "care-map-marker-wrapper",
    html: '<span class="care-map-marker" aria-hidden="true"></span>',
    iconSize: [30, 38],
    iconAnchor: [15, 36],
  }), []);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(position.coords.accuracy),
        });
        setLocating(false);
        toast.success("ปักหมุดตำแหน่งปัจจุบันแล้ว");
      },
      (locationError) => {
        setLocating(false);
        const message = locationError.code === locationError.PERMISSION_DENIED
          ? "ยังไม่ได้อนุญาตตำแหน่ง กรุณาเปิดสิทธิ์ Location ในเบราว์เซอร์"
          : locationError.code === locationError.TIMEOUT
            ? "ค้นหาตำแหน่งนานเกินไป กรุณาลองอีกครั้ง"
            : "ไม่สามารถหาตำแหน่งปัจจุบันได้";
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  const center: [number, number] = value ? [value.latitude, value.longitude] : bangkokCenter;
  const osmUrl = value
    ? `https://www.openstreetmap.org/?mlat=${value.latitude}&mlon=${value.longitude}#map=17/${value.latitude}/${value.longitude}`
    : null;

  return (
    <section className="location-picker" aria-label="แผนที่เลือกจุดนัดรับ">
      <div className="location-picker-header">
        <div>
          <strong><MapPinned size={18} /> ปักหมุดจุดนัดรับ</strong>
          <small>แตะตำแหน่งบนแผนที่ หรือใช้ตำแหน่งปัจจุบัน</small>
        </div>
        <button type="button" className="icon-button-sm" onClick={onClose} aria-label="ปิดแผนที่"><X size={17} /></button>
      </div>
      <MapContainer center={center} zoom={value ? 17 : 12} scrollWheelZoom={false} className="location-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteraction value={value} onChange={onChange} />
        {value && <Marker position={[value.latitude, value.longitude]} icon={markerIcon} />}
      </MapContainer>
      <div className="location-picker-actions">
        <button type="button" className="button button-primary" onClick={useCurrentLocation} disabled={locating}>
          <LocateFixed size={18} /> {locating ? "กำลังค้นหาตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
        </button>
        {osmUrl && <a href={osmUrl} target="_blank" rel="noreferrer" className="button button-ghost"><ExternalLink size={17} /> เปิดแผนที่เต็ม</a>}
      </div>
      {value && (
        <div className="location-coordinate-summary">
          <strong>ปักหมุดแล้ว</strong>
          <span>{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</span>
          {value.accuracyMeters !== undefined && <small>ความแม่นยำประมาณ {value.accuracyMeters} เมตร</small>}
        </div>
      )}
      <button type="button" className="button button-primary button-full" onClick={onConfirm} disabled={!value}>
        <Check size={18} /> ใช้จุดนี้เป็นสถานที่นัดรับ
      </button>
      <small className="location-privacy-note">ตำแหน่งจะบันทึกเมื่อคุณส่งคำขอ และใช้สำหรับจับคู่งานกับการเดินทางเท่านั้น</small>
    </section>
  );
}
