import {expect} from "chai";
import * as fs from "fs-extra";
import Scheduler from "../src/scheduler/Scheduler";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import {SchedRoom} from "../src/scheduler/IScheduler";

describe("Scheduler", () => {
    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade;
    let scheduler: Scheduler;
    let roomsExample = [
        {
            rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 144,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
        {
            rooms_shortname: "ALRD",
            rooms_number: "105",
            rooms_seats: 94,
            rooms_lat: 49.2699,
            rooms_lon: -123.25318
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 275,
            rooms_lat: 49.26826,
            rooms_lon: -123.25468
        }
    ];
    let sectionsExample = [
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0
        }
    ];

    let roomQuery = {
        WHERE: {
            AND: [
                {
                    IS: {
                        rooms_furniture: "*Tables*"
                    }
                },
                {
                    GT: {
                        rooms_seats: 150
                    }
                }
            ]
        },
        OPTIONS: {
            COLUMNS: [
                "rooms_lon",
                "rooms_lat",
                "rooms_shortname",
                "rooms_number",
                "rooms_seats"
            ],
            ORDER: "rooms_seats"
        }
    };

    let roomQueryAll = {
        WHERE: {},
        OPTIONS: {
            COLUMNS: [
                "rooms_lon",
                "rooms_lat",
                "rooms_shortname",
                "rooms_number",
                "rooms_seats",
                "rooms_address"
            ],
            ORDER: "rooms_seats"
        }
    };

    let courseQueryLarge = {
        WHERE: {
            GT: {
                courses_avg: 89
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg",
                "courses_id",
                "courses_instructor",
                "courses_title",
                "courses_pass",
                "courses_fail",
                "courses_audit",
                "courses_uuid",
                "courses_year"
            ],
            ORDER: "courses_avg"
        }
    };
    let courseQuerySmall = {
        WHERE: {
            GT: {
                courses_avg: 98
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg",
                "courses_id",
                "courses_instructor",
                "courses_title",
                "courses_pass",
                "courses_fail",
                "courses_audit",
                "courses_uuid",
                "courses_year"
            ],
            ORDER: "courses_avg"
        }
    };


    before(function () {
        scheduler = new Scheduler();
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.readAllCacheToMemory().then(() => {
                if (!insightFacade.hasID(id)) {
                    return insightFacade.addDataset(id, data, ds.kind);
                }
            }));
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

    // Dynamically create and run a test for each query in testQueries.
    // Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Not enough room", function () {
        let roomsQueryResult: any;
        return insightFacade.performQuery(roomQuery).then((rooms) => {
            roomsQueryResult = rooms;
            return insightFacade.performQuery(courseQueryLarge);
        }).then((courses) => {
            let result = scheduler.schedule(courses, roomsQueryResult);
            let grade = scheduler.getGrade();
            Log.test(result);
            expect(grade).to.lessThan(0);
        }).catch((e) => {
            Log.trace(e);
            expect.fail(e, "0", "Large courses sample");
        });
    });

    it("More rooms", function () {
        let roomsQueryResult: any;
        return insightFacade.performQuery(roomQueryAll).then((rooms) => {
            roomsQueryResult = rooms;
            return insightFacade.performQuery(courseQueryLarge);
        }).then((courses) => {
            let result = scheduler.schedule(courses, roomsQueryResult);
            let grade = scheduler.getGrade();
            Log.test(result);
            expect(grade).to.lessThan(0);
        }).catch((e) => {
            Log.trace(e);
            expect.fail(e, "0", "Large courses sample");
        });
    });

    it("More rooms1", function () {
        let roomsQueryResult: any;
        return insightFacade.performQuery(roomQueryAll).then((rooms) => {
            roomsQueryResult = rooms;
            return insightFacade.performQuery(courseQuerySmall);
        }).then((courses) => {
            let result = scheduler.schedule(courses, roomsQueryResult);
            let grade = scheduler.getGrade();
            Log.test(result);
            expect(grade).to.lessThan(0);
        }).catch((e) => {
            Log.trace(e);
            expect.fail(e, "0", "Large courses sample");
        });
    });

    it("example", function () {
        let roomsQueryResult: any;
        let result = scheduler.schedule(sectionsExample, roomsExample);
        let grade = scheduler.getGrade();
        Log.test(result);
        return expect(grade).to.lessThan(0);
    });

    it("example", function () {
        let roomsQueryResult: any;
        let result = scheduler.schedule([], []);
        // let grade = scheduler.getGrade();
        Log.test(result);
        return expect(result).to.deep.equal([]);
    });

    it("example", function () {
        let roomsQueryResult: any;
        let result = scheduler.schedule(null, undefined);
        // let grade = scheduler.getGrade();
        Log.test(result);
        return expect(result).to.deep.equal([]);
    });


});


