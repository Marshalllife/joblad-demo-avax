// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JobladCredentials
 * @notice ERC-721 NFT representing verified skill credentials for Joblad providers.
 * Minted by the platform when a provider verifies their skill on Avalanche.
 */
contract JobladCredentials is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct Credential {
        string skillName;
        uint256 skillId;
        uint256 mintedAt;
        address provider;
    }

    mapping(uint256 => Credential) public credentials;

    event CredentialMinted(
        address indexed provider,
        uint256 indexed tokenId,
        string skillName,
        uint256 skillId
    );

    constructor() ERC721("Joblad Credentials", "JCRED") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a skill credential NFT to a verified provider.
     * @param to Provider's wallet address
     * @param skillName Name of the verified skill (e.g. "Electrician")
     * @param skillId Numeric skill identifier
     * @return tokenId The minted token ID
     */
    function mintCredential(
        address to,
        string memory skillName,
        uint256 skillId
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid provider address");
        require(bytes(skillName).length > 0, "Skill name required");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);

        credentials[tokenId] = Credential({
            skillName: skillName,
            skillId: skillId,
            mintedAt: block.timestamp,
            provider: to
        });

        emit CredentialMinted(to, tokenId, skillName, skillId);
        return tokenId;
    }

    /**
     * @notice Get credential details by token ID.
     */
    function getCredential(uint256 tokenId)
        external
        view
        returns (
            string memory skillName,
            uint256 skillId,
            uint256 mintedAt,
            address provider
        )
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Credential memory c = credentials[tokenId];
        return (c.skillName, c.skillId, c.mintedAt, c.provider);
    }

    /**
     * @notice Total credentials minted.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
