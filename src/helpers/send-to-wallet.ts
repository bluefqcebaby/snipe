import { fromNano, internal } from '@ton/core';
import { sleep } from './common';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { KeyPair } from '@ton/crypto';

export const sendToWallet = async (
    client: TonClient,
    wallet: WalletContractV4,
    key: KeyPair,
    message: { to: string; value: string; body: string },
) => {
    const walletContract = client.open(wallet);
    console.log(walletContract);

    const seqno = await walletContract.getSeqno();
    console.log('seqno:', seqno);

    const balance = await client.getBalance(wallet.address);
    console.log('balance:', fromNano(balance));

    await walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno,
        messages: [
            internal({
                ...message,
                bounce: false,
            }),
        ],
    });

    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log('waiting for transaction to confirm...');
        await sleep(1000);
        currentSeqno = await walletContract.getSeqno();
    }
    console.log('transaction confirmed!');
};
