// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BioSecure {
    struct Record {
        string ipfsHash;
        string biometricKeyHash;
        uint256 timestamp;
    }

    mapping(address => Record[]) private patientRecords;

    event RecordAdded(address indexed patient, string ipfsHash, uint256 timestamp);

    function addRecord(string memory _ipfsHash, string memory _biometricKeyHash) public {
        patientRecords[msg.sender].push(Record({
            ipfsHash: _ipfsHash,
            biometricKeyHash: _biometricKeyHash,
            timestamp: block.timestamp
        }));
        emit RecordAdded(msg.sender, _ipfsHash, block.timestamp);
    }

    function getRecords(address _patient) public view returns (Record[] memory) {
        return patientRecords[_patient];
    }
}