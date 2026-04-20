const hre = require("hardhat");

async function main() {
  console.log("Deploying BioSecure Zero-Trust Contract...");
  
  const BioSecure = await hre.ethers.getContractFactory("BioSecure");
  const biosecure = await BioSecure.deploy();
  await biosecure.waitForDeployment();

  console.log(`✅ BioSecure Contract deployed securely to: ${biosecure.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});