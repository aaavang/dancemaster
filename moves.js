import {clearHeader, freezeHeader, resetCount, tick, unfreezeHeader, updateHeader} from "./header.js";
import {
    BEATS,
    DancerLayouts,
    Directions,
    FormationGroups,
    Formations,
    Positions,
    Relationships, Role,
    Role as Roles
} from "./enums.js";


/**
 * Normalize an arrow's rotation to be between 0 and 360.
 * @param {HTMLDivElement} arrow
 * @returns {number} - the normalized rotation
 */
export const normalizeRotation = (arrow) => {
    const rotationStr = arrow.style.transform.match(/rotate\((.+)deg\)/)[1]
    let rotation = parseInt(rotationStr)
    rotation = rotation % 360
    if (rotation < 0) {
        rotation += 360
    }
    return rotation
}

export const getFacingDirection = (dancer) => {
    const rotation = normalizeRotation(dancer.arrowElem);
    if (rotation >= 46 && rotation < 135) {
        return Directions.LEFT
    } else if (rotation >= 135 && rotation < 225) {
        return Directions.UP
    } else if (rotation >= 225 && rotation < 315) {
        return Directions.RIGHT
    } else {
        return Directions.DOWN
    }
}

export let positions
/**
 * Get the positions of the dancers in the formation given the width and height of the dance floor
 * @param width
 * @param height
 * @returns {{center: {x: number, y: number}, [Formations.EIGHT_HAND_SQUARE]: {[Positions.SECOND_TOP_FOLLOW]: {rotation: number, x: number, y: number}, [Positions.FIRST_SIDE_LEAD]: {rotation: number, x: number, y: number}, [Positions.SECOND_SIDE_LEAD]: {rotation: number, x: number, y: number}, [Positions.SECOND_TOP_LEAD]: {rotation: number, x: number, y: number}, [Positions.FIRST_TOP_LEAD]: {rotation: number, x: number, y: number}, [Positions.FIRST_TOP_FOLLOW]: {rotation: number, x: number, y: number}, [Positions.FIRST_SIDE_FOLLOW]: {rotation: number, x: number, y: number}, [Positions.SECOND_SIDE_FOLLOW]: {rotation: number, x: number, y: number}}}}
 */
export const calcPositions = (width, height) => {
    const center = {
        x: width / 2,
        y: height / 2 + 100
    }

    positions = {
        center,
        [Formations.EIGHT_HAND_SQUARE]: {
            [Positions.FIRST_TOP_FOLLOW]: {
                x: center.x - 125,
                y: center.y - 250,
                rotation: 0
            },
            [Positions.FIRST_TOP_LEAD]: {
                x: center.x + 25,
                y: center.y - 250,
                rotation: 0
            },
            [Positions.SECOND_TOP_FOLLOW]: {
                x: center.x + 25,
                y: center.y + 150,
                rotation: 180
            },
            [Positions.SECOND_TOP_LEAD]: {
                x: center.x - 125,
                y: center.y + 150,
                rotation: 180
            },
            [Positions.FIRST_SIDE_LEAD]: {
                x: center.x + 150,
                y: center.y + 25,
                rotation: 90
            },
            [Positions.FIRST_SIDE_FOLLOW]: {
                x: center.x + 150,
                y: center.y - 125,
                rotation: 90
            },
            [Positions.SECOND_SIDE_LEAD]: {
                x: center.x - 250,
                y: center.y - 125,
                rotation: 270
            },
            [Positions.SECOND_SIDE_FOLLOW]: {
                x: center.x - 250,
                y: center.y + 25,
                rotation: 270
            },
        },
        [Formations.TWO_FACING_TWO]: {
            [Positions.FIRST_TOP_FOLLOW]: {
                x: center.x - 125,
                y: center.y - 150,
                rotation: 0
            },
            [Positions.FIRST_TOP_LEAD]: {
                x: center.x + 25,
                y: center.y - 150,
                rotation: 0
            },
            [Positions.SECOND_TOP_FOLLOW]: {
                x: center.x + 25,
                y: center.y + 50,
                rotation: 180
            },
            [Positions.SECOND_TOP_LEAD]: {
                x: center.x - 125,
                y: center.y + 50,
                rotation: 180
            },
        },
        // [Formations.SOLO]: {
        //     [Positions.FIRST_TOP_LEAD]: {
        //         x: center.x,
        //         y: center.y + 50,
        //         rotation: 180
        //     }
        // }
    }
}

calcPositions(window.innerWidth, window.innerHeight)

const getTranslation = (dancer) => {
    const style = window.getComputedStyle(dancer.elem);
    const transform = style.transform;

    // Default values if no transform
    if (transform === 'none' || !transform) {
        return { x: 0, y: 0 };
    }

    // Parse matrix values
    // 2D matrix format: matrix(a, b, c, d, tx, ty)
    // 3D matrix format: matrix3d(a, b, c, d, e, f, g, h, i, j, k, l, tx, ty, tz, tw)
    const matrixMatch = transform.match(/matrix.*\((.+)\)/);

    if (matrixMatch) {
        const values = matrixMatch[1].split(', ').map(parseFloat);

        if (transform.startsWith('matrix3d')) {
            // For 3D matrix, translation values are at indices 12 and 13
            return { x: values[12], y: values[13] };
        } else {
            // For 2D matrix, translation values are at indices 4 and 5
            return { x: values[4], y: values[5] };
        }
    }

    return { x: 0, y: 0 };
}

/**
 * Move to fast sevens with partner
 * @param danceMaster
 * @param numBeats
 * @returns {Promise<Awaited<unknown>[]>}
 */
export const switchWithPartner = async (danceMaster, numBeats = 4) => {
    const state = danceMaster.state
    updateHeader('Switch With Partner')
    const timelines = [];
    switch (state.formation) {
        case Formations.TWO_FACING_TWO:
        case Formations.EIGHT_HAND_SQUARE:
            // group dancers by group
            const groups = Object.values(state.dancers).reduce((acc, dancer) => {
                const group = FormationGroups[state.formation][dancer.currentNamedPosition]
                if (!acc[group]) {
                    acc[group] = []
                }
                acc[group].push(dancer)
                return acc
            }, {})

            Object.values(groups).forEach(group => {
                const [dancer1, dancer2] = group
                const dancer1Timeline = anime.timeline({
                    duration: numBeats * BEATS,
                    easing: 'linear',
                    autoplay: false
                })
                const dancer2Timeline = anime.timeline({
                    duration: numBeats * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                const dancer1DesiredPosition = positions[state.formation][dancer2.currentNamedPosition]
                const dancer2DesiredPosition = positions[state.formation][dancer1.currentNamedPosition]
                const dancer1StartingPosition = positions[state.formation][dancer1.role]
                const dancer2StartingPosition = positions[state.formation][dancer2.role]

                dancer1Timeline.add({
                    // switch with partner
                    targets: dancer1.targetId,
                    translateX: dancer1DesiredPosition.x - dancer1StartingPosition.x,
                    translateY: dancer1DesiredPosition.y - dancer1StartingPosition.y,
                    complete: () => {
                        const tempNamedPosition = dancer1.currentNamedPosition
                        const tempPosition = {...dancer1.position}
                        dancer1.currentNamedPosition = dancer2.currentNamedPosition
                        dancer1.position = dancer2.position
                        dancer2.currentNamedPosition = tempNamedPosition
                        dancer2.position = tempPosition
                    }
                })

                dancer2Timeline.add({
                    // switch with partner
                    targets: dancer2.targetId,
                    translateX: dancer2DesiredPosition.x - dancer2StartingPosition.x,
                    translateY: dancer2DesiredPosition.y - dancer2StartingPosition.y
                })

                timelines.push(dancer1Timeline)
                timelines.push(dancer2Timeline)

            })
            break;
        default:
            throw new Error("invalid formation")
    }
    const tickerTimeline = makeTickerTimeline(numBeats);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Move to fast sevens with partner
 * @param danceMaster
 * @returns {Promise<Awaited<unknown>[]>}
 */
export const fastSevensWithPartner = async (danceMaster) => {
    updateHeader('Fast Sevens')
    freezeHeader()
    await switchWithPartner(danceMaster)
    await switchWithPartner(danceMaster)
    unfreezeHeader()

}
/**
 * Move to advance and retire
 * @param danceMaster
 * @returns {Promise<Awaited<unknown>[]>}
 */
export const advanceAndRetire = async (danceMaster) => {
    const state = danceMaster.state
    updateHeader('Advance and Retire')
    const timelines = [];
    switch (state.formation) {
        case Formations.TWO_FACING_TWO:
        case Formations.EIGHT_HAND_SQUARE:
            for (const dancer of Object.values(state.dancers)) {
                const timeline = anime.timeline({
                    duration: 4 * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                const startingPosition = positions[state.formation][dancer.role]
                const currentPosition = positions[state.formation][dancer.currentNamedPosition]
                const startingOffsetX = currentPosition.x - startingPosition.x
                const startingOffsetY = currentPosition.y - startingPosition.y


                let translateX = startingOffsetX
                let translateY = startingOffsetY

                switch (dancer.currentNamedPosition) {
                    case Positions.FIRST_TOP_LEAD:
                    case Positions.FIRST_TOP_FOLLOW:
                        translateY += 50
                        break;
                    case Positions.SECOND_TOP_LEAD:
                    case Positions.SECOND_TOP_FOLLOW:
                        translateY -= 50
                        break;
                    case Positions.FIRST_SIDE_LEAD:
                    case Positions.FIRST_SIDE_FOLLOW:
                        translateX -= 50
                        break;
                    case Positions.SECOND_SIDE_LEAD:
                    case Positions.SECOND_SIDE_FOLLOW:
                        translateX += 50
                        break;
                }

                timeline.add({
                    targets: dancer.targetId,
                    translateX,
                    translateY,
                }).add({
                    targets: dancer.targetId,
                    translateX: startingOffsetX,
                    translateY: startingOffsetY,
                })

                timelines.push(timeline)
            }
            break;
        default:
            throw new Error("invalid formation")
    }
    const tickerTimeline = makeTickerTimeline(8);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}

/**
 * Calculate the angle and rotation needed to face a specific position from a given starting position, while turning in
 * the given direction.
 * @param state
 * @param {number} startingRotation
 * @param {Position} startingPosition
 * @param {Position} targetPosition
 * @param {Direction} direction
 * @param dancer
 * @returns {{angle: number, rotation: number}}
 */
function calculateAngleAndRotation(state, startingRotation, startingPosition, targetPosition, direction, dancer) {
    let targetAngle = calculateRotationToFacePosition(state, startingPosition, targetPosition, direction, dancer);
    let dancerAngle = startingRotation

    if (targetAngle === 360 && dancerAngle < 0 && dancerAngle > -180 && direction === Directions.RIGHT) {
        targetAngle = 0
    }
    if (targetAngle === 360 && dancerAngle < 180 && dancerAngle > -360 && direction === Directions.LEFT) {
        targetAngle = -360
    }

    if (targetAngle < dancerAngle && direction === Directions.RIGHT) {
        targetAngle += 360
    }
    if (dancerAngle < targetAngle && direction === Directions.LEFT) {
        dancerAngle += 360
    }

    let difference = targetAngle - dancerAngle
    if (difference < 0 && direction === Directions.RIGHT) {
        difference += 360
    }

    return {
        angle: targetAngle,
        rotation: startingRotation + difference
    };
}

/**
 * Helper function to calculate the rotation of the dancer when moving to a new position
 * @param state
 * @param dancer
 * @param nextPositionName
 * @param direction
 * @returns {number|*}
 */
function calculateRotation(state, dancer, nextPositionName, direction) {
    const currentRotation = dancer.currentOffset.rotation
    const nextRotation = positions[state.formation][nextPositionName].rotation
    let difference = Math.abs(nextRotation - currentRotation) % 360
    if (difference > 180) {
        difference = 360 - difference
    }
    return direction === Directions.RIGHT ? currentRotation - difference : currentRotation + difference;
}

function calculateRotationToFacePosition(state, startingPositionName, targetPositionName, direction, dancer) {
    const dancerTransform = getDancerTransformValues(dancer)
    const startingPosition = startingPositionName === Positions.OUT_OF_POSITION ? {
        x: dancerTransform.x + positions[state.formation][dancer.role].x,
        y: dancerTransform.y + positions[state.formation][dancer.role].y
    } : positions[state.formation][startingPositionName]
    const targetPosition = positions[state.formation][targetPositionName]

    return calculateRotationFromPositions(state, startingPosition, targetPosition, direction)
}

function calculateRotationFromPositions(state, startingPosition, targetPosition, direction) {
    let angle = ((Math.atan2(targetPosition.y - startingPosition.y, targetPosition.x - startingPosition.x) * 180) / Math.PI) + 270;
    angle = angle % 360
    if (angle === 0 && direction === Directions.RIGHT) {
        angle = 360
    }

    return angle
}

function findShortestRotation(rotationRight, dancer, rotationLeft, overrideTurnDirection) {
    const differenceRight = Math.abs(rotationRight.rotation - dancer.currentOffset.rotation) % 360
    const differenceLeft = Math.abs(rotationLeft.rotation - dancer.currentOffset.rotation) % 360

    let rotation
    if (differenceLeft < differenceRight) {
        rotation = rotationLeft.rotation
    } else {
        rotation = rotationRight.rotation
    }

    if (overrideTurnDirection === Directions.RIGHT) {
        rotation = rotationRight.rotation
    } else if (overrideTurnDirection === Directions.LEFT) {
        rotation = rotationLeft.rotation
    }
    return rotation;
}

function calculateShortestTurnRotation(dancer, targetPositionName, state, overrideTurnDirection) {
    const rotationRight = calculateAngleAndRotation(state, dancer.currentOffset.rotation, dancer.currentNamedPosition, targetPositionName, Directions.RIGHT, dancer)
    const rotationLeft = calculateAngleAndRotation(state, dancer.currentOffset.rotation, dancer.currentNamedPosition, targetPositionName, Directions.LEFT, dancer)

    return findShortestRotation(rotationRight, dancer, rotationLeft, overrideTurnDirection);
}

/**
 * Helper move to face partner.  Can be done in conjunction with other switchWithPartner, so you can disable ticks
 * @param danceMaster
 * @param tick
 * @param overrideTurnDirection
 * @returns {Promise<Awaited<unknown>[]>}
 */
export const facePartner = async (danceMaster, tick = false, overrideTurnDirection) => {
    updateHeader('Face Partner')
    const state = danceMaster.state
    const timelines = [];
    switch (state.formation) {
        case Formations.TWO_FACING_TWO:
        case Formations.EIGHT_HAND_SQUARE:
            for (const dancer of Object.values(state.dancers)) {

                const partnerPositionName = danceMaster.getPositionNameFromRelationship(dancer.currentNamedPosition, Relationships.PARTNER)
                const rotation = calculateShortestTurnRotation(dancer, partnerPositionName, state, overrideTurnDirection);
                if (rotation % 360 === dancer.currentOffset.rotation % 360) {
                    // no rotation needed
                    continue;
                }

                const arrowTimeline = anime.timeline({
                    duration: 2 * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                arrowTimeline.add({
                    targets: dancer.arrowId,
                    rotate: rotation,
                    complete: () => {
                        dancer.currentOffset.rotation = rotation
                        dancer.facingPartner = true
                    }
                })

                timelines.push(arrowTimeline)
            }
            break;
        default:
            throw new Error("invalid formation")
    }
    if (tick) {
        const tickerTimeline = makeTickerTimeline(2);
        timelines.push(tickerTimeline)
    }

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Helper move to face the center.  Can be done in conjunction with other switchWithPartner, so you can disable ticks.
 * @param danceMaster
 * @param tick
 * @param overrideTurnDirection
 * @returns {Promise<Awaited<unknown>[]>}
 */
export const faceCenter = async (danceMaster, tick = false, overrideTurnDirection) => {
    updateHeader('Face Center')
    const state = danceMaster.state
    const timelines = [];
    switch (state.formation) {
        // case Formations.SOLO:
        case Formations.TWO_FACING_TWO:
        case Formations.EIGHT_HAND_SQUARE:
            for (const dancer of Object.values(state.dancers)) {
                const opposite = danceMaster.getPositionNameFromRelationship(dancer.currentNamedPosition, Relationships.OPPOSITE)
                const rotation = calculateShortestTurnRotation(dancer, opposite, state, overrideTurnDirection);

                if (rotation % 360 === dancer.currentOffset.rotation % 360) {
                    // no rotation required, skip
                    continue
                }

                const arrowTimeline = anime.timeline({
                    duration: 2 * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                arrowTimeline.add({
                    targets: dancer.arrowId,
                    rotate: rotation,
                    complete: () => {
                        dancer.currentOffset.rotation = rotation
                        dancer.facingPartner = false
                    }
                })

                timelines.push(arrowTimeline)
            }
            break;
        default:
            throw new Error("invalid formation")
    }
    if (tick) {
        const tickerTimeline = makeTickerTimeline(2);
        timelines.push(tickerTimeline)
    }

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}

function makeTickerTimeline(numOfBeats) {
    const tickerTimeline = anime.timeline({
        duration: BEATS,
        easing: 'linear',
        autoplay: false,
    })

    for (let i = 0; i < numOfBeats; i++) {
        tickerTimeline.add({
            complete: () => {
                tick();
            }
        })
    }
    return tickerTimeline;
}

/**
 * Helper function to get the position of the inner circle
 * @param formation
 * @param position
 * @returns {{x: number, y}|{x, y: number}|{x, y: *}|{x: *, y}}
 */
const getInnerCirclePosition = (formation, position) => {
    const normalPosition = positions[formation][position]
    const group = FormationGroups[formation][position]
    const offset = 100;
    switch (group) {
        case 'TOP':
            return {
                x: normalPosition.x,
                y: normalPosition.y + offset
            }
        case 'BOTTOM':
            return {
                x: normalPosition.x,
                y: normalPosition.y - offset
            }
        case '1st SIDE':
            return {
                x: normalPosition.x - offset,
                y: normalPosition.y
            }
        case '2nd SIDE':
            return {
                x: normalPosition.x + offset,
                y: normalPosition.y
            }
    }
}
export const sound = new Audio('clap.mp3');
sound.preload = 'auto'
export const clapTwice = async (danceMaster) => {
    updateHeader('Clap Twice')
    const state = danceMaster.state
    const timelines = []

    const tickerTimeline = makeTickerTimeline(2);
    timelines.push(tickerTimeline)

    const clapTimeline = anime.timeline({
        duration: 1 * BEATS,
        autoplay: false
    })

    clapTimeline.add({
        begin: () => {
            sound.play()
        }
    })

    clapTimeline.add({
        begin: () => {
            sound.play()
        }
    })

    timelines.push(clapTimeline)

    for (const dancer of Object.values(state.dancers)) {
        // scale element up and down
        const dancerTimeline = anime.timeline({
            duration: .25 * BEATS,
            autoplay: false
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            scale: 1.2,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            scale: 1,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            scale: 1.2,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            scale: 1,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })

        dancerTimeline.add({
            targets: dancer.targetId,
            direction: 'alternate',
            easing: 'easeOutElastic(1, .6)'
        })
        timelines.push(dancerTimeline)
    }

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Helper move to make an inner circle and rotate a quarter position
 * @param danceMaster
 * @param direction
 * @param {boolean} leadsActive - true if the leads are moving, false if the follows are moving
 * @param {boolean} endInRegularPosition - true if the dancers should end in their regular position, false if they should end in the opposite role position
 * @param numBeats
 * @returns {Promise<void>}
 */
export const innerQuarterCircle = async (danceMaster, direction, leadsActive, endInRegularPosition, numBeats = 4) => {
    updateHeader(`Inner Quarter Circle ${direction} - ${leadsActive ? 'Leads' : 'Follows'}`)
    const state = danceMaster.state
    const timelines = [];

    switch (state.formation) {
        case Formations.EIGHT_HAND_SQUARE:
            for (const dancer of Object.values(state.dancers)) {
                const positionIndex = DancerLayouts[state.formation].indexOf(dancer.currentNamedPosition)

                if (leadsActive && positionIndex % 2 === 1) {
                    // if leads are active, skip the follows
                    continue
                } else if (!leadsActive && positionIndex % 2 === 0) {
                    // if follows are active, skip the leads
                    continue
                }

                const timeline = anime.timeline({
                    targets: dancer.targetId,
                    duration: numBeats * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                let modifiedDirection = direction
                if (dancer.turnedAround) {
                    // invert the direction if the dancer is turned around
                    modifiedDirection = direction === Directions.RIGHT ? Directions.LEFT : Directions.RIGHT
                }

                const nextPositionName = danceMaster.getNextPositionNameOfSameRole(modifiedDirection, dancer.currentNamedPosition)
                const homePosition = positions[state.formation][dancer.role]
                const nextPosition = endInRegularPosition ? positions[state.formation][nextPositionName] : getInnerCirclePosition(state.formation, nextPositionName)

                const translateX = nextPosition.x - homePosition.x
                const translateY = nextPosition.y - homePosition.y


                timeline.add({
                    translateX,
                    translateY,
                    complete: () => {
                        dancer.currentNamedPosition = nextPositionName
                        if (endInRegularPosition) {
                            dancer.turnedAround = false
                        }
                    }
                })

                timelines.push(timeline)

                const arrowTimeline = anime.timeline({
                    duration: numBeats * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                const newRotation = calculateRotation(state, dancer, nextPositionName, modifiedDirection);

                arrowTimeline.add({
                    targets: dancer.arrowId,
                    rotate: newRotation,
                    complete: () => {
                        dancer.currentOffset.rotation = newRotation
                    }
                })

                timelines.push(arrowTimeline)
            }
            break;
        default:
            throw new Error("invalid formation")
    }
    const tickerTimeline = makeTickerTimeline(numBeats);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Helper move to do a quarter circle in a specific direction
 * @param danceMaster
 * @param direction
 * @returns {Promise<Awaited<unknown>[]>}
 */
export const quarterCircle = async (danceMaster, direction) => {
    updateHeader("Quarter Circle " + direction)
    const state = danceMaster.state
    const timelines = [];

    switch (state.formation) {
        case Formations.EIGHT_HAND_SQUARE:
            for (const dancer of Object.values(state.dancers)) {
                const timeline = anime.timeline({
                    targets: dancer.targetId,
                    duration: 2 * BEATS,
                    easing: 'linear',
                    autoplay: false
                })


                const nextPositionName = danceMaster.getNextPositionNameOfSameRole(direction, dancer.currentNamedPosition)
                const intermediateNextPositionName = danceMaster.getNextPosition(direction, dancer.currentNamedPosition)
                const homePosition = positions[state.formation][dancer.role]
                const intermediateNextPosition = positions[state.formation][intermediateNextPositionName]
                const nextPosition = positions[state.formation][nextPositionName]

                const intermediateTranslateX = intermediateNextPosition.x - homePosition.x
                const intermediateTranslateY = intermediateNextPosition.y - homePosition.y
                const translateX = nextPosition.x - homePosition.x
                const translateY = nextPosition.y - homePosition.y

                timeline.add({
                    translateX: intermediateTranslateX,
                    translateY: intermediateTranslateY,
                    complete: () => {
                        dancer.currentNamedPosition = intermediateNextPositionName
                    }
                }).add({
                    translateX,
                    translateY,
                    complete: () => {
                        dancer.currentNamedPosition = nextPositionName
                    }
                })

                timelines.push(timeline)

                const arrowTimeline = anime.timeline({
                    duration: 4 * BEATS,
                    easing: 'linear',
                    autoplay: false
                })

                const newRotation = calculateRotation(state, dancer, nextPositionName, direction);

                arrowTimeline.add({
                    targets: dancer.arrowId,
                    rotate: newRotation,
                    complete: () => {
                        dancer.currentOffset.rotation = newRotation
                    }
                })

                timelines.push(arrowTimeline)
            }
            break;
        default:
            throw new Error("invalid formation")
    }
    const tickerTimeline = makeTickerTimeline(4);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Helper move to do a circle halfway in a specific direction
 * @param danceMaster
 * @param direction
 * @returns {Promise<void>}
 */
const circleHalfway = async (danceMaster, direction) => {
    updateHeader(`Circle ${direction}`)
    await quarterCircle(danceMaster, direction)
    await quarterCircle(danceMaster, direction)
}
/**
 * Helper move to do two threes in a specific direction
 * @param danceMaster
 * @param direction
 * @param whosActive
 * @returns {Promise<Awaited<unknown>[]>}
 */
const twoThrees = async (danceMaster, direction, whosActive = Roles.ALL) => {
    const state = danceMaster.state
    updateHeader("Two Threes")
    const timelines = [];
    for (const dancer of Object.values(state.dancers)) {
        if (whosActive === Roles.LEAD && !dancer.role.includes("lead")) {
            continue
        } else if (whosActive === Roles.FOLLOW && !dancer.role.includes("follow")) {
            continue
        }

        const timeline = anime.timeline({
            targets: dancer.targetId,
            duration: 1 * BEATS,
            easing: 'easeOutQuint',
            autoplay: false
        })

        const currentOffsets = getTranslation(dancer)
        const currentDirection = getFacingDirection(dancer)

        let firstTranslateX = currentOffsets.x
        let secondTranslateX = currentOffsets.x
        let firstTranslateY = currentOffsets.y
        let secondTranslateY = currentOffsets.y

        const bumpAmount = 10;
        switch (currentDirection) {
            case Directions.DOWN:
                firstTranslateX -= bumpAmount
                secondTranslateX += bumpAmount
                break;
            case Directions.UP:
                firstTranslateX += bumpAmount
                secondTranslateX -= bumpAmount
                break;
            case Directions.LEFT:
                firstTranslateY -= bumpAmount
                secondTranslateY += bumpAmount
                break;
            case Directions.RIGHT:
                firstTranslateY += bumpAmount
                secondTranslateY -= bumpAmount
        }

        timeline.add({
            translateX: direction === Directions.RIGHT ? firstTranslateX : secondTranslateX,
            translateY: direction === Directions.RIGHT ? firstTranslateY : secondTranslateY,
        }).add({
            translateX: currentOffsets.x,
            translateY: currentOffsets.y
        }).add({
            translateX: direction === Directions.RIGHT ? secondTranslateX : firstTranslateX,
            translateY: direction === Directions.RIGHT ? secondTranslateY : firstTranslateY,
        }).add({
            translateX: currentOffsets.x,
            translateY: currentOffsets.y
        })

        timelines.push(timeline)
    }
    const tickerTimeline = makeTickerTimeline(4);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Helper move to sidestep a specific direction
 * @param danceMaster
 * @param direction
 * @returns {Promise<Awaited<unknown>[]>}
 */
const sidestep = async (danceMaster, direction) => {
    updateHeader(`Sidestep ${direction}`)
    const state = danceMaster.state
    const timelines = [];
    for (const dancer of Object.values(state.dancers)) {
        const timeline = anime.timeline({
            targets: dancer.targetId,
            duration: 4 * BEATS,
            easing: 'linear',
            autoplay: false
        })
        const currentOffsets = getTranslation(dancer)
        const directionFacing = getFacingDirection(dancer)
        let xOffset = currentOffsets.x
        let yOffset = currentOffsets.y

        const distance = 100;
        switch (directionFacing) {
            case Directions.LEFT:
                yOffset += direction === Directions.RIGHT ? -distance : distance
                break;
            case Directions.RIGHT:
                yOffset += direction === Directions.RIGHT ? distance : -distance
                break;
            case Directions.UP:
                xOffset += direction === Directions.RIGHT ? distance : -distance
                break;
            case Directions.DOWN:
                xOffset += direction === Directions.RIGHT ? -distance : distance
                break;
        }

        timeline.add({
            translateX: xOffset,
            translateY: yOffset,
        }).add({
            translateX: currentOffsets.x,
            translateY: currentOffsets.y,
        })

        timelines.push(timeline)
    }
    const tickerTimeline = makeTickerTimeline(8);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Helper move to turn your partner a specific direction
 * @param danceMaster
 * @param direction
 * @returns {Promise<Awaited<unknown>[]>}
 */
const turnPartnerHalfway = async (danceMaster, direction) => {
    updateHeader(`Turn Partner Halfway ${direction}`)
    const state = danceMaster.state

    const timelines = [];

    for (const dancer of Object.values(state.dancers)) {

        const partnerPositionName = danceMaster.getPositionNameFromRelationship(dancer.currentNamedPosition, Relationships.PARTNER)
        const currentPosition = positions[state.formation][dancer.currentNamedPosition]
        const partnerPosition = positions[state.formation][partnerPositionName]
        const currentOffsets = getTranslation(dancer)

        const halfwayPoint = {
            x: (currentPosition.x + partnerPosition.x) / 2,
            y: (currentPosition.y + partnerPosition.y) / 2
        }

        const desiredDistance = Math.sqrt(Math.pow(halfwayPoint.x - currentPosition.x, 2) + Math.pow(halfwayPoint.y - currentPosition.y, 2)) / 2
        const modifier = desiredDistance / Math.sqrt(Math.pow(currentPosition.y - partnerPosition.y, 2) + Math.pow(partnerPosition.x - currentPosition.x, 2))

        const pointModifier = {
            x: modifier * (currentPosition.y - partnerPosition.y),
            y: modifier * (partnerPosition.x - currentPosition.x)
        }

        const intermediatePoint = {
            x: direction === Directions.RIGHT ? halfwayPoint.x - pointModifier.x : halfwayPoint.x + pointModifier.x,
            y: direction === Directions.RIGHT ? halfwayPoint.y - pointModifier.y : halfwayPoint.y + pointModifier.y
        }

        const timeline = anime.timeline({
            targets: dancer.targetId,
            duration: 1 * BEATS,
            easing: 'linear',
            autoplay: false,
            complete: () => {
                dancer.currentNamedPosition = partnerPositionName
            }
        })

        const intermediateTranslateX = currentOffsets.x + (intermediatePoint.x - currentPosition.x)
        const intermediateTranslateY = currentOffsets.y + (intermediatePoint.y - currentPosition.y)

        const endTranslateX = currentOffsets.x + (partnerPosition.x - currentPosition.x)
        const endTranslateY = currentOffsets.y + (partnerPosition.y - currentPosition.y)

        timeline.add({
            translateX: intermediateTranslateX,
            translateY: intermediateTranslateY
        }).add({
            translateX: endTranslateX,
            translateY: endTranslateY
        })

        timelines.push(timeline)

        const newRotation = dancer.currentOffset.rotation += (direction === Directions.RIGHT ? 180 : -180)
        const arrowTimeline = anime.timeline({
            duration: 2 * BEATS,
            easing: 'linear',
            autoplay: false
        })

        arrowTimeline.add({
            targets: dancer.arrowId,
            rotate: newRotation,
            complete: () => {
                dancer.currentOffset.rotation = newRotation
            }
        })

        timelines.push(arrowTimeline)
    }
    const tickerTimeline = makeTickerTimeline(2);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 *
 * @param {DanceMaster} danceMaster
 * @param {"ALL" | "LEADS" | "FOLLOWS"} activeRoles
 * @returns {Promise<Awaited<unknown>[]>}
 */
const turnAround = async (danceMaster, activeRoles) => {
    updateHeader('Turn Around')
    const state = danceMaster.state
    const timelines = [];

    for (const dancer of Object.values(state.dancers)) {
        if (activeRoles === "LEADS" && DancerLayouts[state.formation].indexOf(dancer.currentNamedPosition) % 2 === 1) {
            continue
        } else if (activeRoles === "FOLLOWS" && DancerLayouts[state.formation].indexOf(dancer.currentNamedPosition) % 2 === 0) {
            continue
        }

        const timeline = anime.timeline({
            targets: dancer.arrowId,
            duration: 4 * BEATS,
            easing: 'linear',
            autoplay: false
        })


        timeline.add({
            rotate: dancer.currentOffset.rotation + 180,
            complete: () => {
                dancer.currentOffset.rotation += 180
                dancer.turnedAround = !dancer.turnedAround
            }
        })

        timelines.push(timeline)
    }
    const tickerTimeline = makeTickerTimeline(4);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}
/**
 * Move to swing partner
 * @param danceMaster
 * @returns {Promise<void>}
 */
export const swingPartner = async (danceMaster) => {
    updateHeader('Swing Partner')
    freezeHeader()
    await turnPartnerHalfway(danceMaster, Directions.RIGHT)
    await turnPartnerHalfway(danceMaster, Directions.RIGHT)
    await turnPartnerHalfway(danceMaster, Directions.RIGHT)
    await turnPartnerHalfway(danceMaster, Directions.RIGHT)
    unfreezeHeader()
}

export const quarterHouse = async (danceMaster, direction) => {
    updateHeader(`Quarter House ${direction}`)
    const state = danceMaster.state
    const timelines = [];

    // groups dancers
    const groups = Object.values(state.dancers).reduce((acc, dancer) => {
        const group = FormationGroups[state.formation][dancer.currentNamedPosition]
        if (!acc[group]) {
            acc[group] = []
        }
        acc[group].push(dancer)
        return acc
    }, {})

    for (const group of Object.values(groups)) {
        const lead = group.find(dancer => DancerLayouts[state.formation].indexOf(dancer.currentNamedPosition) % 2 === 0)
        const follow = group.find(dancer => DancerLayouts[state.formation].indexOf(dancer.currentNamedPosition) % 2 === 1)

        const timeline = anime.timeline({
            duration: 2 * BEATS,
            easing: 'linear',
            autoplay: false
        })

        const leadArrowTimeline = anime.timeline({
            targets: lead.arrowId,
            duration: 2 * BEATS,
            easing: 'linear',
            autoplay: false
        })

        const followArrowTimeline = anime.timeline({
            targets: follow.arrowId,
            duration: 2 * BEATS,
            easing: 'linear',
            autoplay: false
        })

        let leadsMoving = direction === Directions.RIGHT;
        for (let i = 0; i < 2; ++i) {
            const movingDancer = leadsMoving ? lead : follow;
            const partner = leadsMoving ? follow : lead;
            const movingTimeline = leadsMoving ? leadArrowTimeline : followArrowTimeline;

            const currentPosition = positions[state.formation][movingDancer.currentNamedPosition]
            const nextPositionName = danceMaster.getNextPositionNameOfSameRole(direction, movingDancer.currentNamedPosition)
            const partnerNextPositionName = danceMaster.getNextPositionNameOfSameRole(direction, partner.currentNamedPosition)
            const nextPosition = positions[state.formation][nextPositionName]
            const movingCurrentOffsets = getTranslation(movingDancer)

            const translateX = movingCurrentOffsets.x + (nextPosition.x - currentPosition.x)
            const translateY = movingCurrentOffsets.y + (nextPosition.y - currentPosition.y)

            timeline.add({
                targets: movingDancer.targetId,
                translateX,
                translateY,
                complete: () => {
                    movingDancer.currentNamedPosition = nextPositionName
                }
            })

            let intermediateStartPosition
            let intermediateTargetPosition
            if (direction === Directions.RIGHT) {
                if (leadsMoving) {
                    // leads look at their partner's position from their next position
                    intermediateStartPosition = nextPositionName
                    intermediateTargetPosition = partner.currentNamedPosition
                } else {
                    // follows look at their partner's new position from their current position
                    intermediateStartPosition = movingDancer.currentNamedPosition
                    intermediateTargetPosition = partnerNextPositionName
                }
            } else {
                if (leadsMoving) {
                    // leads look at their partner's new position from their position (they moved first)
                    intermediateStartPosition = movingDancer.currentNamedPosition
                    intermediateTargetPosition = partnerNextPositionName
                } else {
                    // follows look at their partner's current position from their new position
                    intermediateStartPosition = nextPositionName
                    intermediateTargetPosition = partner.currentNamedPosition
                }
            }

            const intermediateAngleAndRotation = calculateAngleAndRotation(state, movingDancer.currentOffset.rotation, intermediateStartPosition, intermediateTargetPosition, direction, movingDancer)

            movingTimeline.add({
                targets: movingDancer.arrowId,
                rotate: intermediateAngleAndRotation.rotation,
                complete: () => {
                    movingDancer.currentOffset.rotation = intermediateAngleAndRotation.rotation
                }
            })

            const finalAngleAndRotation = calculateAngleAndRotation(state, intermediateAngleAndRotation.rotation, nextPositionName, partnerNextPositionName, direction, movingDancer)

            movingTimeline.add({
                rotate: finalAngleAndRotation.rotation,
                complete: () => {
                    movingDancer.currentOffset.rotation = finalAngleAndRotation.rotation
                }
            })

            leadsMoving = !leadsMoving
        }
        timelines.push(timeline)
        timelines.push(leadArrowTimeline)
        timelines.push(followArrowTimeline)
    }

    const tickerTimeline = makeTickerTimeline(4);
    timelines.push(tickerTimeline)

    timelines.forEach(timeline => timeline.play())
    return Promise.all(timelines.map(timeline => timeline.finished))
}

const getDancerTransformValues = (dancer) => {
    const transform = dancer.elem.style.transform
    const transformX = parseInt(transform.match(/translateX\((.+)px\) /)[1])
    const transformY = parseInt(transform.match(/translateY\((.+)px\)/)[1])

    return {
        x: transformX,
        y: transformY
    }
}

export const facePosition = (danceMaster, dancer, targetPositionName) => {
    if (dancer.currentNamedPosition === targetPositionName) {
        return
    }

    const rotation = calculateShortestTurnRotation(dancer, targetPositionName, danceMaster.state)

    const timeline = anime.timeline({
        targets: dancer.arrowId,
        duration: 2 * BEATS,
        easing: 'linear',
        autoplay: false
    })

    timeline.add({
        rotate: rotation,
        complete: () => {
            dancer.currentOffset.rotation = rotation
        }
    })

    timeline.play()

    return timeline.finished
}

const goToPosition = (danceMaster, dancer, targetPositionName) => {
    const homePosition = positions[danceMaster.state.formation][dancer.role]
    const targetPosition = positions[danceMaster.state.formation][targetPositionName]

    const diffX = targetPosition.x - homePosition.x
    const diffY = targetPosition.y - homePosition.y

    const timeline = anime.timeline({
        targets: dancer.targetId,
        duration: 2 * BEATS,
        easing: 'linear',
        autoplay: false
    })

    timeline.add({
        translateX: diffX,
        translateY: diffY,
        complete: () => {
            dancer.currentNamedPosition = targetPositionName
        }
    })

    timeline.play()

    return timeline.finished
}

export const goHome = async (danceMaster) => {
    updateHeader('Go Home')
    let timelines = []
    for (const dancer of Object.values(danceMaster.state.dancers)) {
        dancer.turnedAround = false
    }

    for (const dancer of Object.values(danceMaster.state.dancers)) {
        timelines.push(facePosition(danceMaster, dancer, dancer.role))
    }
    await Promise.all(timelines)
    timelines = []

    for (const dancer of Object.values(danceMaster.state.dancers)) {
        timelines.push(goToPosition(danceMaster, dancer, dancer.role))
    }
    await Promise.all(timelines)
    for (const dancer of Object.values(danceMaster.state.dancers)) {
        danceMaster.normalizeDancerRotations()
    }

    await faceCenter(danceMaster, false)
    resetCount()
    clearHeader()
}

export const randomizeDancerOffsets = (danceMaster) => {
    const min = -1
    const max = 1
    for (const dancer of Object.values(danceMaster.state.dancers)) {
        dancer.currentOffset = {
            x: (Math.random() * (max - min) + min) * 100,
            y: (Math.random() * (max - min) + min) * 100,
            rotation: Math.random() * 360
        }
        dancer.currentNamedPosition = Positions.OUT_OF_POSITION
        dancer.elem.style.transform = `translateX(${dancer.currentOffset.x}px) translateY(${dancer.currentOffset.y}px)`
        dancer.arrowElem.style.transform = `rotate(${dancer.currentOffset.rotation}deg)`
    }
}

export const mingle = async (danceMaster) => {
    updateHeader('Mingling')
    danceMaster.mingling = true
    while (danceMaster.mingling) {
        const timelines = []
        for (const dancer of Object.values(danceMaster.state.dancers)) {
            dancer.currentNamedPosition = Positions.OUT_OF_POSITION
            const currentOffsets = getDancerTransformValues(dancer)
            const currentPosition = {
                x: currentOffsets.x + positions[danceMaster.state.formation][dancer.role].x,
                y: currentOffsets.y + positions[danceMaster.state.formation][dancer.role].y
            }
            const currentAngle = dancer.currentOffset.rotation + 90
            let newAngle = Math.random() * 360
            let distance = Math.random() * 200

            // if dancer went out of bounds, reverse they directions
            if (currentPosition.x < 50) {
                newAngle = 270
                distance = 100
            } else if (currentPosition.x > window.innerWidth - 50) {
                newAngle = 90
                distance = 100
            } else if (currentPosition.y < 300) {
                newAngle = 0
                distance = 100
            } else if (currentPosition.y > window.innerHeight - 100) {
                newAngle = 180
                distance = 100
            }

            const nextPosition = {
                x: currentOffsets.x + distance * Math.cos(currentAngle * (Math.PI / 180)),
                y: currentOffsets.y + distance * Math.sin(currentAngle * (Math.PI / 180))
            }

            const timeline = anime.timeline({
                duration: 4 * BEATS,
                easing: 'linear',
                autoplay: false
            })

            timeline.add({
                targets: dancer.targetId,
                translateX: nextPosition.x,
                translateY: nextPosition.y,
                complete: () => {
                    dancer.currentOffset.x = nextPosition.x
                    dancer.currentOffset.y = nextPosition.y
                }
            }).add({
                targets: dancer.arrowId,
                rotate: newAngle,
                complete: () => {
                    dancer.currentOffset.rotation = newAngle
                }
            })
            timelines.push(timeline)
        }
        timelines.forEach(timeline => timeline.play())
        danceMaster.minglingTimelinesPromise = Promise.all(timelines.map(timeline => timeline.finished))
        await danceMaster.minglingTimelinesPromise
    }
}

export const quarterHouseRight = (danceMaster) => quarterHouse(danceMaster, Directions.RIGHT);
export const quarterHouseLeft = (danceMaster) => quarterHouse(danceMaster, Directions.LEFT);
export const leadsTurnAround = (danceMaster) => turnAround(danceMaster, "LEADS");
export const followsTurnAround = (danceMaster) => turnAround(danceMaster, "FOLLOWS");
export const allTurnAround = (danceMaster) => turnAround(danceMaster, "ALL");
export const turnPartnerHalfwayByTheRight = (danceMaster) => turnPartnerHalfway(danceMaster, Directions.RIGHT);
export const turnPartnerHalfwayByTheLeft = (danceMaster) => turnPartnerHalfway(danceMaster, Directions.LEFT);
export const sidestepRight = (danceMaster) => sidestep(danceMaster, Directions.RIGHT);
export const sidestepLeft = (danceMaster) => sidestep(danceMaster, Directions.LEFT);
export const twoThreesToTheRight = (danceMaster) => twoThrees(danceMaster, Directions.RIGHT);
export const twoThreesToTheLeft = (danceMaster) => twoThrees(danceMaster, Directions.LEFT);
export const followsTwoThreesToTheLeftWhileTurningAround = (danceMaster) => Promise.all([twoThrees(danceMaster, Directions.LEFT, Roles.FOLLOW), followsTurnAround(danceMaster)]);
export const leadsTwoThreesToTheLeftWhileTurningAround = (danceMaster) => Promise.all([twoThrees(danceMaster, Directions.LEFT, Roles.LEAD), leadsTurnAround(danceMaster)]);
export const followsTwoThreesToTheRightWhileTurningAround = (danceMaster) => Promise.all([twoThrees(danceMaster, Directions.RIGHT, Roles.FOLLOW), followsTurnAround(danceMaster)]);
export const leadsTwoThreesToTheRightWhileTurningAround = (danceMaster) => Promise.all([twoThrees(danceMaster, Directions.RIGHT, Roles.LEAD), leadsTurnAround(danceMaster)]);
export const twoThreesToTheRightEndFacingPartner = (danceMaster) => Promise.all([twoThrees(danceMaster, Directions.RIGHT), facePartner(danceMaster)]);
export const twoThreesToTheLeftEndFacingPartner = (danceMaster) => Promise.all([twoThrees(danceMaster, Directions.LEFT), facePartner(danceMaster)]);
export const fastSwitchWithPartner = (danceMaster) => switchWithPartner(danceMaster, 2);
export const quarterCircleLeft = (danceMaster) => quarterCircle(danceMaster, Directions.LEFT);
export const quarterCircleRight = (danceMaster) => quarterCircle(danceMaster, Directions.RIGHT);
export const circleLeftHalfway = (danceMaster) => circleHalfway(danceMaster, Directions.LEFT);
export const circleRightHalfway = (danceMaster) => circleHalfway(danceMaster, Directions.RIGHT);
export const followsFastInnerCircleLeft = (danceMaster) => [1, 2, 3, 4].reduce((promise, val) => {
    return promise.then(() => innerQuarterCircle(danceMaster, Directions.LEFT, false, val === 4, 2))
}, Promise.resolve());
export const leadsFastInnerCircleLeft = (danceMaster) => [1, 2, 3, 4].reduce((promise, val) => {
    return promise.then(() => innerQuarterCircle(danceMaster, Directions.LEFT, true, val === 4, 2))
}, Promise.resolve());
export const leadsInnerQuarterCircleRight = (danceMaster) => innerQuarterCircle(danceMaster, Directions.RIGHT, true, false);
export const leadsInnerQuarterCircleLeft = (danceMaster) => innerQuarterCircle(danceMaster, Directions.LEFT, true, false);
export const followsInnerQuarterCircleRight = (danceMaster) => innerQuarterCircle(danceMaster, Directions.RIGHT, false, false);
export const followsInnerQuarterCircleLeft = (danceMaster) => innerQuarterCircle(danceMaster, Directions.LEFT, false, false);
export const leadsInnerQuarterCircleRightEndHome = (danceMaster) => innerQuarterCircle(danceMaster, Directions.RIGHT, true, true);
export const leadsInnerQuarterCircleLeftEndHome = (danceMaster) => innerQuarterCircle(danceMaster, Directions.LEFT, true, true);
export const followsInnerQuarterCircleRightEndHome = (danceMaster) => innerQuarterCircle(danceMaster, Directions.RIGHT, false, true);
export const followsInnerQuarterCircleLeftEndHome = (danceMaster) => innerQuarterCircle(danceMaster, Directions.LEFT, false, true);


export class Moves {
    constructor(moves = []) {
        this.moves = moves
    }

    async do(danceMaster) {
        return this.moves.reduce((promise, move) => {
            return promise.then(() => move(danceMaster))
        }, Promise.resolve())
    }
}
