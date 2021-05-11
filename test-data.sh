echo "Minting"
npx hardhat mint --account 0 --amount 1000.00 --currency EUR

echo "Selling"
npx hardhat sell --account 0 --price 100.00 --currency EUR --volume 10

echo "Buying"
npx hardhat buy --account 0 --price 99.00 --currency EUR --balance 200

echo "Buying"
npx hardhat buy --account 0 --price 101.00 --currency EUR --balance 200

echo "Selling"
npx hardhat sell --account 0 --price 95 --currency EUR --volume 0.5

echo "Buying"
npx hardhat buy --account 0 --price 101.01 --currency EUR --balance 101.01

echo "Selling"
npx hardhat sell --account 0 --price 105 --currency EUR --volume 0.5

echo "Selling"
npx hardhat sell --account 0 --price 85 --currency EUR --volume 0.1

echo "Buying"
npx hardhat buy --account 0 --price 80 --currency EUR --balance 800