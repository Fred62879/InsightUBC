import Server from "../src/rest/Server";
import * as fs from "fs-extra";
import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    chai.use(chaiHttp);

    before(function () {
        Log.test("Before all!");
        facade = new InsightFacade();
        server = new Server(4321);
        try {
            server.start();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        server.stop();
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // PUT test
    it("PUT: add one valid dataset", function () {
        try {
            let dataset = fs.readFileSync("./test/data/courses.zip");
            return chai.request("localhost:4321")
                .put("/dataset/course/courses")
                .send(dataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // dleteCacheFile("course"); // remove cache file
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({ response: ["course"] });
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    it("PUT: add the prev dataset again - duplication", function () {
        try {
            let dataset = fs.readFileSync("./test/data/courses.zip");
            return chai.request("localhost:4321")
                .put("/dataset/course/courses")
                .send(dataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    it("PUT: add another valid dataset", function () {
        try {
            let dataset = fs.readFileSync("./test/data/cpsc1100.zip");
            return chai.request("localhost:4321")
                .put("/dataset/cpsc1100/courses")
                .send(dataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    deleteCacheFile("cpsc1100"); // remove cache file
                    deleteCacheFile("course"); // remove cache file
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({ response: ["course", "cpsc1100"] });
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    it("PUT: add an invalid dataset", function () {
        try {
            let dataset = fs.readFileSync("./test/data/invalidFolder.zip");
            return chai.request("localhost:4321")
                .put("/dataset/invalidFolder/courses")
                .send(dataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    deleteCacheFile("invalidFolder"); // remove cache file
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    // DELETE test
    it("DEL: remove a valid dataset", function () {
        try {
            return chai.request("localhost:4321")
                .del("/dataset/course")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({ response: "course" });
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    it("DEL: remove prev dataset again", function () {
        try {
            return chai.request("localhost:4321")
                .del("/dataset/course")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    it("DEL: remove invalid id (all spaces)", function () {
        try {
            return chai.request("localhost:4321")
                .del("/dataset/  ")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    it("DEL: remove invalid id (has underscore)", function () {
        try {
            return chai.request("localhost:4321")
                .del("/dataset/a_a")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message); // dataset not read properly
            expect.fail(); // not failure of server
        }
    });

    // POST tests

});

function deleteCacheFile(id: string): Promise<boolean> {
    return fs.unlink("./data/" + id + ".json").then(() => {
        return Promise.resolve(true);
    }).catch((err) => {
        return Promise.resolve(err);
    });
}
