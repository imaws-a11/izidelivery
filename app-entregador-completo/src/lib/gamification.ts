import { supabase } from './supabase';

export interface GamificationIncrement {
    driverId: string;
    missionKey: 'complete_delivery' | 'daily_goal' | 'weekly_bonus';
    incrementBy?: number;
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
}: GamificationIncrement): Promise<{ isCompleted: boolean; missionId: string }[]> {
    try {
        // 1. Buscar todas as missões ativas que reagem a este evento
        const { data: missionsList, error: missionError } = await supabase
            .from('gamification_missions')
            .select('id, target_value')
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
                // Buscar progresso atual do motorista nesta missão
                const { data: progress, error: progressError } = await supabase
                    .from('gamification_progress')
                    .select('*')
                    .eq('driver_id', driverId)
                    .eq('mission_id', mission.id)
                    .maybeSingle();

                if (progressError) throw progressError;

                if (!progress) {
                    // Progresso ainda não existe: criar com o primeiro incremento
                    const isNowCompleted = incrementBy >= mission.target_value;
                    await supabase.from('gamification_progress').insert({
                        driver_id: driverId,
                        mission_id: mission.id,
                        current_value: incrementBy,
                        target_value: mission.target_value,
                        is_completed: isNowCompleted,
                        completed_at: isNowCompleted ? new Date().toISOString() : null,
                    });
                    return { isCompleted: isNowCompleted, missionId: mission.id };
                }

                // Já existe progresso — só atualizar se ainda não concluída
                if (!progress.is_completed) {
                    const newValue = progress.current_value + incrementBy;
                    const isNowCompleted = newValue >= mission.target_value;

                    await supabase
                        .from('gamification_progress')
                        .update({
                            current_value: newValue,
                            is_completed: isNowCompleted,
                            completed_at: isNowCompleted ? new Date().toISOString() : null,
                        })
                        .eq('id', progress.id);

                    return { isCompleted: isNowCompleted, missionId: mission.id };
                }

                return { isCompleted: false, missionId: mission.id };
            })
        );

        return results;
    } catch (err) {
        console.error('[GAMIFICATION] Erro ao incrementar progresso:', err);
        return [];
    }
}
