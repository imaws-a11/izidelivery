const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const startMatch = 'const renderDashboard = () => (';
const endMatch = '    const renderScheduledDetailView = () => {';

const startIndex = content.indexOf(startMatch);
const endIndex = content.indexOf(endMatch);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `    const renderDashboard = () => (
        <DashboardView 
            driverName={driverName}
            stats={stats}
            activeMissions={activeMissions}
            filteredOrders={filteredOrders}
            dedicatedSlots={dedicatedSlots}
            myApplications={myApplications}
            isProfileLoaded={isProfileLoaded}
            isApproved={isApproved}
            driverId={driverId}
            selectedOrder={selectedOrder}
            isAccepting={isAccepting}
            onRefresh={fetchOrders}
            isRefreshing={isRefreshing}
            setActiveTab={setActiveTab}
            setActiveMission={setActiveMission}
            setSelectedOrder={setSelectedOrder}
            handleAccept={handleAccept}
            handleDeclineOrder={handleDeclineOrder}
            setSelectedSlot={setSelectedSlot}
            setShowOnboarding={setShowOnboarding}
            setShowOrderModal={setShowOrderModal}
            getServicePresentation={getServicePresentation}
            getNetEarnings={getNetEarnings}
        />
    );

`;
    const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', newContent);
    console.log('Replacement successful');
} else {
    console.log('Could not find start or end matches.', { startIndex, endIndex });
}
