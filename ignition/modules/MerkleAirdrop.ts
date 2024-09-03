import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = "";
const merkleRoot = "";

const MerkleAirdropModule = buildModule("MerkleAirdropModule", (m) => {

    const save = m.contract("MerkleAirdrop", [tokenAddress,merkleRoot]);

    return { save };
});

export default MerkleAirdropModule;