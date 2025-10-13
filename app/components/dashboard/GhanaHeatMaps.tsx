'use client'
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Sample heatmap data: [latitude, longitude, intensity]
const heatmapPoints: [number, number, number?][] = [
  [5.614818, -0.205874, 0.6],
  [6.6921, -1.6308, 0.7],
  [7.9465, -1.0232, 0.5],
];

const HeatmapLayer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const heatLayer = (L as any).heatLayer(heatmapPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    });
    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map]);

  return null;
};

const GhanaHeatMaps: React.FC = () => {
  return (
    <MapContainer
      center={[7.9465, -1.0232]} // Center of Ghana
      zoom={6}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer />
    </MapContainer>
  );
};

export default GhanaHeatMaps;
