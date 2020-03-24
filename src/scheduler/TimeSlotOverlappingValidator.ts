import Scheduler from "./Scheduler";
import {Data} from "../controller/IInsightFacade";

export default class TimeSlotOverlappingValidator {
    private scheduler: Scheduler;
    private classHashmap: { [key: string]: number[] } = {};

    constructor(scheduler: Scheduler) {
        this.scheduler = scheduler;
    }

    public hasTimeConflict(order: number[], sectionIndex: number, roomIndex: number) {
        let section = this.scheduler.sections[sectionIndex];
        let room = this.scheduler.getSchedRoom(order[roomIndex]);
        if (!section || !room) {
            return false;
        }
        let key = section.courses_dept + section.courses_id;
        let timeSlot: number = order[roomIndex] % this.scheduler.numberOfTimeSlots;
        if (!Object.keys(this.classHashmap).includes(key)) {
            this.classHashmap[key] = [timeSlot];
            return false;
        } else {
            if (this.classHashmap[key].includes(timeSlot)) {
                return true;
            } else {
                this.classHashmap[key].push(timeSlot);
                return false;
            }
        }
    }

    public getTimeConflictFitness(order: number[]) {
        for (let i = 0; i < order.length; i++) {
            if (this.hasTimeConflict(order, i, i)) {
                return Infinity;
            }
        }
        return 0;
    }
}
