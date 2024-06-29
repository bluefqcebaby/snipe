interface IPriceChangePercentage {
    m5: string;
    h1: string;
    h6: string;
    h24: string;
}

interface ITransactions {
    buys: number;
    sells: number;
    buyers: number;
    sellers: number;
}

interface ITransactionsTimeframe {
    m5: ITransactions;
    m15: ITransactions;
    m30: ITransactions;
    h1: ITransactions;
    h24: ITransactions;
}

interface IVolumeUSD {
    m5: string;
    h1: string;
    h6: string;
    h24: string;
}

interface IAttributes {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    price_change_percentage: IPriceChangePercentage;
    transactions: ITransactionsTimeframe;
    volume_usd: IVolumeUSD;
    reserve_in_usd: string;
}

interface ITokenData {
    id: string;
    type: string;
}

interface IRelationships {
    base_token: {
        data: ITokenData;
    };
    quote_token: {
        data: ITokenData;
    };
    dex: {
        data: ITokenData;
    };
}

interface IData {
    id: string;
    type: string;
    attributes: IAttributes;
    relationships: IRelationships;
}

interface IPoolInfoResponse {
    data: IData;
}
