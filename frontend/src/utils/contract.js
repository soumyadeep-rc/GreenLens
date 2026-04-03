import { ethers } from "ethers";
import ABI from "../../abi/GreenTokenABI.json";

export const CONTRACT_ADDRESS = "0xf10d483eec352f3136e33ad87a1c53188fb400a6";

export const getContract = async () => {
  // 1. Double check that the browser actually sees the extension
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not found. Please make sure the extension is installed and enabled.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // 2. FORCE THE POPUP: This line explicitly commands MetaMask to open
  await provider.send("eth_requestAccounts", []);

  // 3. Now that they are connected, grab their wallet signer
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  return { contract, signer };
};