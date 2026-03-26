const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update ActiveOrderView call
content = content.replace(
    /<ActiveOrderView\s+selectedItem={selectedItem}\s+driverLocation={driverLocation}\s+userLocation={userLocation\?.lat \? { lat: userLocation\.lat, lng: userLocation\.lng } : null}\s+onMyLocationClick={updateLocation}\s+setSubView={setSubView}\s+\/>/,
    '<ActiveOrderView\n                    selectedItem={selectedItem}\n                    driverLocation={driverLocation}\n                    userLocation={userLocation?.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}\n                    routePolyline={routePolyline}\n                    onMyLocationClick={updateLocation}\n                    setSubView={setSubView}\n                  />'
);

fs.writeFileSync(path, content);
console.log('ActiveOrderView call updated in App.tsx');
