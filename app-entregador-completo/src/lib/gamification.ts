import { supabase } from './supabase';
import { iziFetch } from './iziFetch';

export interface GamificationIncrement {
 driverId: string;
 missionKey: 'complete_delivery' | 'daily_goal' | 'weekly_bonus';
 incrementBy?: number;
 token?: string;
}

/**
 * Incrementa o progresso de todas as missões do motorista cujo trigger_event
 * corresponda ao missionKey fornecido (ex: 'complete_delivery').
 * Retorna array de missões que foram concluídas neste incremento.
 */
export async function incrementMissionProgress({
 driverId,
 missionKey,
 incrementBy = 1,
 token,
}: GamificationIncrement): Promise<{ isCompleted: boolean; missionId: string; title: string }[]> {
 try {
 const sUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
 const sKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();
 
 // 1. Buscar todas as missões ativas que reagem a este evento
 const { data: missionsList, error: missionError } = await supabase
 .from('gamification_missions')
 .select('id, target_value, title')
 .eq('audience', 'driver')
 .eq('is_active', true)
 .eq('trigger_event', missionKey);

 if (missionError || !missionsList || missionsList.length === 0) {
 console.log('[GAMIFICATION] Nenhuma missão ativa para o evento:', missionKey);
 return [];
 }

 // 2. Processar cada missão em paralelo
 const results = await Promise.all(
 missionsList.map(async (mission) => {
 try {
 const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
 const headers = { 
 'apikey': sKey, 
 'Content-Type': 'application/json',
 ...authHeader
 };

 const progressRes = await iziFetch(`${sUrl}/rest/v1/gamification_progress?driver_id=eq.${driverId}&mission_id=eq.${mission.id}&select=*`, {
 headers,
 timeoutMs: 5000,
 retries: 2
 });
 
 if (!progressRes.ok) throw new Error(`Erro ao buscar progresso: ${progressRes.status}`);
 const progressData = await progressRes.json();
 const progress = progressData[0];

 if (!progress) {
 const isNowCompleted = incrementBy >= mission.target_value;
 const insertRes = await iziFetch(`${sUrl}/rest/v1/gamification_progress`, {
 method: 'POST',
 headers: { ...headers, 'Prefer': 'return=minimal' },
 body: JSON.stringify({
 driver_id: driverId,
 mission_id: mission.id,
 current_value: incrementBy,
 target_value: mission.target_value,
 is_completed: isNowCompleted,
 completed_at: isNowCompleted ? new Date().toISOString() : null,
 }),
 timeoutMs: 8000,
 retries: 3
 });
 
 if (!insertRes.ok) console.error('[GAMIFICATION] Erro ao criar progresso:', await insertRes.text());
 return { isCompleted: isNowCompleted, missionId: mission.id, title: mission.title };
 }

 if (!progress.is_completed) {
 const newValue = (progress.current_value || 0) + incrementBy;
 const isNowCompleted = newValue >= mission.target_value;

 const updateRes = await iziFetch(`${sUrl}/rest/v1/gamification_progress?id=eq.${progress.id}`, {
 method: 'PATCH',
 headers: { ...headers, 'Prefer': 'return=minimal' },
 body: JSON.stringify({
 current_value: newValue,
 is_completed: isNowCompleted,
 completed_at: isNowCompleted ? new Date().toISOString() : null,
 updated_at: new Date().toISOString()
 }),
 timeoutMs: 8000,
 retries: 3
 });

 if (!updateRes.ok) console.error('[GAMIFICATION] Erro ao atualizar progresso:', await updateRes.text());
 return { isCompleted: isNowCompleted, missionId: mission.id, title: mission.title };
 }

 return { isCompleted: false, missionId: mission.id, title: mission.title };
 } catch (e) {
 console.error(`[GAMIFICATION] Erro na missão ${mission.id}:`, e);
 return { isCompleted: false, missionId: mission.id, title: mission.title };
 }
 })
 );

 return results;
 } catch (err) {
 console.error('[GAMIFICATION] Erro ao incrementar progresso:', err);
 return [];
 }
}
