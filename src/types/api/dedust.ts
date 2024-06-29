interface ITransaction {
    sender: string;
    assetIn: {
        type: TAssetType;
        address: string;
    };
    assetOut: {
        type: TAssetType;
    };
    amountIn: string;
    amountOut: string;
    lt: string;
    createdAt: string;
}

type TAssetType = 'native' | 'jetton';

interface IPrice {
    symbol: string;
    price: number;
    updatedAt: number;
}
