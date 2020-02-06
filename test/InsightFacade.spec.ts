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

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        // Yu's tests
        courses: "./test/data/courses.zip",
        onlyOneValidSection: "./test/data/onlyOneValidSection.zip",
        courses1: "./test/data/courses1.zip",
        cpsc1100: "./test/data/cpsc1100.zip",
        cpsc1100ButBroken: "./test/data/cpsc1100ButBroken.zip",
        cpsc1100ButNoSection: "./test/data/cpsc1100ButNoSection.zip",
        invalidFolder: "./test/data/invalidFolder.zip",
        Not_Valid: "./test/data/Not_Valid.zip",
        ValidAndInvalidFile: "./test/data/ValidAndInvalidFile.zip",
        validAndInvalidFolders: "./test/data/validAndInvalidFolders.zip",
        room: "./test/data/room.zip",
        coursesdirIncourseDir: "./test/data/coursesdirIncourseDir.zip",
        nestedcourse: "./test/data/nestedcourse.zip",
        empryField: "./test/data/empryField.zip",
        // duplicateSection: "./test/data/duplicateSection.zip",
        // duplicateTierEightyFiveField: "./test/data/duplicateTierEightyFiveField.zip",
        // excessiveKey: "./test/data/excessiveKey.zip",
        // invalidElementInResultArray: "./test/data/invalidElementInResultArray.zip",
        // invalidSectionValue: "./test/data/invalidSectionValue.zip",
        // invalidTierEightyfiveValue: "./test/data/invalidTierEightyfiveValue.zip",
        // invalidYear: "./test/data/invalidYear.zip",
        // missingTierEightyFiveField: "./test/data/missingTierEightyFiveField.zip",
        // negativeStddev: "./test/data/negativeStddev.zip",
        noKeyResult: "./test/data/noKeyResult.zip",
        random: "./test/data/random.zip",
        resultAsObject: "./test/data/resultAsObject.zip",
        // sameCourseDifferentTitle: "./test/data/sameCourseDifferentTitle.zip",
        emptyCoursesFolder: "./test/data/emptyCoursesFolder.zip",
        encrypted: "./test/data/encrypted.zip",
        emptyArrayInJson: "./test/data/emptyArrayInJson.zip",
        emptyObjectInJson: "./test/data/emptyObjectInJson.zip",
        emptyZip: "./test/data/emptyZip.zip",
        noValidSection: "./test/data/noValidSection.zip",
        courses1InvalidDir: "./test/data/courses1InvalidDir.zip",
        // Fred's tests
        // valid datasets and id
        coursesSmall: "./test/data/coursesSmall.zip",
        // id invalid
        wrong_id: "./test/data/courses.zip",
        // " ": "./test/data/courses.zip",
        // file invalid
        wrongFileType: "./test/data/textFile.txt",
        mtDs: "./test/data/mtDs.zip",
        noCourseDir: "./test/data/noCourseDir.zip",
        wrongDirName: "./test/data/wrongDirName.zip",
        pdf: "./test/data/pdfInside.zip",
        noSection: "./test/data/noSection.zip",
        noAvg: "./test/data/noAvg.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!

    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a dataset with only one valid section", function () {
        const id: string = "onlyOneValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add 2 valid dataset", function () {
        const id: string = "courses";
        const id2: string = "cpsc1100";
        const expected: string[] = [id];
        const expected2: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        }).then(() => {
            return insightFacade.addDataset(id2, datasets[id], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected2);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a dataset with wrong dir name", function () {
        const id: string = "invalidFolder";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "should not have accepted");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("addDataset should reject dataset with invalid folder", () => {
        const id: string = "cpsc1100ButNoSection";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid folder");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    // https://piazza.com/class/k4svpbqwszi20c?cid=465
    it("addDataset should resolve dataset with courses in courses dir", () => {
        const id: string = "coursesdirIncourseDir";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });
    it("addDataset should reject dataset with courses dir nested in random dir", () => {
        const id: string = "nestedcourse";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject courses dir nested in random dir");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject dataset with empryField", () => {
        const id: string = "empryField";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject courses empryField");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject null ID", () => {
        const id: string = "courses";
        return insightFacade.addDataset(null, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject null id");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject dataset room type", () => {
        const id: string = "room";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset type room");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject dataset with no valid section", () => {
        const id: string = "noValidSection";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "addDataset should reject dataset with no valid section");
        }).catch((err: any) => {
            Log.trace(err);
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject dataset without courses dir", () => {
        const id: string = "courses1InvalidDir";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "addDataset should reject dataset with no courses dir");
        }).catch((err: any) => {
            Log.trace(err);
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should resolve dataset with 1 valid file", () => {
        const id: string = "ValidAndInvalidFile";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal([id]);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, "err", "should resolve dataset with 1 valid file");
        });
    });

    it("addDataset should resolve dataset with 1 valid folder", () => {
        const id: string = "validAndInvalidFolders";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal([id]);
        }).catch((err: any) => {
            Log.trace(err);
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject dataset that is a random string", () => {
        const id: string = "randomString";
        return insightFacade.addDataset(id, "something", InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            Log.trace(typeof err);
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject dataset with emptyArrayInJson", () => {
        const id: string = "emptyArrayInJson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject dataset with emptyObjectInJson", () => {
        const id: string = "emptyObjectInJson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject dataset with emptyZip", () => {
        const id: string = "emptyZip";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject dataset with invalid field", () => {
        const id: string = "cpsc1100ButBroken";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject dataset with random", () => {
        const id: string = "random";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject dataset with resultAsObject", () => {
        const id: string = "resultAsObject";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });


    it("addDataset should reject dataset with noKeyResult", () => {
        const id: string = "noKeyResult";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject dataset with invalid field");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject id that does not exist", () => {
        const id: string = "doNotExist";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject id that does not exist");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject encrypted dataset", () => {
        const id: string = "encrypted";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject id that does not exist");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject emptyCoursesFolder", () => {
        const id: string = "emptyCoursesFolder";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject id that does not exist");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("addDataset should reject id that contains underscore", () => {
        const id: string = "Not_Valid";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject id that contains underscore");
        }).catch((err: any) => {
            expect(err.toString()).to.deep.equal("Error: addDataset Invalid ID");
        });
    });
    it("removeDataset should reject id that contains underscore", () => {
        const id: string = "Not_Valid";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, "err", "Should reject id that contains underscore");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("addDataset should reject id that only contains spaces", () => {
        const id: string = "  ";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, "err", "Should reject id that only contains spaces");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });

    it("removeDataset should reject id that only contains spaces", () => {
        const id: string = "  ";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, "err", "Should reject id that only contains spaces");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });
    });
    it("Should reject a duplicate id", function () {
        const id: string = "courses";
        const id2: string = "courses1";
        // const expected: string[] = [id];
        const expected2: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected2);
        }).then(() => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            expect.fail(result, "err", "Should reject a duplicate id");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });

    });
    it("Should reject a duplicate id v2", function () {
        const id: string = "courses";
        const id2: string = "courses1";
        // const expected: string[] = [id];
        const expected2: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            // expect(result).to.deep.equal(expected2);
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            // expect.fail(result, "err", "Should reject a duplicate id");
        }).catch((err: any) => {
            expect(err).to.exist.and.be.an.instanceOf(InsightError);
        });

    });

    it("Should remove an added dataset", () => {
        const id: string = "courses1";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            expect(result).to.deep.equal(id);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, id, "Should have removed");
        });
    });

    it("Should remove an added dataset v2", () => {
        const id: string = "courses1";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            // expect(result).to.deep.equal(expected);
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            expect(result).to.deep.equal(id);
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            expect.fail(id, "err", "should reject an id that does not exist");
        }).catch((err: any) => expect(err).to.exist.and.be.an.instanceOf(NotFoundError));
    });

    it("Should reject removing a dataset that does not exist", () => {
        const id: string = "doNotExist";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(id, "err", "should reject an id that does not exist");
        }).catch((err: any) => {
            Log.trace(err);
            expect(err).to.exist.and.be.an.instanceOf(NotFoundError);
        });
    });


    it("Should list all the added dataset v2", () => {
        const id0: string = "courses";
        const id1: string = "courses1";
        return insightFacade.addDataset(id0, datasets[id0], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((insightDatasets: InsightDataset[]) => {
            expect(insightDatasets[0].id).to.deep.equal(id0);
            expect(insightDatasets[0].kind).to.deep.equal("courses");
            expect(insightDatasets[0].numRows).to.deep.equal(64612);
            return insightFacade.removeDataset(id0);
        }).then((result: string) => {
            return insightFacade.listDatasets();
        }).then((insightDatasets: InsightDataset[]) => {
            expect(insightDatasets[0].id).to.deep.equal(id1);
            expect(insightDatasets[0].kind).to.deep.equal("courses");
            expect(insightDatasets[0].numRows).to.deep.equal(64612);
            return insightFacade.removeDataset(id1);
        }).then((result: string) => {
            return insightFacade.listDatasets();
        }).then((insightDatasets: InsightDataset[]) => {
            expect(insightDatasets).to.deep.equal([]);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, "", "Should always resolve");
        });
    });


    // Fred's tests
    it("Should add one dataset - courses", function () {
        const id: string = "courses";
        let expected2 = [id];
        let addedInsightDS2 = [{id: id, numRows: 64612, kind: InsightDatasetKind.Courses}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected2);
            return insightFacade.listDatasets();
        }).then((result2: InsightDataset[]) => {
            expect(result2).to.deep.equal(addedInsightDS2);
        }).catch((err: any) => {
            expect.fail(err, expected2, "Should not have rejected");
        });
    });

    it("Should add courses two times", function () {
        const id: string = "courses";
        // expected.push(id);
        // addedInsightDS.push({ id: id, numRows: 64612, kind: InsightDatasetKind.Courses });
        return insightFacade.addDataset("courses", datasets["courses"],
            InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset("courses", datasets["courses"], InsightDatasetKind.Courses);
        }).then((result2: string[]) => {
            expect.fail(result2, InsightError, "Should not have accepted");
        }).catch((err: any) => {
            expect(err).to.instanceOf(InsightError);
        });
    });

    // it("Should add a dataset with wrong dir name", function () {
    //     const id: string = "invalidFolder";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should reject dataset with invalid folder", () => {
    //     const id: string = "cpsc1100ButNoSection";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid folder");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should reject dataset with no valid section", () => {
    //     const id: string = "noValidSection";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "addDataset should reject dataset with no valid section");
    //     }).catch((err: any) => {
    //         Log.trace(err);
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should resolve dataset with 1 valid file", () => {
    //     const id: string = "ValidAndInvalidFile";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal([id]);
    //     }).catch((err: any) => {
    //         expect.fail(err, "err", "should resolve dataset with 1 valid file");
    //     });
    // });
    //
    // it("addDataset should resolve dataset with 1 valid folder", () => {
    //     const id: string = "validAndInvalidFolders";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal([id]);
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should reject dataset that is a random string", () => {
    //     const id: string = "randomString";
    //     return insightFacade.addDataset(id, "something", InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         Log.trace(typeof err);
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject dataset with emptyArrayInJson", () => {
    //     const id: string = "emptyArrayInJson";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject dataset with emptyObjectInJson", () => {
    //     const id: string = "emptyObjectInJson";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject dataset with emptyZip", () => {
    //     const id: string = "emptyZip";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject dataset with invalid field", () => {
    //     const id: string = "cpsc1100ButBroken";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should reject dataset with random", () => {
    //     const id: string = "random";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject dataset with resultAsObject", () => {
    //     const id: string = "resultAsObject";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    //
    // it("addDataset should reject dataset with noKeyResult", () => {
    //     const id: string = "noKeyResult";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject dataset with invalid field");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should reject id that does not exist", () => {
    //     const id: string = "doNotExist";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject id that does not exist");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject encrypted dataset", () => {
    //     const id: string = "encrypted";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject id that does not exist");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject emptyCoursesFolder", () => {
    //     const id: string = "emptyCoursesFolder";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject id that does not exist");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("addDataset should reject id that contains underscore", () => {
    //     const id: string = "Not_Valid";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject id that contains underscore");
    //     }).catch((err: any) => {
    //         expect(err.toString()).to.deep.equal("Error: addDataset Invalid ID");
    //     });
    // });
    // it("removeDataset should reject id that contains underscore", () => {
    //     const id: string = "Not_Valid";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         expect.fail(result, "err", "Should reject id that contains underscore");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("addDataset should reject id that only contains spaces", () => {
    //     const id: string = "  ";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject id that only contains spaces");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    //
    // it("removeDataset should reject id that only contains spaces", () => {
    //     const id: string = "  ";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         expect.fail(result, "err", "Should reject id that only contains spaces");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("Should reject a duplicate id", function () {
    //     const id: string = "courses";
    //     const id2: string = "courses1";
    //     // const expected: string[] = [id];
    //     const expected2: string[] = [id, id2];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
    //     }).then((result: string[]) => {
    //         expect(result).to.deep.equal(expected2);
    //     }).then(() => {
    //         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     }).then((result: string[]) => {
    //         expect.fail(result, "err", "Should reject a duplicate id");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    //
    // });
    // it("Should reject a duplicate id v2", function () {
    //     const id: string = "courses";
    //     const id2: string = "courses1";
    //     // const expected: string[] = [id];
    //     const expected2: string[] = [id, id2];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
    //     }).then((result: string[]) => {
    //         // expect(result).to.deep.equal(expected2);
    //         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     }).then((result: string[]) => {
    //         // expect.fail(result, "err", "Should reject a duplicate id");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(InsightError);
    //     });
    //
    // });
    //
    // it("Should remove an added dataset", () => {
    //     const id: string = "courses1";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         // expect(result).to.deep.equal(expected);
    //     }).then(() => {
    //         insightFacade.removeDataset(id).then((result: string) => {
    //             expect(result).to.deep.equal(id);
    //         });
    //     }).catch((err: any) => expect.fail(err, id, "Should have removed"));
    // });
    //
    // it("Should remove an added dataset v2", () => {
    //     const id: string = "courses1";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         // expect(result).to.deep.equal(expected);
    //         return insightFacade.removeDataset(id);
    //     }).then((result: string) => {
    //         expect(result).to.deep.equal(id);
    //     }).catch((err: any) => expect.fail(err, id, "Should have removed"));
    // });
    //
    // it("Should reject removing a dataset that does not exist", () => {
    //     const id: string = "courses";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         expect.fail(id, "err", "should reject an id that does not exist");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(NotFoundError);
    //     });
    // });
    //
    //
    // it("Should list all the added dataset v2", () => {
    //     const id0: string = "courses";
    //     const id1: string = "courses1";
    //     return insightFacade.addDataset(id0, datasets[id0], InsightDatasetKind.Courses).then((result: string[]) => {
    //         return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
    //     }).then((result: string[]) => {
    //         return insightFacade.listDatasets();
    //     }).then((insightDatasets: InsightDataset[]) => {
    //         expect(insightDatasets[0].id).to.deep.equal(id0);
    //         expect(insightDatasets[0].kind).to.deep.equal("courses");
    //         expect(insightDatasets[0].numRows).to.deep.equal(64612);
    //         return insightFacade.removeDataset(id0);
    //     }).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((insightDatasets: InsightDataset[]) => {
    //         expect(insightDatasets[0].id).to.deep.equal(id1);
    //         expect(insightDatasets[0].kind).to.deep.equal("courses");
    //         expect(insightDatasets[0].numRows).to.deep.equal(64612);
    //         return insightFacade.removeDataset(id1);
    //     }).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((insightDatasets: InsightDataset[]) => {
    //         expect(insightDatasets).to.deep.equal([]);
    //     }).catch((err: any) => {
    //         Log.trace(err);
    //         expect.fail(err, "", "Should always resolve");
    //     });
    // });
    //
    //
    // // Fred's tests
    // it("Should add one dataset - courses", function () {
    //     const id: string = "courses";
    //     let expected2 = [id];
    //     let addedInsightDS2 = [{id: id, numRows: 64612, kind: InsightDatasetKind.Courses}];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal(expected2);
    //         return insightFacade.listDatasets();
    //     }).then((result2: InsightDataset[]) => {
    //         expect(result2).to.deep.equal(addedInsightDS2);
    //     }).catch((err: any) => {
    //         expect.fail(err, expected2, "Should not have rejected");
    //     });
    // });
    //
    // it("Should add courses two times", function () {
    //     const id: string = "courses";
    //     // expected.push(id);
    //     // addedInsightDS.push({ id: id, numRows: 64612, kind: InsightDatasetKind.Courses });
    //     return insightFacade.addDataset("courses", datasets["courses"],
    //         InsightDatasetKind.Courses).then((result: string[]) => {
    //         return insightFacade.addDataset("courses", datasets["courses"], InsightDatasetKind.Courses);
    //     }).then((result2: string[]) => {
    //         expect.fail(result2, InsightError, "Should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.instanceOf(InsightError);
    //     });
    // });
    //
    it("Should add courses two times while re-ini insight in between", function () {
        const id: string = "courses";
        let expected2 = [id];
        let addedInsightDS2 = [{id: id, numRows: 64612, kind: InsightDatasetKind.Courses}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal([id]);
            insightFacade = new InsightFacade();
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((result2: string[]) => {
            expect(result2).to.deep.equal([id]);
            return insightFacade.listDatasets();
        }).then((result3: InsightDataset[]) => {
            expect(result3).to.deep.equal([{id: id, numRows: 64612, kind: InsightDatasetKind.Courses}]);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, [id], "Should not have rejected");
        });
    });

    /*
    it("Should add two diff valid dss", function () {
        let expected2 = ["courses", "coursesSmall"];
        let addedInsightDS1: any[] = [];
        addedInsightDS1.push({id: "courses", numRows: 64612, kind: InsightDatasetKind.Courses});
        addedInsightDS1.push({id: "coursesSmall", numRows: 4, kind: InsightDatasetKind.Courses});
        return insightFacade.addDataset("courses", datasets["courses"],
            InsightDatasetKind.Courses).then((result: string[]) => {
            Log.test(0);
            return insightFacade.addDataset("coursesSmall", datasets["coursesSmall"], InsightDatasetKind.Courses);
        }).then((result2: string[]) => {
            Log.test(1);
            expect(result2).to.deep.equal(["courses", "coursesSmall"]);
            return insightFacade.listDatasets();
        }).then((result3: InsightDataset[]) => {
            Log.test(2);
            expect(result3).to.deep.equal(addedInsightDS1);
        }).catch((err: any) => {
            Log.test(3);
            Log.trace(err);
            expect.fail(err, expected2, "Should not have rejected");
        });
    });
     */

    // it("Should add then remove courses", function () {
    //     const id: string = "courses";
    //     // expected.push(id);
    //     // addedInsightDS.push({ id: id, numRows: 64612, kind: InsightDatasetKind.Courses });
    //     return insightFacade.addDataset("courses", datasets["courses"],
    //         InsightDatasetKind.Courses).then((result: string[]) => {
    //         return insightFacade.removeDataset("courses");
    //     }).then((result2: string) => {
    //         expect(result2).to.deep.equal("courses");
    //     }).catch((err: any) => {
    //         expect.fail(err, [id], "Should not have rejected");
    //     });
    // });
    //
    // it("Should add then remove courses and add again", function () {
    //     const id: string = "courses";
    //     let expected2 = [id];
    //     let addedInsightDS2 = [{id: id, numRows: 64612, kind: InsightDatasetKind.Courses}];
    //     return insightFacade.addDataset("courses", datasets["courses"],
    //         InsightDatasetKind.Courses).then((result: string[]) => {
    //         return insightFacade.removeDataset("courses");
    //     }).then((result2: string) => {
    //         expect(result2).to.deep.equal("courses");
    //         return insightFacade.addDataset("courses", datasets["courses"],
    //             InsightDatasetKind.Courses);
    //     }).then((result3: string[]) => {
    //         expect(result3).to.deep.equal(expected2);
    //     }).catch((err: any) => {
    //         expect.fail(err, expected2, "Should not have rejected");
    //     });
    // });
    //
    //
    // // invalid id
    // it("should add id with underscore", function () {
    //     const id: string = "underscore_here";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "Should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("should add id being all spaces", function () {
    //     const id: string = "  ";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "", "Should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // // for invalid datasets
    // it("Should add a dataset of wrong filetype", function () {
    //     const id: string = "wrongFileType";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("Should add an empty dataset", function () {
    //     const id: string = "mtDs";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("Should add a dataset without courses directory", function () {
    //     const id: string = "noCourseDir";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("Should add a dataset with wrong dir name", function () {
    //     const id: string = "wrongDirName";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("Should add a dataset with a single pdf file inside", function () {
    //     const id: string = "pdf";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("Should add a dataset with no valid sections", function () {
    //     const id: string = "noSection";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("Should add a dataset with no average field", function () {
    //     const id: string = "noAvg";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail(result, "should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // // remove invalid datasets
    // it("should remove dataset not added yet", function () {
    //     const id: string = "not-added";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         expect.fail(result, "", "Should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(NotFoundError);
    //     });
    // });
    //
    // it("should remove id with underscore", function () {
    //     const id: string = "underscore_here";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         expect.fail(result, "Should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    //
    // it("should remove id being all spaces", function () {
    //     const id: string = "  ";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         expect.fail(result, "", "Should not have accepted");
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });


    // Local tests
    // it("Should list all cached dataset", () => {
    //     return insightFacade.listDatasets().then((insightDatasets: InsightDataset[]) => {
    //         expect(insightDatasets[0].id).to.deep.equal("110");
    //         expect(insightDatasets[0].kind).to.deep.equal("courses");
    //         expect(insightDatasets[0].numRows).to.deep.equal(119);
    //     }).catch((err: any) => {
    //         Log.trace(err);
    //         expect.fail(err, "", "Should always resolve");
    //     });
    // });
    //
    // it("Should reject removing a dataset that does not exist", () => {
    //     const id: string = "courses";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
    //         return insightFacade.removeDataset(id);
    //     }).then((result: string) => {
    //         expect(result).to.deep.equal(id);
    //         return insightFacade.removeDataset(id);
    //     }).then((result: string) => {
    //         expect.fail(id, "err", "should reject an id that does not exist");
    //     }).catch((err: any) => {
    //         expect(err).to.exist.and.be.an.instanceOf(NotFoundError);
    //     });
    // });

});

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
            loadDatasetPromises.push(deleteCacheFile(id).then(() => insightFacade.addDataset(id, data, ds.kind)));
            // loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
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
                        // Log.test(test.filename);
                        // reformatTest(test, result);
                        // Log.test(result.length);
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});

// This function generate query json test files. Result is populated using our perform query result.
// const reformatTest = (test: any, result: any) => {
//     let filename = test.filename;
//     delete test.filename;
//     test.result = result;
//     let jsonString = JSON.stringify(test);
//     let path = "./test/" + filename;
//     fs.writeFile("./test/" + filename, jsonString).catch((err) => {
//         Log.trace(err);
//     });
// };
function deleteCacheFile(id: string): Promise<boolean> {
    return fs.unlink("./data/" + id + ".json").then(() => {
        return Promise.resolve(true);
    }).catch((err) => {
        return Promise.resolve(err);
    });
}
