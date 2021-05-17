import { ethers } from "hardhat";
import { Contract } from "ethers";
import {expect} from "chai";
import {deploySortedLibrary} from "../deployment/sorted";
import {TSortedTest} from "../contracts/sorted-test";

describe("SortedTest", function() {
    let sorted: Contract;
    let sortedTest: TSortedTest;

    before(async function () {
        sorted = await deploySortedLibrary(ethers);
    });

    beforeEach(async function () {
        const SortedTest = await ethers.getContractFactory(
            "SortedTest", {
                libraries: {
                    "Sorted": sorted.address
                }
            }
        )
        sortedTest = await SortedTest.deploy() as any
        await sortedTest.deployed();
    });

    it("Should return zero as length of empty list", async function () {
        expect(await sortedTest.all()).deep.eq([]);
        expect(await sortedTest.length()).eq(0);
    });

    it("Should return one as length of single entry list", async function () {
        await sortedTest.insert(0, "Zero", true);

        expect(await sortedTest.all()).deep.eq(["Zero"]);
        expect(await sortedTest.length()).eq(1);
    });

    it("Should return all entries in correct order", async function () {
        await sortedTest.insert(2, "Two", true);
        await sortedTest.insert(0, "Zero", true);
        await sortedTest.insert(1, "One", true);
        await sortedTest.insert(3, "Three", true);

        expect(await sortedTest.all()).deep.eq(["Zero", "One", "Two", "Three"]);
        expect(await sortedTest.length()).eq(4)
    });

    it("Should return all entries in correct order after removing first", async function () {
        await sortedTest.insert(2, "Two", true);
        await sortedTest.removeFirst();
        await sortedTest.insert(0, "Zero", true);
        await sortedTest.insert(1, "One", true);
        await sortedTest.removeFirst();
        await sortedTest.insert(3, "Three", true);

        expect(await sortedTest.all()).deep.eq(["One", "Three"]);
        expect(await sortedTest.length()).eq(2)
    });

    it("Should return all entries in correct order after removing some (using removeAt)", async function () {
        await sortedTest.insert(2, "Two", true);
        await sortedTest.insert(0, "Zero", true);
        await sortedTest.insert(1, "One", true); // offset: 1
        await sortedTest.insert(3, "Three", true);
        await sortedTest.removeAt(1);

        expect(await sortedTest.all()).deep.eq(["Zero", "Two", "Three"]);
        expect(await sortedTest.length()).eq(3)
    });

    it("Should return all entries in correct order after removing some (using remove)", async function () {
        await sortedTest.insert(2, "Two", true);
        await sortedTest.insert(0, "Zero", true);
        await sortedTest.insert(1, "One", true); // id: 3
        await sortedTest.insert(3, "Three", true);
        await sortedTest.remove(3);

        expect(await sortedTest.all()).deep.eq(["Zero", "Two", "Three"]);
        expect(await sortedTest.length()).eq(3)
    });
});