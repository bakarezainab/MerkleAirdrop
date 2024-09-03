import fs from 'fs';
import csv from 'csv-parser';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// Define the type for CSV data
interface CsvRow {
  address: string;
  amount: string; // use string to maintain consistency as CSV data is read as strings
}

// Step 1: Read the CSV file and parse addresses and amounts
function readCSV(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const data: CsvRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CsvRow) => {
        const address = row.address?.trim();
        const amount = row.amount?.trim();
        if (address && amount) { // Ensure both address and amount are present
          data.push({ address, amount });
        } else {
          console.warn('Skipping invalid row:', row);
        }
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Step 2: Hash each entry in the format keccak256(abi.encodePacked(address, amount))
function hashEntry(address: string, amount: string): Buffer {
  return Buffer.from(
    keccak256(Buffer.concat([
      Buffer.from(address.slice(2), 'hex'),
      Buffer.from(amount.padStart(64, '0'), 'hex')
    ])).toString('hex'), 'hex'
  );
}

// Function to generate Merkle tree and get Merkle proof for a specific address and amount
async function generateMerkleTree(filePath: string, addressToProof: string, amountToProof: string): Promise<void> {
  try {
    
    const data: CsvRow[] = await readCSV(filePath); //read the csv

    
    const leaves = data.map(row => {
      if (!row.address || !row.amount) {
        throw new Error(`Invalid CSV data: ${JSON.stringify(row)}`);
      }

      return hashEntry(row.address.toLowerCase(), row.amount);
    });

    
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true }); //Create a Merkle tree using the hashed entries

    
    const merkleRoot: string = merkleTree.getRoot().toString('hex'); //Get the Merkle root

    
    console.log('Merkle Root:', merkleRoot);

    // Generate Merkle proof for the specific address and amount
    const leafToProof = hashEntry(addressToProof.toLowerCase(), amountToProof);
    const proof = merkleTree.getHexProof(leafToProof);

    // Output the Merkle proof
    console.log(`Merkle Proof for ${addressToProof} with amount ${amountToProof}:`, proof);
  } catch (error) {
    console.error('Error generating Merkle tree or proof:', error);
  }
}

// Call the function with the path to your CSV file and the address/amount to generate a proof
generateMerkleTree('list/address.csv', '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB', '200');



// Merkle Proof for 0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB with amount 200: [
//     '0x8fe1a810b793fec614caec0d7af611596b4815d610456c35c5f6513efb03165d',
//     '0x37d22bce811474fe6c917e10a81e8b64c9d038f00d9a793dd8c02d161401d337'
//   ]