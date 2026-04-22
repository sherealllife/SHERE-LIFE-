import TronWeb from "tronweb";

const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io"
});

export async function createTronWallet() {
    const account = await tronWeb.createAccount();

    return {
        address: account.address.base58,
        privateKey: account.privateKey
    };
}
