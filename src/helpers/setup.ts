import { getHttpEndpoint } from '@orbs-network/ton-access';
import { mnemonicToWalletKey } from '@ton/crypto';
import { TonClient, WalletContractV4 } from '@ton/ton';

export const setup = async () => {
    const mnemonic = process.env.MAIN_MNEMONIC.split(' ')
        .filter((elem) => Boolean(elem.trim()))
        .join(' ');

    if (!mnemonic) {
        return null;
    }

    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

    const endpoint = await getHttpEndpoint({ network: 'mainnet' });
    const client = new TonClient({ endpoint });

    return { tonClient: client, wallet, key };
};
