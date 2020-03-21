import {expect} from "chai";
import * as fs from "fs-extra";
import Scheduler from "../src/scheduler/Scheduler";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

describe("Scheduler", () => {

    // let scheduler: Scheduler;
    // let rooms = [
    //     {
    //         "rooms_shortname": "AERL",
    //         "rooms_number": "120",
    //         "rooms_seats": 144,
    //         "rooms_lat": 49.26372,
    //         "rooms_lon": -123.25099
    //     },
    //     {
    //         "rooms_shortname": "ALRD",
    //         "rooms_number": "105",
    //         "rooms_seats": 94,
    //         "rooms_lat": 49.2699,
    //         "rooms_lon": -123.25318
    //     },
    //     {
    //         "rooms_shortname": "ANGU",
    //         "rooms_number": "098",
    //         "rooms_seats": 260,
    //         "rooms_lat": 49.26486,
    //         "rooms_lon": -123.25364
    //     },
    //     {
    //         "rooms_shortname": "BUCH",
    //         "rooms_number": "A101",
    //         "rooms_seats": 275,
    //         "rooms_lat": 49.26826,
    //         "rooms_lon": -123.25468
    //     }
    // ];
    // let sections = [
    //     {
    //         "courses_dept": "cpsc",
    //         "courses_id": "340",
    //         "courses_uuid": "1319",
    //         "courses_pass": 101,
    //         "courses_fail": 7,
    //         "courses_audit": 2
    //     },
    //     {
    //         "courses_dept": "cpsc",
    //         "courses_id": "340",
    //         "courses_uuid": "3397",
    //         "courses_pass": 171,
    //         "courses_fail": 3,
    //         "courses_audit": 1
    //     },
    //     {
    //         "courses_dept": "cpsc",
    //         "courses_id": "344",
    //         "courses_uuid": "62413",
    //         "courses_pass": 93,
    //         "courses_fail": 2,
    //         "courses_audit": 0
    //     },
    //     {
    //         "courses_dept": "cpsc",
    //         "courses_id": "344",
    //         "courses_uuid": "72385",
    //         "courses_pass": 43,
    //         "courses_fail": 1,
    //         "courses_audit": 0
    //     }
    // ];
    //
    //
    //
    // before(function () {
    //     scheduler = new Scheduler();
    // });
    //
    // beforeEach(function () {
    //     Log.test(`BeforeTest: ${this.currentTest.title}`);
    // });
    //
    // after(function () {
    //     Log.test(`After: ${this.test.parent.title}`);
    // });
    //
    // afterEach(function () {
    //     Log.test(`AfterTest: ${this.currentTest.title}`);
    // });
    //
    // // Dynamically create and run a test for each query in testQueries.
    // // Creates an extra "test" called "Should run test queries" as a byproduct.
    // it("Should run test queries", function () {
    //     describe("Dynamic InsightFacade PerformQuery tests", function () {
    //         let result = scheduler.schedule(sections,rooms);
    //
    //         expect(result).to.deep.equal(1);
    //
    //     });
    // });
});


