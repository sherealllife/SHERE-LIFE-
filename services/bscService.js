import Web3 from 'web3';

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const web3 = new Web3(BSC_RPC);

// Trump Coin Contract (BSC)
const TRUMP_CONTRACT = '0x...'; // Andika contract address nyayo
const TRUMP_ABI = [/* ABI ya token */];

export const getTrumpBalance = async (address) => {
    const contract = new web3.eth.Contract(TRUMP_ABI, TRUMP_CONTRACT);
    const balance = await contract.methods.balanceOf(address).call();
    return balance / 1e18; // decimals
};
