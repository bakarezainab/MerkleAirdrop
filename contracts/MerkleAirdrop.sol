// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


error InvalidProof();
error NoTokensToWithdraw();

contract MerkleAirdrop is Ownable {
    IERC20 public token;
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;

    event AirdropClaimed(address indexed user, uint256 amount);

    
    constructor(address _tokenAddress, bytes32 _merkleRoot) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
        merkleRoot = _merkleRoot;
    }

    function claimAirdrop(uint256 amount, bytes32[] calldata merkleProof) external {
        if (!hasClaimed[msg.sender]){
            revert InvalidProof();
        }
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof.");

        hasClaimed[msg.sender] = true;

        require(token.transfer(msg.sender, amount), "Token transfer failed.");

        emit AirdropClaimed(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    // Function to withdraw remaining tokens after the airdrop
    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        
        if(balance == 0){
            revert NoTokensToWithdraw();
        }
        require(token.transfer(owner(), balance), "Token transfer failed.");
    }
}