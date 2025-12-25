// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin langsung dari URL GitHub (Remix support ini)
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title UserProfile x402 Edition
 * @dev Kontrak manajemen profil dengan dukungan "Gasless Transaction" via Relayer.
 */
contract UserProfile is Ownable, Pausable {

    // Mapping Address -> IPFS CID
    mapping(address => string) private userProfileCIDs;

    // Event mencatat siapa updater-nya (User sendiri atau Server/Relayer)
    event ProfileUpdated(address indexed user, string newCID, address indexed updater);

    // Constructor: Set deployer sebagai Owner (Server Anda)
    constructor() Ownable(msg.sender) {}

    /**
     * @dev FUNGSI 1: Update Mandiri (User bayar gas sendiri)
     */
    function setProfileCID(string calldata _cid) external whenNotPaused {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        userProfileCIDs[msg.sender] = _cid;
        emit ProfileUpdated(msg.sender, _cid, msg.sender);
    }

    /**
     * @dev FUNGSI 2: Relayer Update (Gasless / Server bayar gas)
     * Hanya bisa dipanggil oleh Owner (Server Backend Anda).
     */
    function setProfileCIDFor(address _user, string calldata _cid) external onlyOwner whenNotPaused {
        require(_user != address(0), "Invalid user address");
        require(bytes(_cid).length > 0, "CID cannot be empty");

        userProfileCIDs[_user] = _cid;
        // Updater direkam sebagai msg.sender (Server Address)
        emit ProfileUpdated(_user, _cid, msg.sender);
    }

    /**
     * @dev FUNGSI 3: Batch Update (Untuk efisiensi tinggi)
     */
    function setProfileCIDBatch(address[] calldata _users, string[] calldata _cids) external onlyOwner whenNotPaused {
        require(_users.length == _cids.length, "Input length mismatch");
        require(_users.length <= 100, "Batch size too large (max 100)");

        for (uint256 i = 0; i < _users.length; i++) {
            if (_users[i] != address(0) && bytes(_cids[i]).length > 0) {
                userProfileCIDs[_users[i]] = _cids[i];
                emit ProfileUpdated(_users[i], _cids[i], msg.sender);
            }
        }
    }

    /**
     * @dev Getter function
     */
    function getProfileCID(address _user) external view returns (string memory) {
        return userProfileCIDs[_user];
    }

    // --- KEAMANAN DARURAT ---
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}