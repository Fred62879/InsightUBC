import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {consoleTestResultHandler} from "tslint/lib/test";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}


// describe("InsightFacade Add/Remove Dataset", function () {
//     // Reference any datasets you've added to test/data here and they will
//     // automatically be loaded in the 'before' hook.
//     const datasetsToLoad: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         courses1: "./test/data/courses1.zip",
//         cpsc1100: "./test/data/cpsc1100.zip",
//         cpsc1100ButBroken: "./test/data/cpsc1100ButBroken.zip",
//         cpsc1100ButNoSection: "./test/data/cpsc1100ButNoSection.zip",
//         invalidFolder: "./test/data/invalidFolder.zip",
//         Not_Valid: "./test/data/Not_Valid.zip",
//         ValidAndInvalidFile: "./test/data/ValidAndInvalidFile.zip",
//         validAndInvalidFolders: "./test/data/validAndInvalidFolders.zip",
//         duplicateSection: "./test/data/duplicateSection.zip",
//         duplicateTierEightyFiveField: "./test/data/duplicateTierEightyFiveField.zip",
//         excessiveKey: "./test/data/excessiveKey.zip",
//         invalidElementInResultArray: "./test/data/invalidElementInResultArray.zip",
//         invalidSectionValue: "./test/data/invalidSectionValue.zip",
//         invalidTierEightyfiveValue: "./test/data/invalidTierEightyfiveValue.zip",
//         invalidYear: "./test/data/invalidYear.zip",
//         missingTierEightyFiveField: "./test/data/missingTierEightyFiveField.zip",
//         negativeStddev: "./test/data/negativeStddev.zip",
//         noKeyResult: "./test/data/noKeyResult.zip",
//         random: "./test/data/random.zip",
//         resultAsObject: "./test/data/resultAsObject.zip",
//         sameCourseDifferentTitle: "./test/data/sameCourseDifferentTitle.zip",
//         emptyCoursesFolder: "./test/data/emptyCoursesFolder.zip",
//         encrypted: "./test/data/encrypted.zip",
//         emptyArrayInJson: "./test/data/emptyArrayInJson.zip",
//         emptyObjectInJson: "./test/data/emptyObjectInJson.zip",
//         emptyZip: "./test/data/emptyZip.zip",
//
//     };
//     let datasets: { [id: string]: string } = {};
//     let insightFacade: InsightFacade;
//     const cacheDir = __dirname + "/../data";
//
//     before(function () {
//         // This section runs once and loads all datasets specified in the datasetsToLoad object
//         // into the datasets object
//         Log.test(`Before all`);
//         for (const id of Object.keys(datasetsToLoad)) {
//             datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
//         }
//     });
//
//     beforeEach(function () {
//         // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
//         // This runs before each test, which should make each test independent from the previous one
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//         try {
//             fs.removeSync(cacheDir);
//             fs.mkdirSync(cacheDir);
//             insightFacade = new InsightFacade();
//         } catch (err) {
//             Log.error(err);
//         }
//     });
//
//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//     });
//
//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });
//
//     // This is a unit test. You should create more like this!
//     it("Should add a valid dataset", function () {
//         const id: string = "courses";
//         const expected: string[] = [id];
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect(result).to.deep.equal(expected);
//         }).catch((err: any) => {
//             expect.fail(err, expected, "Should not have rejected");
//         });
//
//     });
//
//     it("addDataset should reject empty dataset", () => {
//         const id: string = "cpsc1100ButNoSection";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject empty dataset");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//     it("addDataset should reject dataset with invalid folder", () => {
//         const id: string = "cpsc1100ButNoSection";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid folder");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//     it("addDataset should resolve dataset with 1 valid file", () => {
//         const id: string = "ValidAndInvalidFile";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect(result).to.deep.equal([id]);
//         }).catch((err: any) => {
//             expect.fail(err, "err", "should resolve dataset with 1 valid file");
//         });
//     });
//
//     it("addDataset should resolve dataset with 1 valid folder", () => {
//         const id: string = "validAndInvalidFolders";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect(result).to.deep.equal([id]);
//         }).catch((err: any) => {
//             expect.fail(err, "err", "should resolve dataset with 1 valid folder");
//         });
//     });
//
//     it("addDataset should reject dataset that is a random string", () => {
//         const id: string = "randomString";
//         return insightFacade.addDataset(id, "something", InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             Log.trace(typeof err);
//             expect(err.toString()).to.deep.equal("Error: Invalid base64 input, bad content length.");
//         });
//     });
//     it("addDataset should reject dataset with emptyArrayInJson", () => {
//         const id: string = "emptyArrayInJson";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject dataset with emptyObjectInJson", () => {
//         const id: string = "emptyObjectInJson";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject dataset with emptyZip", () => {
//         const id: string = "emptyZip";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject dataset with invalid field", () => {
//         const id: string = "cpsc1100ButBroken";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject dataset with invalid field", () => {
//         const id: string = "cpsc1100ButBroken";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject dataset with invalid field", () => {
//         const id: string = "cpsc1100ButBroken";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//
//     it("addDataset should reject dataset with random", () => {
//         const id: string = "random";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject dataset with resultAsObject", () => {
//         const id: string = "resultAsObject";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//
//     it("addDataset should reject dataset with noKeyResult", () => {
//         const id: string = "noKeyResult";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject dataset with invalid field");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//     it("addDataset should reject id that does not exist", () => {
//         const id: string = "doNotExist";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject id that does not exist");
//         }).catch((err: any) => {
//             expect(err.toString()).to.deep.equal(
//                 "Error: Can't read the data of 'the loaded zip file'." +
//                 " Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?");
//         });
//     });
//     it("addDataset should reject encrypted dataset", () => {
//         const id: string = "encrypted";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject id that does not exist");
//         }).catch((err: any) => {
//             expect(err.toString()).to.deep.equal("Error: Encrypted zip are not supported");
//         });
//     });
//     it("addDataset should reject emptyCoursesFolder", () => {
//         const id: string = "emptyCoursesFolder";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject id that does not exist");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//
//     it("addDataset should reject id that contains underscore", () => {
//         const id: string = "Not_Valid";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject id that contains underscore");
//         }).catch((err: any) => {
//             expect(err.toString()).to.deep.equal("Error: addDataset Invalid ID");
//         });
//     });
//
//     it("removeDataset should reject id that contains underscore", () => {
//         const id: string = "Not_Valid";
//         return insightFacade.removeDataset(id).then((result: string) => {
//             expect.fail(result, "err", "Should reject id that contains underscore");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("addDataset should reject id that only contains spaces", () => {
//         const id: string = "  ";
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             expect.fail(result, "err", "Should reject id that only contains spaces");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//
//     it("removeDataset should reject id that only contains spaces", () => {
//         const id: string = "  ";
//         return insightFacade.removeDataset(id).then((result: string) => {
//             expect.fail(result, "err", "Should reject id that only contains spaces");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//     });
//     it("Should reject a duplicate id", function () {
//         const id: string = "courses";
//         const id2: string = "courses1";
//         // const expected: string[] = [id];
//         const expected2: string[] = [id, id2];
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
//         }).then((result: string[]) => {
//             // expect(result).to.deep.equal(expected2);
//         }).then(() => {
//             return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         }).then((result: string[]) => {
//             // expect.fail(result, "err", "Should reject a duplicate id");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//
//     });
//
//     it("Should reject a duplicate id v2", function () {
//         const id: string = "courses";
//         const id2: string = "courses1";
//         // const expected: string[] = [id];
//         const expected2: string[] = [id, id2];
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
//         }).then((result: string[]) => {
//             // expect(result).to.deep.equal(expected2);
//             return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         }).then((result: string[]) => {
//             // expect.fail(result, "err", "Should reject a duplicate id");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(InsightError);
//         });
//
//     });
//
//     it("Should remove an added dataset", () => {
//         const id: string = "courses1";
//         const expected: string[] = [id];
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             // expect(result).to.deep.equal(expected);
//         }).then(() => {
//             insightFacade.removeDataset(id).then((result: string) => {
//                 expect(result).to.deep.equal(id);
//             });
//         }).catch((err: any) => expect.fail(err, id, "Should have removed"));
//     });
//
//     it("Should remove an added dataset v2", () => {
//         const id: string = "courses1";
//         const expected: string[] = [id];
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//             // expect(result).to.deep.equal(expected);
//             return insightFacade.removeDataset(id);
//         }).then((result: string) => {
//             expect(result).to.deep.equal(id);
//         }).catch((err: any) => expect.fail(err, id, "Should have removed"));
//     });
//
//     it("Should reject removing a dataset that does not exist", () => {
//         const id: string = "courses";
//         return insightFacade.removeDataset(id).then((result: string) => {
//             expect.fail(id, "err", "should reject an id that does not exist");
//         }).catch((err: any) => {
//             expect(err).to.exist.and.be.an.instanceOf(NotFoundError);
//         });
//     });
//
//     it("Should list all the added dataset", () => {
//         const id0: string = "courses";
//         const id1: string = "courses1";
//         return insightFacade.addDataset(id0, datasets[id0], InsightDatasetKind.Courses).then((result: string[]) => {
//             return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
//         }).then((result: string[]) => {
//             return insightFacade.listDatasets();
//         }).then((insightDatasets: InsightDataset[]) => {
//             // expect(insightDatasets[0].id).to.deep.equal(id0);
//             // expect(insightDatasets[0].kind).to.deep.equal("courses");
//             // expect(insightDatasets[0].numRows).to.deep.equal("200");
//         }).then(() => {
//             return insightFacade.removeDataset(id0);
//         }).then((result: string) => {
//             return insightFacade.listDatasets();
//         }).then((insightDatasets: InsightDataset[]) => {
//             // expect(insightDatasets[0].id).to.deep.equal(id1);
//             // expect(insightDatasets[0].kind).to.deep.equal("courses");
//             // expect(insightDatasets[0].numRows).to.deep.equal("200");
//         }).then(() => {
//             return insightFacade.removeDataset(id1);
//         }).then((result: string) => {
//             return insightFacade.listDatasets();
//         }).then((insightDatasets: InsightDataset[]) => {
//             expect(insightDatasets).to.deep.equal([]);
//         }).catch((err: any) => {
//             expect.fail(err, "", "Should always resolve");
//         });
//     });
//
//     it("Should list all the added dataset v2", () => {
//         const id0: string = "courses";
//         const id1: string = "courses1";
//         return insightFacade.addDataset(id0, datasets[id0], InsightDatasetKind.Courses).then((result: string[]) => {
//             return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
//         }).then((result: string[]) => {
//             return insightFacade.listDatasets();
//         }).then((insightDatasets: InsightDataset[]) => {
//             expect(insightDatasets[0].id).to.deep.equal(id0);
//             expect(insightDatasets[0].kind).to.deep.equal("courses");
//             expect(insightDatasets[0].numRows).to.deep.equal(64612);
//             return insightFacade.removeDataset(id0);
//         }).then((result: string) => {
//             return insightFacade.listDatasets();
//         }).then((insightDatasets: InsightDataset[]) => {
//             expect(insightDatasets[0].id).to.deep.equal(id1);
//             expect(insightDatasets[0].kind).to.deep.equal("courses");
//             expect(insightDatasets[0].numRows).to.deep.equal(64612);
//             return insightFacade.removeDataset(id1);
//         }).then((result: string) => {
//             return insightFacade.listDatasets();
//         }).then((insightDatasets: InsightDataset[]) => {
//             expect(insightDatasets).to.deep.equal([]);
//         }).catch((err: any) => {
//             Log.trace(err);
//             expect.fail(err, "", "Should always resolve");
//         });
//     });
// });


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        Log.test(test.filename);
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        Log.test(err);
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
