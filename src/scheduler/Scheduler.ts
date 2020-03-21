import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {
    // Init user input
    private static timeslots: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
        "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
        "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
        "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    private numberOfTimeSlots: number = Scheduler.timeslots.length;
    private numberOfSchedRoom: number = 0;
    private numberOfSchedSection: number = 0;
    private numberOfSectionsToSchedule: number = 0;
    private maxNumberOfSectionsCanBeScheduled: number = 0;
    private rooms: SchedRoom[] = [];
    private sections: SchedSection[];

    // GA
    private population: number[][] = [];
    private fitness: number[];
    private topFitnessScore = 0;
    private bestPlan: number[] = [];
    private childrenLength = 0;

    // Config
    private totalPopulationSize: number = 20;
    private mutationRate: number = 0.01;

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        this.init(sections, rooms);
        this.childrenLength = this.maxNumberOfSectionsCanBeScheduled > this.numberOfSchedSection ?
            this.maxNumberOfSectionsCanBeScheduled : this.numberOfSchedSection;
        this.generateFirstGeneration();
        return [];
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

    private getNumberOfStudentsInASection(section: SchedSection): number {
        return section.courses_fail + section.courses_audit + section.courses_pass;
    }

    private getNumberOfSeats(room: SchedRoom): number {
        return room.rooms_seats;
    }

    private hasEnoughSeat(room: SchedRoom, section: SchedSection): boolean {
        return (this.getNumberOfStudentsInASection(section)) <= this.getNumberOfSeats(room);
    }

    private isRoomOccupied(room: SchedRoom, time: TimeSlot, timeTable: Array<[SchedRoom, SchedSection, TimeSlot]>):
        boolean {
        let occupied = false;
        return occupied;
    }

    private getTimeSlot(order: number): TimeSlot {
        return Scheduler.timeslots[order % this.numberOfTimeSlots];
    }

    private getSchedRoom(order: number): SchedRoom {
        return this.rooms[Math.floor(order / this.numberOfTimeSlots)];
    }

    private range(from: number, to: number): number[] {
        let result: number[] = [];
        for (let i = from; i < to; i++) {
            result[i] = i;
        }
        return result;
    }

    private swap(array: number[], index0: number, index1: number) {
        let temp = array[index0];
        array[index0] = array[index1];
        array[index1] = temp;
    }

    //
    // private shuffle(array: number[], numOfTimes: number, numOfSection: number) {
    //     for (let i = 0; i < numOfTimes; i++) {
    //         let index0 = Math.floor(Math.random() * array.length);
    //         let index1 = numOfSection < array.length ? Math.floor(Math.random() * numOfSection) :
    //             Math.floor(Math.random() * array.length);
    //         this.swap(array, index0, index1);
    //     }
    // }

    private shuffle(array: number[]): number[] {
        let inputArray = array.slice();
        let result = [];
        while (inputArray.length) {
            let index = Math.floor(Math.random() * inputArray.length);
            result.push(inputArray.splice(index, 1)[0]);
        }
        return result;
    }

    private toRadians(angleIndegree: number) {
        return angleIndegree * (Math.PI / 180);
    }

    public getDistance(room0: SchedRoom, room1: SchedRoom) {
        let R = 6371e3; // metres
        let lat1: number = room0.rooms_lat;
        let lat2: number = room1.rooms_lat;
        let lon1: number = room0.rooms_lon;
        let lon2: number = room1.rooms_lon;
        let deltaLat = this.toRadians(lat2 - lat1);
        let deltaLon = this.toRadians(lon2 - lon1);

        lat1 = this.toRadians(lat1);
        lat2 = this.toRadians(lat2);

        let x = Math.sin(lat1);

        let a = Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) ** 2;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        let d = R * c;
        return d / 1372;
    }

    private getDistanceFitness(order: number[]) {
        let dBest: number = Infinity;
        let buildings = this.getUsedBuilding(order);
        if (buildings.length === 1) {
            dBest = 0;
        } else if (buildings.length > 1) {
            for (let i = 0; i < buildings.length - 1; i++) {
                for (let j = i + 1; j < buildings.length; j++) {
                    let d = this.getDistance(buildings[i], buildings[j]);
                    if (d < dBest) {
                        dBest = d;
                    }
                }
            }
        }
        return dBest;
    }

    private getEnrollmentFitness(order: number[]): number {
        let scheduledEnrollment: number = 0;
        let totalEnrollment: number = 0;
        for (let i = 0; i < order.length; i++) {
            if (this.getSchedRoom(order[i])) {
                scheduledEnrollment += this.getNumberOfStudentsInASection(this.sections[i]);
            }
            totalEnrollment += this.getNumberOfStudentsInASection(this.sections[i]);
        }
        return totalEnrollment ? scheduledEnrollment / totalEnrollment : 0;
    }

    private getUsedBuilding(order: number[]): SchedRoom[] {
        let usedBuildings: SchedRoom[] = [];
        for (let i of order) {
            let room: SchedRoom = this.getSchedRoom(i);
            if (room) {
                let isInUsedBuildings: boolean = false;
                for (let building of usedBuildings) {
                    if (building.rooms_shortname === room.rooms_shortname) {
                        isInUsedBuildings = true;
                        break;
                    }
                }
                usedBuildings.push(room);
            }
        }
        return usedBuildings;
    }

    private getCapacityFitness(order: number[]): number {
        let fitness = 0;
        for (let i = 0; i < order.length; i++) {
            let room: SchedRoom = this.getSchedRoom(order[i]);
            if (this.getSchedRoom(order[i])) {
                let numOfStudents = this.getNumberOfStudentsInASection(this.sections[i]);
                let numOfSeats = this.getNumberOfSeats(room);
                if (numOfStudents > numOfSeats) {
                    fitness = Infinity;
                }
            }
        }
        return fitness;
    }

    private calculateFitness() {
        for (let i = 0; i < this.population.length; i++) {
            let order: number[] = this.population[i];
            this.fitness[i] = 1 / (1 + this.getCapacityFitness(order) + this.getDistanceFitness(order) +
                this.getEnrollmentFitness(order));
            if (this.fitness[i] > this.topFitnessScore) {
                this.topFitnessScore = this.fitness[i];
                this.bestPlan = order;
            }
        }
    }

    private normalizeFitness() {
        let fitnessSum: number = this.fitness.reduce((sum, fitness) => {
            return sum + fitness;
        }, 0);
        for (let i = 0; i < this.fitness.length; i++) {
            this.fitness[i] /= fitnessSum;
        }
    }

    private nextGeneration() {
        let newPopulation: number[][] = [];
        let x = 0;
        for (let i = 0; i < this.population.length; i++) {
            let order: number[] = this.population[i].slice();
            this.mutate(order, this.mutationRate);
            newPopulation.push(order);
            x = i;
        }

    }

    private mutate(order: number[], mutationRate: number) {
        let index0 = Math.floor(Math.random() * order.length);
        let index1 = Math.floor(Math.random() * order.length);
        this.swap(order, index0, index1);
    }

    private generateFirstGeneration() {
        for (let i = 0; i < this.totalPopulationSize; i++) {
            let order: number[] = this.range(0, this.childrenLength);
            order = this.shuffle(order);
            this.population.push(order);
        }
    }
}
