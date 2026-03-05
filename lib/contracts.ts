// Contract addresses — filled after Phase 2 deploy to Fuji testnet
// Run: cd contracts && npx hardhat run scripts/deploy.ts --network fuji

export const CONTRACT_ADDRESSES = {
  escrow: process.env.ESCROW_CONTRACT_ADDRESS || '',
  reputation: process.env.REPUTATION_CONTRACT_ADDRESS || '',
  credentials: process.env.CREDENTIALS_CONTRACT_ADDRESS || '',
}

// ABIs — filled after Phase 2 compile + deploy
export const ESCROW_ABI = [
  'function createEscrow(bytes32 jobId, address provider) payable',
  'function release(bytes32 jobId)',
  'function refund(bytes32 jobId)',
  'function dispute(bytes32 jobId)',
  'function escrows(bytes32) view returns (address seeker, address provider, uint256 amount, uint8 status)',
  'event EscrowCreated(bytes32 indexed jobId, address indexed seeker, address indexed provider, uint256 amount)',
  'event EscrowReleased(bytes32 indexed jobId, address indexed provider, uint256 amount)',
  'event EscrowRefunded(bytes32 indexed jobId, address indexed seeker, uint256 amount)',
  'event EscrowDisputed(bytes32 indexed jobId, address filedBy)',
]

export const REPUTATION_ABI = [
  'function updateScore(address provider, uint8 rating)',
  'function getScore(address provider) view returns (uint256 average, uint256 jobCount)',
  'function scores(address) view returns (uint256 totalRating, uint256 jobCount, uint256 lastUpdated)',
  'event ScoreUpdated(address indexed provider, uint8 rating, uint256 newAverage, uint256 jobCount)',
]

export const CREDENTIALS_ABI = [
  'function mintCredential(address to, string skillName, uint256 skillId) returns (uint256)',
  'function getCredential(uint256 tokenId) view returns (string skillName, uint256 skillId, uint256 mintedAt, address provider)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'event CredentialMinted(address indexed provider, uint256 indexed tokenId, string skillName, uint256 skillId)',
]
