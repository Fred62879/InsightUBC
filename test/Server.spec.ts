import Server from "../src/rest/Server";

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

    // Sample on how to format PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/course/courses")
                .send( "data/courses.zip" )
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.test("");
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
