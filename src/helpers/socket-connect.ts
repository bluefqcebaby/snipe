import { SupabaseClient } from '@supabase/supabase-js';
import { sendMessageToTG } from './telegram';

export const subscribeToTradeSettingsChange = (
    tradeSettings: ITradeSetting[],
    snipe: { addresses: string[] },
    supabase: SupabaseClient<any, 'public', any>,
) =>
    supabase
        .channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            if (payload.errors) {
                console.log('[ERROR]: ошибка обновления сокета', JSON.stringify(payload.errors, null, 2));
                sendMessageToTG(
                    'бЛЯЯЯЯЯЯЯЯЯЯЯЯТЬ, какая-то ошибка при обновлении сокетов почекай фаст на серваке логи',
                );

                return;
            }

            if (payload.table === 'tradeSettings') {
                if (payload.eventType === 'INSERT') {
                    tradeSettings.push(payload.new as ITradeSetting);
                }

                if (payload.eventType === 'DELETE') {
                    const deleteId = payload.old.id;

                    const deleteIndex = tradeSettings.findIndex((elem) => elem.id === deleteId);

                    tradeSettings.splice(deleteIndex, 1);
                }

                if (payload.eventType === 'UPDATE') {
                    const updateId = payload.old.id;

                    const updateIndex = tradeSettings.findIndex((elem) => elem.id === updateId);

                    tradeSettings[updateIndex] = payload.new as ITradeSetting;
                }
            }

            if (payload.table === 'snipeAddresses') {
                if (payload.eventType === 'UPDATE') {
                    snipe.addresses = payload.new.value;
                }
            }
        })
        .subscribe();
