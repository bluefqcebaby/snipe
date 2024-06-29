import { Pool, VaultNative } from '@dedust/sdk';
import { OpenedContract, Sender, toNano } from '@ton/core';

interface ISwapToJettonParams {
    tonVault: OpenedContract<VaultNative>;
    sender: Sender;
    pool: OpenedContract<Pool>;
    amountInTon: string;
}

export const swapToJetton = async ({ tonVault, sender, pool, amountInTon }: ISwapToJettonParams) => {
    await tonVault.sendSwap(sender, {
        amount: toNano(amountInTon),
        poolAddress: pool.address,
        gasAmount: toNano('0.25'),
    });
};
