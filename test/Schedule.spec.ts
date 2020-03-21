import {expect} from "chai";
import * as fs from "fs-extra";
import {IScheduler} from "../src/scheduler/IScheduler";
import Scheduler from "../src/scheduler/Scheduler";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */

describe("InsightFacade PerformQuery", () => {

    // let scheduler: Scheduler;
    // let testQueries: ITestQuery[] = [];
    // let rooms = [
    //     {
    //         "rooms_shortname": "AERL",
    //         "rooms_number": "120",
    //         "rooms_seats": 144,
    //         "rooms_lat": 49,
    //         "rooms_lon": -123
    //     },
    //     {
    //         "rooms_shortname": "ALRD",
    //         "rooms_number": "105",
    //         "rooms_seats": 94,
    //         "rooms_lat": 48,
    //         "rooms_lon": -122
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
    // // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
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
    //         scheduler.schedule(sections,rooms);
    //         let distance = scheduler.getDistance(rooms[0],rooms[1]);
    //         Log.test(distance*1372);
    //         expect(distance*1372).to.deep.equal(1);
    //
    //     });
    // });
});


