import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Helper from "./Helper";
import GA from "./GA";

export default class Scheduler implements IScheduler {
    public static TOBEFILLED: number = -1;
    public static timeslots: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
        "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
        "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
        "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    private numberOfTimeSlots: number = Scheduler.timeslots.length;
    private numberOfSchedRoom: number = 0;
    public numberOfSchedSection: number = 0;
    private numberOfSectionsToSchedule: number = 0;
    public maxNumberOfSectionsCanBeScheduled: number = 0;
    private rooms: SchedRoom[] = [];
    public sections: SchedSection[] = [];
    private helper: Helper = new Helper();
    private ga: GA;
    public childrenLength = 0;
    private weightedMeanLat = 0;
    private weightedMeanLon = 0;

    public getNumberOfStudentsInASection(section: SchedSection): number {
        return section.courses_fail + section.courses_audit + section.courses_pass;
    }

    private getNumberOfSeats(room: SchedRoom): number {
        return room.rooms_seats;
    }

    public hasEnoughSeat(room: SchedRoom, section: SchedSection): boolean {
        if (!section) {
            return true;
        }
        let enrollmentNum = this.getNumberOfStudentsInASection(section);
        let seatNum = this.getNumberOfSeats(room);
        return room ? (this.getNumberOfStudentsInASection(section)) <= this.getNumberOfSeats(room) : false;
    }

    public getSchedRoom(order: number): SchedRoom {
        return this.rooms[Math.floor(order / this.numberOfTimeSlots)];
    }


    private getCapacityFitness(order: number[]): number {
        let fitness = 0;
        for (let i = 0; i < this.numberOfSchedSection; i++) {
            let room: SchedRoom = this.getSchedRoom(order[i]);
            if (this.getSchedRoom(order[i])) {
                if (!this.hasEnoughSeat(room, this.sections[i])) {
                    fitness = Infinity;
                }
            }
        }
        return fitness;
    }


    public getGrade() {
        return this.ga.topFitnessScore - this.ga.minFitness;
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        if (!sections || !rooms || sections.length === 0 || rooms.length === 0) {
            return [];
        }
        this.ga = new GA(this);
        this.init(sections, rooms);
        this.childrenLength = this.maxNumberOfSectionsCanBeScheduled > this.numberOfSchedSection ?
            this.maxNumberOfSectionsCanBeScheduled : this.numberOfSchedSection;
        this.setWeightedCenter();
        this.sortInitArrays();
        this.ga.generateFirstGeneration(this.helper);
        let startTime = Date.now();
        while (
            Date.now() < (startTime + this.ga.timeLimit) &&
            this.ga.topFitnessScore < this.ga.fitnessthreshold) {
            this.ga.calculateFitness(this.helper);
            this.ga.normalizeFitness();
            this.ga.nextGeneration();
            // this.ga.calculateFitness(this.helper);
            // this.ga.bringInTheFittest();
            // this.ga.addNewRandomIndividual();
        }
        this.ga.calculateFitness(this.helper);
        let result = new Array<[SchedRoom, SchedSection, TimeSlot]>();
        // Log.test(this.bestPlan);
        for (let i = 0; i < this.numberOfSchedSection; i++) {
            let room = this.getSchedRoom(this.ga.bestPlan[i]);
            if (room) {
                result.push([this.getSchedRoom(this.ga.bestPlan[i]),
                    sections[i], this.getTimeSlot(this.ga.bestPlan[i])]);
            }
        }
        // this.getFitness(this.ga.bestPlan);
        return result;
    }

    private sortInitArrays() {
        // this.rooms.sort((rooma, roomb) => {
        //     return -(rooma.rooms_seats - roomb.rooms_seats);
        // });
        // Sort by distance
        this.rooms.sort((rooma, roomb) => {
            return this.cmpForSortRoom(rooma, roomb);
        });
        this.sections.sort((sectionA, sectionB) => {
            return -(this.getNumberOfStudentsInASection(sectionA) - this.getNumberOfStudentsInASection(sectionB));
        });
    }

    private cmpForSortRoom(rooma: SchedRoom, roomb: SchedRoom) {
        let closeToCenter = this.getDistanceToCenter(rooma) - this.getDistanceToCenter(roomb);
        if (closeToCenter === 0) {
            return -(rooma.rooms_seats - roomb.rooms_seats);
        } else {
            return closeToCenter;
        }
    }

    private setWeightedCenter() {
        let weight = 0;
        let lonSum = 0;
        let latSum = 0;
        for (let room of this.rooms) {
            lonSum += room.rooms_lon * room.rooms_seats;
            latSum += room.rooms_lat * room.rooms_seats;
            weight += room.rooms_seats;
        }
        this.weightedMeanLat = latSum / weight;
        this.weightedMeanLon = lonSum / weight;
    }

    private getDistanceToCenter(room: SchedRoom) {
        return Math.abs(room.rooms_lon - this.weightedMeanLon) + Math.abs(room.rooms_lat - this.weightedMeanLat);
    }

    private init(sections: SchedSection[], rooms: SchedRoom[]): void {
        this.numberOfSchedRoom = rooms.length;
        this.rooms = rooms;
        this.numberOfSchedSection = sections.length;
        this.sections = sections;
        this.maxNumberOfSectionsCanBeScheduled = this.numberOfSchedRoom * this.numberOfTimeSlots;
        this.numberOfSectionsToSchedule = this.numberOfSchedSection < this.maxNumberOfSectionsCanBeScheduled ?
            this.numberOfSchedSection : this.maxNumberOfSectionsCanBeScheduled;
    }

    private getTimeSlot(order: number): TimeSlot {
        return Scheduler.timeslots[order % this.numberOfTimeSlots];
    }

}
