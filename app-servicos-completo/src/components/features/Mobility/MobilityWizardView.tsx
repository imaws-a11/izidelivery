import React from "react";
import { motion } from "framer-motion";
import { useApp } from "../../../contexts/AppContext";
import { TaxiWizard } from "./TaxiWizard";
import { VanWizard } from "./VanWizard";
import { FreightWizard } from "./FreightWizard";
import { MobilityPaymentView } from "./MobilityPaymentView";
import { ExcursionWizard } from "../Excursions/ExcursionWizard";
import { ExcursionDetail } from "../Excursions/ExcursionDetail";

export const MobilityWizardView: React.FC<any> = (props) => {
  const appCtx = useApp();
  const ctx = { ...appCtx, ...props };

  const {
    subView,
    setSubView,
    transitData,
    setTransitData,
    mobilityStep,
    setMobilityStep,
    userLocation,
    updateLocation,
    routePolyline,
    routeDistance,
    driverLocation,
    distancePrices,
    distanceValueKm,
    marketConditions,
    isCalculatingPrice,
    paymentMethod,
    setPaymentMethod,
    userLevel,
    setPaymentsOrigin,
    navigateSubView,
    showToast,
    calculateVanPrice,
    isIziBlackMembership,
    walletBalance,
    iziCoins,
    globalSettings,
    selectedCard,
    handleConfirmMobility,
    calculateDynamicPrice,
    userName,
    setSelectedItem,
    selectedItem,
    toastSuccess,
    setShowDatePicker,
    setShowTimePicker
  } = ctx;

  if (subView === "taxi_wizard") {
    return (
      <TaxiWizard
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        isCalculatingPrice={isCalculatingPrice}
        marketConditions={marketConditions}
        paymentMethod={paymentMethod}
        userLevel={userLevel}
        routeDistance={routeDistance}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
      />
    );
  }

  if (subView === "freight_wizard") {
    return (
      <FreightWizard
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        routeDistance={routeDistance}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        distanceValueKm={distanceValueKm}
        marketConditions={marketConditions}
        setShowDatePicker={setShowDatePicker}
        setShowTimePicker={setShowTimePicker}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
      />
    );
  }

  if (subView === "van_wizard") {
    return (
      <VanWizard
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        isCalculatingPrice={isCalculatingPrice}
        marketConditions={marketConditions}
        paymentMethod={paymentMethod}
        userLevel={userLevel}
        routeDistance={routeDistance}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
        calculateVanPrice={calculateVanPrice}
      />
    );
  }

  if (subView === "mobility_payment") {
    return (
      <MobilityPaymentView
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        transitData={transitData}
        isIziBlackMembership={isIziBlackMembership}
        walletBalance={walletBalance}
        iziCoins={iziCoins}
        iziCoinValue={globalSettings?.izi_coin_value || 1.0}
        selectedCard={selectedCard}
        handleConfirmMobility={handleConfirmMobility}
        navigateSubView={navigateSubView}
        marketConditions={marketConditions}
        calculateDynamicPrice={calculateDynamicPrice}
        serviceFee={globalSettings?.service_fee_percent || 0}
      />
    );
  }

  if (subView === "excursion_wizard") {
    return (
      <ExcursionWizard
        userName={userName}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        onSelectExcursion={(excursion: any) => {
          setSelectedItem(excursion);
          setSubView("excursion_detail");
        }}
      />
    );
  }

  if (subView === "excursion_detail") {
    return (
      <ExcursionDetail
        excursion={selectedItem}
        onBack={() => setSubView("excursion_wizard")}
        onConfirmReservation={() => {
          toastSuccess("Reserva solicitada com sucesso!");
          setSubView("none");
        }}
      />
    );
  }

  return null;
};
