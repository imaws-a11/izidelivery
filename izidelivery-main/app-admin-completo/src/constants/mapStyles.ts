export const mapContainerStyle = { width: '100%', height: '100%' };

export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1c1e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1c1e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2f31" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#001a2c" }] }
];

export const wazeMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f0ebe3" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1ee" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9b2a6" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#93817c" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5b076" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#447530" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#f8c967" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fafafb" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#ff8c00" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#e98d58" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.stroke", stylers: [{ color: "#db8555" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#806b63" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#b9d3c2" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#92998d" }] }
];
