interface ITradeSetting {
    id: number;
    symbol: string;
    amountToSell: string;
    amountToBuy: string;
    sellTriggerAmount: number;
    buyTriggerAmount: number;
    sellDelay: number | null;
    buyDelay: number | null;
}

interface ISnipe {
    id: number;
    value: string[];
}
