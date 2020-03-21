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


    protected getFitness(order: number[]) {
        let distanceFitness: number = this.ga.getDistanceFitness(order, this.helper);
        let enrollmentFitness: number = this.ga.getEnrollmentFitness(order);
        let fitness = 1 / (1 + this.getCapacityFitness(order) + distanceFitness + enrollmentFitness);
    }


    public getGrade() {
        return this.ga.grading;
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        this.ga = new GA(this);
        this.init(sections, rooms);
        this.childrenLength = this.maxNumberOfSectionsCanBeScheduled > this.numberOfSchedSection ?
            this.maxNumberOfSectionsCanBeScheduled : this.numberOfSchedSection;
        this.sortInitArrays();
        this.ga.generateFirstGeneration();
        let startTime = Date.now();
        while (
            Date.now() < (startTime + this.ga.timeLimit) &&
            this.ga.topFitnessScore < this.ga.fitnessthreshold) {
            this.ga.calculateFitness(this.helper);
            this.ga.normalizeFitness();
            this.ga.nextGeneration();
        }
        let result = new Array<[SchedRoom, SchedSection, TimeSlot]>();
        // Log.test(this.bestPlan);
        for (let i = 0; i < this.numberOfSchedSection; i++) {
            let room = this.getSchedRoom(this.ga.bestPlan[i]);
            if (room) {
                result.push([this.getSchedRoom(this.ga.bestPlan[i]),
                    sections[i], this.getTimeSlot(this.ga.bestPlan[i])]);
            }
        }
        this.getFitness(this.ga.bestPlan);
        return result;
    }

    private sortInitArrays() {
        this.rooms.sort((rooma, roomb) => {
            return rooma.rooms_seats - roomb.rooms_seats;
        });
        this.sections.sort((sectionA, sectionB) => {
            return this.getNumberOfStudentsInASection(sectionA) - this.getNumberOfStudentsInASection(sectionB);
        });
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
