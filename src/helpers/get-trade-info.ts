import { fromNano } from '@ton/core';
import dayjs from 'dayjs';

export const getTradeInfo = (trade: ITransaction, tonPrice: number) => {
    const { amountIn, amountOut, assetIn, createdAt } = trade;

    const side = assetIn.type === 'jetton' ? 'SELL' : 'BUY';

    const goiAmount = fromNano(side === 'SELL' ? amountIn : amountOut);
    const tonAmount = fromNano(side === 'BUY' ? amountIn : amountOut);

    const priceInUsd = Math.floor((Number(tonAmount) / Number(goiAmount)) * tonPrice);
    return { side, goiAmount, tonAmount, priceInUsd, date: dayjs(createdAt).format('DD MMM HH:mm:ss') };
};
