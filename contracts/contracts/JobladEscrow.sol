// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JobladEscrow
 * @notice Holds AVAX in escrow for Joblad service jobs on Avalanche.
 * Seeker locks funds when booking, released to provider on completion.
 */
contract JobladEscrow {
    enum EscrowStatus { Held, Released, Refunded, Disputed }

    struct Escrow {
        address seeker;
        address provider;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
    }

    mapping(bytes32 => Escrow) public escrows;

    event EscrowCreated(
        bytes32 indexed jobId,
        address indexed seeker,
        address indexed provider,
        uint256 amount
    );
    event EscrowReleased(
        bytes32 indexed jobId,
        address indexed provider,
        uint256 amount
    );
    event EscrowRefunded(
        bytes32 indexed jobId,
        address indexed seeker,
        uint256 amount
    );
    event EscrowDisputed(bytes32 indexed jobId, address filedBy);

    modifier onlySeeker(bytes32 jobId) {
        require(escrows[jobId].seeker == msg.sender, "Not the seeker");
        _;
    }

    modifier escrowExists(bytes32 jobId) {
        require(escrows[jobId].createdAt != 0, "Escrow does not exist");
        _;
    }

    modifier inStatus(bytes32 jobId, EscrowStatus expected) {
        require(escrows[jobId].status == expected, "Invalid escrow status");
        _;
    }

    /**
     * @notice Seeker creates escrow, locking AVAX for the job.
     * @param jobId Unique job identifier (bytes32 hash of MongoDB ObjectId)
     * @param provider Provider's wallet address
     */
    function createEscrow(bytes32 jobId, address provider) external payable {
        require(msg.value > 0, "Must send AVAX");
        require(provider != address(0), "Invalid provider address");
        require(escrows[jobId].createdAt == 0, "Escrow already exists");
        require(provider != msg.sender, "Seeker cannot be provider");

        escrows[jobId] = Escrow({
            seeker: msg.sender,
            provider: provider,
            amount: msg.value,
            status: EscrowStatus.Held,
            createdAt: block.timestamp
        });

        emit EscrowCreated(jobId, msg.sender, provider, msg.value);
    }

    /**
     * @notice Seeker releases payment to provider after job completion.
     * @param jobId The job identifier
     */
    function release(bytes32 jobId)
        external
        escrowExists(jobId)
        onlySeeker(jobId)
        inStatus(jobId, EscrowStatus.Held)
    {
        Escrow storage e = escrows[jobId];
        e.status = EscrowStatus.Released;

        (bool sent, ) = e.provider.call{value: e.amount}("");
        require(sent, "Transfer to provider failed");

        emit EscrowReleased(jobId, e.provider, e.amount);
    }

    /**
     * @notice Seeker cancels and gets refund (only while Held).
     * @param jobId The job identifier
     */
    function refund(bytes32 jobId)
        external
        escrowExists(jobId)
        onlySeeker(jobId)
        inStatus(jobId, EscrowStatus.Held)
    {
        Escrow storage e = escrows[jobId];
        e.status = EscrowStatus.Refunded;

        (bool sent, ) = e.seeker.call{value: e.amount}("");
        require(sent, "Refund to seeker failed");

        emit EscrowRefunded(jobId, e.seeker, e.amount);
    }

    /**
     * @notice Either party can file a dispute. Platform resolves manually.
     * @param jobId The job identifier
     */
    function dispute(bytes32 jobId)
        external
        escrowExists(jobId)
        inStatus(jobId, EscrowStatus.Held)
    {
        Escrow storage e = escrows[jobId];
        require(
            msg.sender == e.seeker || msg.sender == e.provider,
            "Not a party to this escrow"
        );

        e.status = EscrowStatus.Disputed;
        emit EscrowDisputed(jobId, msg.sender);
    }

    /**
     * @notice Get full escrow details.
     */
    function getEscrow(bytes32 jobId)
        external
        view
        returns (
            address seeker,
            address provider,
            uint256 amount,
            EscrowStatus status,
            uint256 createdAt
        )
    {
        Escrow memory e = escrows[jobId];
        return (e.seeker, e.provider, e.amount, e.status, e.createdAt);
    }
}
