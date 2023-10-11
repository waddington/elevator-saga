
// TODO:
// - [ ] Add a way to check if an elevator is full
// - [ ] Add a way to check if an elevator is going to stop at a floor
// - [ ] Add 2 new queues: 1 for each elevator button presses and floor button presses
// - [ ] Whenever an elevator passes a floor check both queues to figure out if should stop there, then decide next floor
// eslint-disable-next-line @typescript-eslint/no-unused-vars


const game: Game = {
    init: function(elevators, floors) {
        /**
         * Augment the elevators with some extra data
         */
        const augmentedElevators: AugmentedElevator[] = elevators.map((elevator) => {
            return {
                ...elevator
            }
        });

        /**
         * Keeps track of how many times a floor has been called
         * // TODO somehow add direction into here
         */
        const floorCallRecord: Record<number, number> = {}
        floors.forEach((floor, index) => {
            floorCallRecord[index] = 0
        })

        const getElevator = (elevatorIdx: number) => augmentedElevators[elevatorIdx]


        const handleElevatorFloorButtonPressed = (elevatorIdx: number, floorNum: number) => {}

        const handleElevatorCallButtonPressed = (floorNum: number, direction: Direction) => {
            console.log(`Floor ${floorNum} called for ${direction}`)
            floorCallRecord[floorNum]++
        }

        const highestDemandFloor = (): number => {
            let highestDemandFloorNum = 0
            let highestDemandFloorCount = 0
            for (const floorNum in floorCallRecord) {
                if (floorCallRecord[floorNum] > highestDemandFloorCount) {
                    highestDemandFloorNum = Number(floorNum)
                    highestDemandFloorCount = floorCallRecord[floorNum]
                }
            }
            return highestDemandFloorNum
        }

        const decideNextFloorForElevator = (elevatorIdx: number, currentFloorNum: number) => {
            console.log(`Elevator ${elevatorIdx} stopped at floor ${currentFloorNum}`)
            const elevator = getElevator(elevatorIdx)
            const elevatorPressedFloors = elevator.getPressedFloors()
            const elevatorLoadFactor = elevator.loadFactor()
            const highestDemandFloorNum = highestDemandFloor()
            const highestFloorDemand = floorCallRecord[highestDemandFloorNum]

            // Remove current floor number from floor record
            floorCallRecord[currentFloorNum] = 0

            if (elevatorLoadFactor > 0.7) {
                // go to the closest pressed floor
                const closestPressedFloor = elevatorPressedFloors.reduce((prev, curr) => {
                    return (Math.abs(curr - currentFloorNum) < Math.abs(prev - currentFloorNum) ? curr : prev)
                })
                console.log(`Elevator ${elevatorIdx} is full, going to closest pressed floor ${closestPressedFloor}`)
                elevator.goToFloor(closestPressedFloor)
            } else {
                if (highestFloorDemand > 0) {
                    // go to the highest demand floor
                    console.log(`Elevator ${elevatorIdx} is not full, going to highest demand floor ${highestDemandFloorNum}`)
                    elevator.goToFloor(highestDemandFloorNum)
                } else {
                    // go to the closest pressed floor
                    const closestPressedFloor = elevatorPressedFloors.reduce((prev, curr) => {
                        return (Math.abs(curr - currentFloorNum) < Math.abs(prev - currentFloorNum) ? curr : prev)
                    })
                    console.log(`Elevator ${elevatorIdx} is not full, going to closest pressed floor ${closestPressedFloor}`)
                    elevator.goToFloor(closestPressedFloor)
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const checkElevatorPassingFloor = (elevatorIdx:number, floorNum: number, direction: Omit<Direction, "stop">) => {}


        // #######################
        // ####### Kick off ######
        // #######################

        elevators.forEach((elevator, index) => {
            elevator.on("idle", () => {});

            elevator.on("floor_button_pressed", (floorNum: number) => handleElevatorFloorButtonPressed(index, floorNum));

            elevator.on("passing_floor", (floorNum, direction) => checkElevatorPassingFloor(index, floorNum, direction));

            elevator.on("stopped_at_floor", (floorNum: number) => decideNextFloorForElevator(index, floorNum));
        })

        floors.forEach((floor, index) => {
            floor.on("up_button_pressed", () => handleElevatorCallButtonPressed(index, "up"));

            floor.on("down_button_pressed", () => handleElevatorCallButtonPressed(index, "down"));
        })
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update: function(dt, elevators, floors) {}
}


// #######################
// ####### TYPES #########
// #######################
export interface Game {
    init: (elevators: Elevator[], floors: Floor[]) => void;
    update: (dt: number, elevators: Elevator[], floors: Floor[]) => void;
}

export type Direction = "up" | "down" | "stopped"

export interface Elevator {
    /**
     * Queue the elevator to go to specified floor number. If you specify true as second argument, the elevator will go to that floor directly, and then go to any other queued floors.
     * @param floorNum The floor number to go to.
     */
    goToFloor: (floorNum: number, withoutStopping?: boolean) => void;
    /**
     * Clear the destination queue and stop the elevator if it is moving. Note that you normally don't need to stop elevators - it is intended for advanced solutions with in-transit rescheduling logic. Also, note that the elevator will probably not stop at a floor, so passengers will not get out.
     */
    stop: () => void;
    /**
     * Gets the floor number that the elevator currently is on.
     * @returns The floor number.
     */
    currentFloor: () => number;
    /**
     * Gets or sets the going up indicator, which will affect passenger behaviour when stopping at floors.
     * @param value If not specified, the current going up indicator is returned. If specified, the new value is set.
     * @returns The current going up indicator.
     */
    goingUpIndicator: (value?: boolean) => boolean;
    /**
     * Gets or sets the going down indicator, which will affect passenger behaviour when stopping at floors.
     * @param value If not specified, the current going down indicator is returned. If specified, the new value is set.
     * @returns The current going down indicator.
     */
    goingDownIndicator: (value?: boolean) => boolean;
    /**
     * Gets the maximum number of passengers that can occupy the elevator at the same time.
     * @returns The maximum number of passengers.
     */
    maxPassengerCount: () => number;
    /**
     * Gets the load factor of the elevator. 0 means empty, 1 means full. Varies with passenger weights, which vary - not an exact measure.
     * @returns A number ranging from 0 (empty) to 1 (full).
     */
    loadFactor: () => number;
    /**
     * Gets the direction the elevator is currently going to move toward. Can be "up", "down" or "stopped".
     * @returns The direction the elevator is currently going to move toward.
     */
    destinationDirection: () => Direction;
    /**
     * The current destination queue, meaning the floor numbers the elevator is scheduled to go to. Can be modified and emptied if desired. Note that you need to call checkDestinationQueue() for the change to take effect immediately.
     * @returns The current destination queue.
     */
    destinationQueue: number[];
    /**
     * Checks the destination queue for any new destinations to go to. Note that you only need to call this if you modify the destination queue explicitly.
     */
    checkDestinationQueue: () => void;
    /**
     * Gets the currently pressed floor numbers as an array.
     * @returns The currently pressed floor numbers as an array.
     */
    getPressedFloors: () => number[];
    on: (event: "idle" | "floor_button_pressed" | "passing_floor" | "stopped_at_floor", callback: (() => void) | ((floorNum: number) => void) | ((floorNum: number, direction: Omit<Direction, "stopped">) => void)) => void
}

export interface AugmentedElevator extends Elevator {

}


export interface Floor {
    /**
     * 	Gets the floor number of the floor object.
     * @returns The floor number.
     */
    floorNum: () => number;
    on: (event: "up_button_pressed" | "down_button_pressed", callback: (args?: any[]) => void) => void
}


// #######################
// ##### END TYPES #######
// #######################
