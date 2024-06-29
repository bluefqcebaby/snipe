import { JettonWallet, Pool, VaultJetton } from '@dedust/sdk';
import { OpenedContract, Sender, toNano } from '@ton/core';

interface ISwapToTonParams {
    vault: OpenedContract<VaultJetton>;
    sender: Sender;
    pool: OpenedContract<Pool>;
    wallet: OpenedContract<JettonWallet>;
    amountInJetton: string;
}

export const swapToTon = async ({ pool, sender, vault, wallet, amountInJetton }: ISwapToTonParams) => {
    await wallet.sendTransfer(sender, toNano('0.3'), {
        amount: toNano(amountInJetton),
        destination: vault.address,
        responseAddress: sender.address,
        forwardAmount: toNano('0.25'),
        forwardPayload: VaultJetton.createSwapPayload({
            poolAddress: pool.address,
        }),
    });
};
