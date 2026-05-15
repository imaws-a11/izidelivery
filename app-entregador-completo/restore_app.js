const fs = require('fs');
const filePath = 'src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const missingCode = `        <AnimatePresence>{isSOSActive && renderSOS()}</AnimatePresence>
        <AnimatePresence>{showOrderModal && renderOrderDetailsModal()}</AnimatePresence>
        <AnimatePresence>
          {showBankDetails && (
            <BankDetailsModal 
              show={showBankDetails}
              onClose={() => {
                setShowBankDetails(false);
                setPixKey(localStorage.getItem('izi_driver_pix') || '');
                setBankName(localStorage.getItem('izi_driver_bank_name') || '');
                setIsEditingPix(false);
              }}
              bankName={bankName}
              onBankNameChange={(val) => {
                setBankName(val);
                setIsEditingPix(true);
              }}
              pixKey={pixKey}
              onPixKeyChange={(val) => {
                setPixKey(val);
                setIsEditingPix(true);
              }}
              onSave={async () => {
                await handleSavePix(pixKey, bankName);
                setShowBankDetails(false);
              }}
              isSaving={isSavingPix}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showPersonalDataModal && (
            <PersonalDataModal 
              show={showPersonalDataModal}
              onClose={() => setShowPersonalDataModal(false)}
              editProfileData={editProfileData}
              onUpdateData={setEditProfileData}
              onSave={handleUpdateProfile}
              isSaving={isSavingProfile}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>{showPlateModal && renderPlateEditView()}</AnimatePresence>
        <AnimatePresence>{showPreferences && renderPreferencesView()}</AnimatePresence>
        
        <AnimatePresence>
          {selectedSlot && renderSlotDetailsBottomSheet()}
        </AnimatePresence>

        {isProfileNotFound && renderProfileNotFoundView()}

        {showSlotAppliedSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-zinc-900/60 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="size-36 rounded-full bg-emerald-500 flex items-center justify-center mb-10 relative"
            >
              <Icon name="verified" size={56} className="text-zinc-950" />
              <motion.div 
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 border-4 border-yellow-400/50 rounded-xl"
              />
            </motion.div>
            
            <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none mb-4 text-center">
              Candidatura <br />
              <span className="text-yellow-600">Enviada com Sucesso!</span>
            </h2>

            {selectedSlot && (
              <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 w-full max-w-xs mb-8 flex flex-col items-center">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Valor Garantido</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-emerald-600">R$</span>
                  <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                    {Number(selectedSlot.fee_per_day || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="mt-2 bg-emerald-100/50 px-4 py-1.5 rounded-full border border-emerald-200">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                    até {selectedSlot.metadata?.base_deliveries || 10} entregas
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-zinc-400 font-bold text-[10px] sm:text-xs tracking-[0.2em] mb-12 max-w-xs uppercase leading-relaxed">
              Seu perfil premium foi enviado para análise. Fique atento às suas notificações!
            </p>

            <button
              onClick={() => {
                setShowSlotAppliedSuccess(false);
                setSelectedSlot(null);
              }}
              className="w-full max-w-xs h-18 rounded-xl bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all"
            >
              Voltar para Vagas
            </button>
            
            <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-10">
              <div className="w-16 h-1.5 bg-zinc-900 rounded-full" />
            </div>
          </motion.div>
        )}

        {activeTab === 'dashboard' && (
          <header className="px-6 pt-12 pb-4 bg-white border-b border-zinc-100 flex items-center justify-between relative z-10 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('profile')}
                className="relative active:scale-95 transition-transform"
              >
                <div className="size-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
                  {driverAvatar ? (
                    <img src={driverAvatar} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="person" className="text-zinc-400" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                  <Icon name="settings" size={12} className="text-zinc-400" />
                </div>
              </button>
              <div>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-none mb-1">
                  Olá, <span className="text-yellow-600 font-black">{driverName.split(' ')[0]}</span>
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className={\`size-2 rounded-full \${isOnline ? 'bg-emerald-500 ' : 'bg-rose-500'}\`} />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('notifications')}
              className="size-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center relative active:scale-95 transition-transform"
            >
              <Icon name="notifications" className="text-zinc-600" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-2 right-2 size-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>
          </header>
        )}

        <div className="flex-1 relative overflow-hidden flex flex-col bg-zinc-50">
          <main className="flex-1 overflow-y-auto no-scrollbar relative">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Painel Principal">{renderDashboard()}</LocalErrorBoundary></motion.div>}
              {activeTab === 'active_mission' && <motion.div key="active_miss" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Missão Ativa">{renderActiveMissionView()}</LocalErrorBoundary></motion.div>}
              {activeTab === 'history' && <motion.div key="hist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Histórico"><HistoryView history={history} getNetEarnings={getNetEarnings} serviceTypeLabel={serviceTypeLabel} onSelectOrder={(order: any) => { setSelectedOrder(order); setShowOrderModal(true); }} /></LocalErrorBoundary></motion.div>}
              {activeTab === 'earnings' && <motion.div key="earn" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Ganhos"><EarningsView stats={stats} onShowBankDetails={() => setShowBankDetails(true)} onShowWithdrawHistory={() => setShowWithdrawHistory(true)} onWithdrawRequest={handleWithdrawRequest} onNavigateToMissions={() => setActiveTab('missions')} /></LocalErrorBoundary></motion.div>}
              {activeTab === 'profile' && (
                <motion.div 
                  key="prof" 
                  initial={{ x: '-100%' }} 
                  animate={{ x: 0 }} 
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[300] bg-white flex flex-col"
                >
                  <LocalErrorBoundary featureName="Perfil">
                    <ProfileView 
                      driverName={driverName}
                      driverAvatar={driverAvatar}
                      driverPlate={driverPlate}
                      driverVehicle={driverVehicle}
                      authEmail={authEmail}
                      stats={{ level: stats.level, count: stats.count }}
                      isUploadingAvatar={isUploadingAvatar}
                      driverId={driverId}
                      onNavigateToDashboard={() => setActiveTab('dashboard')}
                      onShowPersonalDataModal={() => setShowPersonalDataModal(true)}
                      onShowBankDetails={() => setShowBankDetails(true)}
                      onShowPlateModal={() => setShowPlateModal(true)}
                      onShowPreferences={() => setShowPreferences(true)}
                      onShowHelpModal={() => setShowHelpModal(true)}
                      onLogout={handleLogout}
                      onAvatarUpload={handleAvatarUpload}
                      onOpenOverlaySettings={openOverlaySettings}
                      onSyncMission={syncMissionWithDB}
                      onResetMission={async () => {
                        if (await showConfirm({ title: 'Resetar Missão', message: 'Isso irá limpar o cache local da sua missão atual.', confirmLabel: 'Resetar Agora', danger: true })) {
                          setActiveMission(null);
                          localStorage.removeItem('Izi_active_mission');
                          setActiveTab('dashboard');
                          showSystemPopup('Reset Concluído', 'O cache da missão foi limpo com sucesso.', 'info');
                        }
                      }}
                      onSetEditProfileData={setEditProfileData}
                      onLoadProfile={loadProfileAndEnforceOnboarding}
                    />
                  </LocalErrorBoundary>
                </motion.div>
              )}
              {activeTab === 'missions' && <motion.div key="miss" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 h-full flex flex-col"><LocalErrorBoundary featureName="Marketplace"><MissionsView driverId={driverId || ''} /></LocalErrorBoundary></motion.div>}
              {activeTab === 'dedicated' && <motion.div key="dedi" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><LocalErrorBoundary featureName="Vagas Dedicadas">{renderDedicatedView()}</LocalErrorBoundary></motion.div>}
              {activeTab === 'scheduled' && <motion.div key="sched" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><LocalErrorBoundary featureName="Agenda">{renderScheduledView()}</LocalErrorBoundary></motion.div>}
              {activeTab === 'notifications' && (
                <motion.div key="notif" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 h-full">
                  {authInitLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 py-20 gap-4">
                      <div className="size-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Autenticando...</span>
                    </div>
                  ) : (
                    <NotificationsCenterView 
                      driverId={driverId || ''} 
                      onBack={() => setActiveTab('dashboard')} 
                      getSecureToken={getSecureToken}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeMission && activeTab !== 'active_mission' && (
                <motion.div 
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-28 left-4 right-4 z-[100]"
                >
                  <button
                    onClick={() => setActiveTab('active_mission')}
                    className="w-full bg-emerald-500 text-white rounded-xl p-4 flex items-center gap-4 active:scale-95 transition-all"
                  >
                    <div className="size-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon name="route" className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-0.5">Em Andamento</p>
                      <p className="text-sm font-black leading-tight">Retornar à Missão</p>
                    </div>
                    <Icon name="chevron_right" className="text-emerald-100" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {!activeMission && (
            <motion.button 
              initial={{ scale: 0, y: 50 }} 
              animate={{ scale: 1, y: 0 }} 
              whileTap={{ scale: 0.9 }} 
              onClick={handleToggleOnline} 
              className={`fixed bottom-40 right-6 z-[200] size-16 rounded-full flex items-center justify-center transition-all duration-300 \${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-900'
              }`}
            >
              <Icon 
                name="power_settings_new" 
                size={32} 
                className="text-white" 
              />
            </motion.button>
          )}

          <AnimatePresence>
            {!isNetworkConnected && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-32 left-6 right-6 z-[600] pointer-events-none"
              >
                <div className="bg-zinc-950/90 text-white px-6 py-4 rounded-xl flex items-center gap-4 border border-white/10 ">
                  <div className="size-10 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
                    <Icon name="wifi_off" size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-white">Modo Offline</p>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Verifique sua conexão de rede</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {renderBottomNavigation()}
        </div>`;

lines.splice(7157, 4, missingCode);
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
