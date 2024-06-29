import { Address, OpenedContract, fromNano, toNano } from '@ton/core';
import { setup } from './helpers/setup';
import {
    Asset,
    Factory,
    JettonRoot,
    MAINNET_FACTORY_ADDR,
    PoolType,
    ReadinessStatus,
    VaultJetton,
    VaultNative,
} from '@dedust/sdk';
import { TonClient } from '@ton/ton';
import axios, { AxiosError, isAxiosError } from 'axios';
import dayjs from 'dayjs';
import _ from 'lodash';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dotenv/config';
// import { sendMessageToTG } from './helpers/telegram';
import { createClient } from '@supabase/supabase-js';
import { sendMessageToTG } from './helpers/telegram';
import { Api, HttpClient } from '@ton-api/client';
import { swapToJetton } from './helpers/swap-to-jetton';
import { swapToTon } from './helpers/swap-to-ton';
import { sleep } from './helpers/common';
import { subscribeToTradeSettingsChange } from './helpers/socket-connect';

const supabase = createClient(process.env.SUPABASE_URL, process.env.PUBLIC_KEY);

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('Europe/Moscow');

const setupPool = async (
    tonVault: OpenedContract<VaultNative>,
    tonClient: TonClient,
    factory: OpenedContract<Factory>,
    address: string,
) => {
    const GOI_ADDRESS = Address.parse(address);

    const TON = Asset.native();
    const GOI = Asset.jetton(GOI_ADDRESS);

    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, GOI]));

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error('Pool (TON, GOI) does not exist.');
    }

    // Check if vault exits:
    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error('Vault (TON) does not exist.');
    }

    return pool;
};

const commonActions = async (type: string, triggerPrice: number, id: number) => {
    console.log(`${type}: лимитка на ${triggerPrice} сработала`);

    // sendMessageToTG(`${type}: ТРИГЕРНУЛО ЛИМИТКУ НА ${triggerPrice} @andreianesemaf`);

    // удаляем лимитку из базы
    const { error } = await supabase.from('limits').delete().eq('id', id);

    if (error) {
        // sendMessageToTG(`ЛИМИТКА С ID ${id} не удалилась с базы`);
    }
};

const goiAddress = 'EQBCoynGYslAMjv_gRl_2_B1KMOvh9ZW-ae0p7SaXZy6KFjY';

const addresses = [
    // мой кошель
    // '0:c4144a0b777ae4a013260e5aca83e20e990deb0255261776e7882623b035407c',
    // нн купивший гоев
    // '0:c9e61aa19799b1a86f7cd9c694645d1906d93afa7faee9bf0a614e37800487a6',
    // морген
    '0:738f5bf112c2f452ed902b4797c7f576a3677b1619244a027c5e616bbf01e004',
    // ебанутый смерте кит с накоплениями
    '0:a3201aa6bb7aefe070438e48d83cc49a3af10f59c50af30958d66115154916b8',
];

const GOI_SYMBOL = 'GOI';

(async () => {
    try {
        const initData = await setup();

        if (!initData) {
            return console.log('[ERROR]: Не получилось получилось доступ к кошельку');
        }

        const { tonClient, key, wallet } = initData;

        const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
        const tonVault = tonClient.open(await factory.getNativeVault());

        const sender = await wallet.sender(tonClient.provider(wallet.address), key.secretKey);

        const goiPool = await setupPool(tonVault, tonClient, factory, goiAddress);

        const GOI_ADDRESS = Address.parse(goiAddress);

        const goiVault = tonClient.open(await factory.getJettonVault(GOI_ADDRESS));

        const goiRoot = tonClient.open(JettonRoot.createFromAddress(GOI_ADDRESS));

        const goiWallet = tonClient.open(await goiRoot.getWallet(wallet.address));

        try {
            const httpClient = new HttpClient({
                baseUrl: 'https://tonapi.io',
                baseApiParams: {
                    headers: {
                        Authorization: `Bearer ${process.env.TONAPI_TOKEN}`,
                        'Content-type': 'application/json',
                    },
                },
            });

            // Initialize the API client
            const client = new Api(httpClient);

            let { data: _tradeSettings, error: tradeSettingsError } = await supabase.from('tradeSettings').select('*');

            if (tradeSettingsError) {
                return console.error('Не получилось зафетчить трейд настройки');
            }

            let { data: _snipeAddresses, error: snipeAddressesError } = await supabase
                .from('snipeAddresses')
                .select('*');

            if (snipeAddressesError) {
                return console.error('Не получилось зафетчить адреса для снайпа');
            }

            const tradeSettings = _tradeSettings as ITradeSetting[];

            const snipe = { addresses: (_snipeAddresses as ISnipe[])[0].value };

            subscribeToTradeSettingsChange(tradeSettings, snipe, supabase);

            let reqCount = 0;

            const checkedIds: string[] = [];

            let intervalId;
            let delay: number;

            setInterval(() => {
                delay = snipe.addresses.length * 11;
                const availableJettonsSymbol = tradeSettings.map((elem) => elem.symbol);
                const goiSettings = tradeSettings.find((elem) => elem.symbol === 'GOI');

                if (!goiSettings) {
                    console.log('нету каких-то трейд настроек');
                    console.log('гой - ', goiSettings);

                    return;
                }

                if (intervalId) {
                    clearInterval(intervalId);
                }

                intervalId = setInterval(async () => {
                    try {
                        const res = await Promise.all([
                            ...addresses.map((elem) => client.accounts.getAccountEvents(elem, { limit: 2 })),
                        ]);

                        res.forEach(async (elem) => {
                            if (!elem.events || elem?.events.length === 0) {
                                return;
                            }

                            if (reqCount < addresses.length) {
                                reqCount++;
                                checkedIds.push(elem.events[0]?.event_id);
                            }

                            if (checkedIds.includes(elem.events[0]?.event_id)) {
                                return;
                            }

                            const newEvent = elem.events[0];

                            if (!newEvent) {
                                return;
                            }

                            checkedIds.push(newEvent?.event_id);

                            if (newEvent.in_progress && newEvent.actions.length === 2) {
                                const side = newEvent.actions[0]?.JettonTransfer ? 'sell' : 'buy';

                                console.log('новый ивик -', JSON.stringify(newEvent, null, 2), side);

                                const transfer =
                                    side === 'buy'
                                        ? newEvent.actions[0]?.SmartContractExec
                                        : newEvent.actions[1]?.TonTransfer;

                                const jettonTransfer =
                                    newEvent.actions[0]?.JettonTransfer ?? newEvent.actions[1]?.JettonTransfer;

                                if (!jettonTransfer?.jetton) {
                                    return;
                                }

                                const amount = Number(
                                    fromNano('ton_attached' in transfer ? transfer.ton_attached : transfer.amount),
                                );

                                console.log(amount, side, jettonTransfer);

                                const { symbol } = jettonTransfer.jetton;

                                // если какая-то нн монета - идет нахуй
                                if (!availableJettonsSymbol.includes(symbol)) {
                                    return;
                                }

                                if (side === 'sell') {
                                    if (symbol === GOI_SYMBOL && amount >= goiSettings.buyTriggerAmount) {
                                        console.log('зашел купить гои');

                                        // СВАПАЕМ ТОНЫ В ГОИ
                                        goiSettings.buyDelay && (await sleep(goiSettings.buyDelay));

                                        await swapToJetton({
                                            amountInTon: goiSettings.amountToBuy,
                                            pool: goiPool,
                                            tonVault,
                                            sender,
                                        });
                                    }

                                    sendMessageToTG(
                                        `${dayjs()}: заснайпил ${newEvent.account.address} (${symbol}) на транзе с ${amount} тонами (купил по дешевке) @andreianesemaf`,
                                    );
                                }

                                // если китяра продает то мы должны купить
                                if (side === 'buy') {
                                    // проверяем символ крипты и колл-во
                                    if (symbol === GOI_SYMBOL && amount >= goiSettings.sellTriggerAmount) {
                                        console.log('зашел продать гои');

                                        goiSettings.sellDelay && (await sleep(goiSettings.sellDelay));
                                        // СВАПАЕМ ГОИ В ТОН
                                        await swapToTon({
                                            amountInJetton: goiSettings.amountToSell,
                                            pool: goiPool,
                                            vault: goiVault,
                                            wallet: goiWallet,
                                            sender,
                                        });
                                    }

                                    sendMessageToTG(
                                        `${dayjs()}: заснайпил ${newEvent.account.address} (${symbol}) на транзе с ${amount} тонами (продал подороже) @andreianesemaf`,
                                    );
                                }
                            }
                        });
                    } catch (error) {
                        if (isAxiosError(error)) {
                            console.log(
                                'ошибулечка',
                                (error as AxiosError).response.status,
                                (error as AxiosError).response,
                            );
                        }
                    }
                }, delay);
            }, 5000);
        } catch (error) {
            console.log('ОШИБКА', error);
        }
    } catch (error) {
        console.error(error);
    }
})();
