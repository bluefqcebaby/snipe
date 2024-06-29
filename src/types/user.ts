interface IUserAsset {
    address: string;
    asset: {
        type: 'native' | 'jetton';
        address?: string;
    };
    balance: string;
}
