import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        return [];
    }

    private hasEnoughSeat(room: SchedRoom, section: SchedSection): boolean {
        return (section.courses_fail + section.courses_audit + section.courses_pass) <= room.rooms_seats;
    }

    private isRoomOccupied(room: SchedRoom, time: TimeSlot): boolean {
        return true;
    }
}
