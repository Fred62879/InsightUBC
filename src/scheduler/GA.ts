import Helper from "./Helper";
import Scheduler from "./Scheduler";
import {SchedRoom} from "./IScheduler";
import Log from "../Util";
import TimeSlotOverlappingValidator from "./TimeSlotOverlappingValidator";

export default class GA {
    private population: number[][] = [];
    private fitness: number[] = [];
    private normalizedFitness: number[] = [];
    public topFitnessScore = 0;
    public bestPlan: number[] = [];
    private totalPopulationSize: number = 2;
    private mutationRate: number = 0;
    public timeLimit = 20000;
    public fitnessthreshold = 0.99;
    private enrollmentFitnessWeight = 0.7;
    private distanceFitnessWeight = 0.3;
    public minFitness = 0.01;
    private replaceWithBestIndividualRate = 1;
    private replaceWithrandomIndividualRate = 0.8;
    private numOfCrossOverPerGeneration = 1;
    private scheduler: Scheduler;
    private percentageOfGreedyFirstGeneration = 0.1;
    private greedySkipRate = 0.1;
    private pickRandomChance = 0.1;
    private pickBestChance = 0.9;

    constructor(scheduler: Scheduler) {
        this.scheduler = scheduler;
    }

    public crossover(order0: number[], order1: number[], numberOfSchedSection: number) {
        let order: number[] = new Array(order0.length).fill(Scheduler.TOBEFILLED);
        let order2: number[] = order1.slice();
        let toBeFilled: number[] = [];
        let skippedSessions: number[] = [];
        for (let i = 0; i < order0.length; i++) {
            if (order0[i] === Scheduler.TOBEFILLED || Math.random() < 0.5) {
                order[i] = Scheduler.TOBEFILLED;
                toBeFilled.push(i);
            } else {
                let room = this.scheduler.getSchedRoom(order0[i]);
                if (room && this.scheduler.hasEnoughSeat(room, this.scheduler.sections[i])) {
                    order[i] = order0[i];
                }
            }
        }
        let test;

        for (let i of toBeFilled) {
            // if (order[i] === Scheduler.TOBEFILLED) {
            if (Math.random() < this.greedySkipRate) {
                skippedSessions.push(i);
                continue;
            }
            this.fillToBeFillMidifiesArguments(order, order2, i);
            // }
        }
        let test1;
        for (let index of skippedSessions) {
            this.fillToBeFillMidifiesArguments(order, order2, index);
        }
        return order;
    }

    public fillToBeFillMidifiesArguments(order: number[], order2: number[], index: number) {
        for (let j = 0; j < order2.length; j++) {
            if (order2[j] === Scheduler.TOBEFILLED || order.includes(order2[j])) {
                order2.splice(j, 1);
                j--;
            } else {
                let room1 = this.scheduler.getSchedRoom(order2[j]);
                if (room1 && this.scheduler.hasEnoughSeat(room1,
                    this.scheduler.sections[index])) {
                    order[index] = order2.splice(j, 1)[0];
                    j--;
                    break;
                }
            }
        }
    }

    public getFitness(order: number[], helper: Helper) {
        let distanceFitness: number = this.getDistanceFitness(order, helper);
        let enrollmentFitness: number = this.getEnrollmentFitness(order);
        let capacityFitness = this.getCapacityFitness(order);
        let timeValidator = new TimeSlotOverlappingValidator(this.scheduler);
        // let timeConflictFitness = timeValidator.getTimeConflictFitness(order);
        let timeConflictFitness = 0;
        return (this.enrollmentFitnessWeight * (1 - enrollmentFitness) +
            this.distanceFitnessWeight * (1 - distanceFitness)) / (1 + capacityFitness + timeConflictFitness) +
            this.minFitness;
    }

    public calculateFitness(helper: Helper) {
        for (let i = 0; i < this.population.length; i++) {
            let order: number[] = this.population[i];
            let fitness = this.getFitness(order, helper);
            this.fitness[i] = fitness;
            Log.test(fitness);
            if (fitness > this.topFitnessScore) {
                this.topFitnessScore = fitness;
                // Log.test(this.topFitnessScore);
                this.bestPlan = order;

            }
        }
    }

    public getDistanceFitness(order: number[], helper: Helper) {
        let dBest: number = 0;
        let buildings = this.getUsedBuilding(order);
        if (buildings.length === 0) {
            dBest = Infinity;
        } else if (buildings.length > 1) {
            for (let i = 0; i < buildings.length - 1; i++) {
                for (let j = i + 1; j < buildings.length; j++) {
                    let d = helper.getDistance(buildings[i], buildings[j]);
                    if (d > dBest) {
                        dBest = d;
                    }
                }
            }
        } else if (buildings.length === 1) {
            dBest = 0;
        }
        return dBest;
    }

    private getCapacityFitness(order: number[]): number {
        let fitness = 0;
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let room: SchedRoom = this.scheduler.getSchedRoom(order[i]);
            if (this.scheduler.getSchedRoom(order[i])) {
                if (!this.scheduler.hasEnoughSeat(room, this.scheduler.sections[i])) {
                    fitness = Infinity;
                }
            }
        }
        return fitness;
    }

    public normalizeFitness() {
        let fitnessSum: number = this.fitness.reduce((sum, fitness) => {
            return sum + fitness;
        }, 0);
        for (let i = 0; i < this.fitness.length; i++) {
            this.normalizedFitness[i] = this.fitness[i] / fitnessSum;
        }
    }

    public nextGeneration() {
        // Log.test(this.population);
        Log.test(this.fitness);
        // Log.test(this.topFitnessScore);
        let newPopulation: number[][] = [];
        for (let i of this.population) {
            let order0: number[] = this.pickParentFromPopulation(false, true);
            let order1: number[] = this.pickParentFromPopulation(true, false);
            let order: number[] = this.crossover(order0, order1, this.scheduler.numberOfSchedSection);
            // order = this.mutate(order, this.mutationRate);
            // order = this.greedy(order, true);
            newPopulation.push(order);
        }
        this.population = newPopulation;
    }

    private greedy(order: number[], ascending: boolean = true): number[] {
        let result: number[] = order.slice();
        let timeValidator = new TimeSlotOverlappingValidator(this.scheduler);
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let pushedToOrderAscending = false;
            for (let j = 0; j < result.length; j++) {
                let a = ascending ? 1 : -1;
                let b = ascending ? 0 : 1;
                let index = (this.scheduler.numberOfSchedSection - 1) * b + i * a;
                let room = this.scheduler.getSchedRoom(result[j]);
                if (room && this.scheduler.hasEnoughSeat(room, this.scheduler.sections[index])) {
                    if (index <= j) {
                        let timeConflict: boolean = timeValidator.hasTimeConflict(result, index, j);
                        if (!timeConflict) {
                            Helper.swap(result, index, j);
                            pushedToOrderAscending = true;
                            break;
                        }
                    }
                }
            }
            if (!pushedToOrderAscending) {
                result[i] = Scheduler.TOBEFILLED;
            }
        }
        return result;
    }

    private improveFitnessByCancelSessions(order: number[], helper: Helper) {
        let fitness = this.getFitness(order, helper);
        if (fitness > this.topFitnessScore) {
            this.topFitnessScore = this.getFitness(order, helper);
            this.bestPlan = order;
        }
        this.topFitnessScore = this.getFitness(order, helper);
        this.bestPlan = order;
        let result = order.slice();
        for (let i = 0; i < result.length; i++) {
            let temp = order.slice();
            temp[i] = Scheduler.TOBEFILLED;
            fitness = this.getFitness(temp, helper);
            if (fitness > this.topFitnessScore) {
                this.topFitnessScore = fitness;
                this.bestPlan = temp;
                result = temp;
            }
        }
        return result;
    }

    public generateFirstGeneration(helper: Helper) {
        let greedyOrder = this.greedy(Helper.newNumberList(
            this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled), true);
        this.population.push(greedyOrder);
        this.population.push(this.improveFitnessByCancelSessions(greedyOrder, helper));
        for (let i = 0; i < this.totalPopulationSize - 2; i++) {
            let order: number[] = Helper.newNumberList(
                this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled);
            order = Helper.shuffle(order);
            if (Math.random() < this.percentageOfGreedyFirstGeneration) {
                order = this.greedy(order, true);
            }
            this.population.push(order);
        }
    }

    private pickParentFromPopulation(pickRandom: boolean = false, pickBest: boolean = false) {
        if (pickRandom && Math.random() < this.pickRandomChance) {
            let order: number[] = Helper.newNumberList(
                this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled);
            order = Helper.shuffle(order);
            return order;
        } else if (pickBest && Math.random() < this.pickBestChance) {
            return this.bestPlan.slice();
        }
        let index = 0;
        let r = Math.random();

        while (r > 0) {
            r = r - this.normalizedFitness[index];
            index++;
        }
        index--;
        return this.population[index].slice();
    }

    public getEnrollmentFitness(order: number[]): number {
        let scheduledEnrollment: number = 0;
        let totalEnrollment: number = 0;
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            if (this.scheduler.getSchedRoom(order[i])) {
                scheduledEnrollment += this.scheduler.getNumberOfStudentsInASection(this.scheduler.sections[i]);
            }
            totalEnrollment += this.scheduler.getNumberOfStudentsInASection(this.scheduler.sections[i]);
        }
        return totalEnrollment ? (1 - scheduledEnrollment / totalEnrollment) : 0;
    }

    private getUsedBuilding(order: number[]): SchedRoom[] {
        let usedBuildings: SchedRoom[] = [];
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let room: SchedRoom = this.scheduler.getSchedRoom(order[i]);
            if (room) {
                let isInUsedBuildings: boolean = false;
                for (let building of usedBuildings) {
                    if (building.rooms_shortname === room.rooms_shortname) {
                        isInUsedBuildings = true;
                        break;
                    }
                }
                if (!isInUsedBuildings) {
                    usedBuildings.push(room);
                }
            }
        }
        return usedBuildings;
    }
}
