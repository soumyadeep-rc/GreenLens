import { ethers } from "ethers";
import dotenv from "dotenv";
// Import the ABI directly if your Node version supports it, 
// or just paste the array here for 100% reliability.
const ABI = [
  "function mint(address to, uint256 amount) public",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

dotenv.config();

// 1. Setup Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 2. Initialize Contract
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ABI, // Using the string array ABI is much more stable for minting
  wallet
);

export async function mint(address, amount) {
  try {
    console.log(`--- Blockchain Minting Started ---`);
    console.log(`Target: ${address} | Amount: ${amount} GT`);

    // WEB3 FIX: Scale up to 18 decimals
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    
    // Call the contract
    const tx = await contract.mint(address, amountInWei);
    
    console.log(`Transaction Sent! Hash: ${tx.hash}`);
    
    // IMPORTANT: This line waits for the Sepolia network to confirm
    await tx.wait(); 
    
    console.log(`✅ ${amount} GT successfully minted on-chain.`);
    return tx.hash;
  } catch (err) {
    console.error("❌ Minting Error:", err.reason || err.message);
    throw err; 
  }
}

export async function getBlockchainBalance(address) {
  try {
    if (!address) return 0;
    const balanceWei = await contract.balanceOf(address);
    // Convert back from 18 decimals to human number
    const humanBalance = ethers.formatUnits(balanceWei, 18);
    return Math.floor(Number(humanBalance)); 
  } catch (err) {
    console.error("❌ Balance Fetch Error:", err.message);
    return 0; // Return 0 so the dashboard doesn't crash
  }
}