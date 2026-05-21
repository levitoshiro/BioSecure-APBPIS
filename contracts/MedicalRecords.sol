// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalRecords {
    struct Record {
        string cid;
        string documentHash;
        string ownerId;
        string patientName;
        uint256 timestamp;
    }

    // Mapping from record ID to Record details
    mapping(string => Record) public records;

    event RecordAdded(
        string indexed recordId,
        string cid,
        string documentHash,
        string ownerId,
        string patientName,
        uint256 timestamp
    );

    function addRecord(
        string memory _recordId,
        string memory _cid,
        string memory _documentHash,
        string memory _ownerId,
        string memory _patientName
    ) public {
        require(bytes(records[_recordId].cid).length == 0, "Record already exists");

        records[_recordId] = Record({
            cid: _cid,
            documentHash: _documentHash,
            ownerId: _ownerId,
            patientName: _patientName,
            timestamp: block.timestamp
        });

        emit RecordAdded(_recordId, _cid, _documentHash, _ownerId, _patientName, block.timestamp);
    }

    function getRecord(string memory _recordId) public view returns (
        string memory cid,
        string memory documentHash,
        string memory ownerId,
        string memory patientName,
        uint256 timestamp
    ) {
        Record memory rec = records[_recordId];
        return (rec.cid, rec.documentHash, rec.ownerId, rec.patientName, rec.timestamp);
    }
}
