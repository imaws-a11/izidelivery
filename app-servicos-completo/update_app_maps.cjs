const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add routePolyline state if missing
if (!content.includes('const [routePolyline')) {
    content = content.replace(
        /const \[distanceValueKm, setDistanceValueKm\] = useState\(0\);/,
        'const [distanceValueKm, setDistanceValueKm] = useState(0);\n  const [routePolyline, setRoutePolyline] = useState<string>("");'
    );
}

// 2. Update FieldMask for Routes API
content = content.replace(
    /"X-Goog-FieldMask": "routes\.duration,routes\.distanceMeters"/,
    '"X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline"'
);

// 3. Set routePolyline in calculateDistancePrices
if (!content.includes('setRoutePolyline(route.polyline.encodedPolyline)')) {
    content = content.replace(
        /setDistanceValueKm\(distKm\);/,
        'setDistanceValueKm(distKm);\n        if (route.polyline?.encodedPolyline) {\n          setRoutePolyline(route.polyline.encodedPolyline);\n        }'
    );
}

// 4. Update IziTrackingMap property injection
// Be careful to only inject if not already there
content = content.replace(
    /<IziTrackingMap (?!.*?routePolyline)/g, 
    '<IziTrackingMap routePolyline={routePolyline} '
);

fs.writeFileSync(path, content);
console.log('App.tsx updated for Map Routes');
