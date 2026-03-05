// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JobladReputation
 * @notice On-chain reputation scoring for Joblad providers on Avalanche.
 * Only the Joblad platform wallet can update scores (called after job completion).
 */
contract JobladReputation {
    struct ProviderScore {
        uint256 totalRating;
        uint256 jobCount;
        uint256 lastUpdated;
    }

    address public platform;
    mapping(address => ProviderScore) public scores;

    event ScoreUpdated(
        address indexed provider,
        uint8 rating,
        uint256 newAverage,
        uint256 jobCount
    );
    event PlatformUpdated(address indexed oldPlatform, address indexed newPlatform);

    modifier onlyPlatform() {
        require(msg.sender == platform, "Only platform can update scores");
        _;
    }

    constructor() {
        platform = msg.sender;
    }

    /**
     * @notice Update a provider's reputation score after job completion.
     * @param provider Provider's wallet address
     * @param rating Rating from 1-5 given by the seeker
     */
    function updateScore(address provider, uint8 rating) external onlyPlatform {
        require(provider != address(0), "Invalid provider address");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");

        ProviderScore storage s = scores[provider];
        s.totalRating += rating;
        s.jobCount += 1;
        s.lastUpdated = block.timestamp;

        uint256 average = s.totalRating / s.jobCount;
        emit ScoreUpdated(provider, rating, average, s.jobCount);
    }

    /**
     * @notice Get a provider's reputation score.
     * @param provider Provider's wallet address
     * @return average Score out of 5 (scaled by 100 for precision, e.g. 450 = 4.5)
     * @return jobCount Total jobs completed
     */
    function getScore(address provider)
        external
        view
        returns (uint256 average, uint256 jobCount)
    {
        ProviderScore memory s = scores[provider];
        if (s.jobCount == 0) return (0, 0);
        // Scale by 100 for precision: 450 means 4.50 stars
        average = (s.totalRating * 100) / s.jobCount;
        jobCount = s.jobCount;
    }

    /**
     * @notice Transfer platform control (e.g. to a multisig in production).
     */
    function updatePlatform(address newPlatform) external onlyPlatform {
        require(newPlatform != address(0), "Invalid address");
        emit PlatformUpdated(platform, newPlatform);
        platform = newPlatform;
    }
}
