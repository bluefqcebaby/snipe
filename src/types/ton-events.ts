interface IAccount {
    address: string;
    is_scam: boolean;
    is_wallet: boolean;
    name?: string;
}

interface IBaseTransaction {
    address: string;
    is_scam: boolean;
    is_wallet: boolean;
}

interface ISimplePreview {
    name: string;
    description: string;
    value?: string;
    value_image?: string;
    accounts: IBaseTransaction[];
}

interface IJetton {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: string;
}

interface ITonTransferAction {
    type: 'TonTransfer';
    status: string;
    TonTransfer: {
        sender: IAccount;
        recipient: IAccount;
        amount: number;
        comment?: string;
    };
    simple_preview: ISimplePreview;
    base_transactions: string[];
}

interface IJettonTransferAction {
    type: 'JettonTransfer';
    status: string;
    JettonTransfer: {
        sender: IAccount;
        recipient: IAccount;
        senders_wallet: string;
        recipients_wallet: string;
        amount: string;
        comment: string;
        jetton: IJetton;
    };
    simple_preview: ISimplePreview;
    base_transactions: string[];
}

interface ISmartContractExecAction {
    type: 'SmartContractExec';
    status: string;
    SmartContractExec: {
        executor: IAccount;
        contract: IAccount;
        ton_attached: number;
        operation: string;
        payload: string;
    };
    simple_preview: ISimplePreview;
    base_transactions: string[];
}

interface INftItemTransferAction {
    type: 'NftItemTransfer';
    status: string;
    NftItemTransfer: {
        recipient: IAccount;
        nft: string;
        comment: string;
    };
    simple_preview: ISimplePreview;
    base_transactions: string[];
}

type TAction = ITonTransferAction | IJettonTransferAction | ISmartContractExecAction | INftItemTransferAction;

interface IEvent {
    event_id: string;
    account: IAccount;
    timestamp: number;
    actions: TAction[];
    is_scam: boolean;
    lt: number;
    in_progress: boolean;
    extra: number;
}

interface IEventsApiResponse {
    events: IEvent[];
    next_from: number;
}
