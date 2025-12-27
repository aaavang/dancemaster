/**
 * Helper enum for formations
 * @typedef {keyof Formations} Formation
 */
export const Formations = {
    EIGHT_HAND_SQUARE: 'EIGHT_HAND_SQUARE',
    TWO_FACING_TWO: 'TWO_FACING_TWO',
    // SOLO: 'SOLO',
    THREE_FACING_THREE: 'THREE_FACING_THREE',
    // FOUR_FACING_FOUR: 'FOUR_FACING_FOUR',
    // CIRCLE: 'CIRCLE',
}
/**
 * Helper enum for orientations
 * @typedef {keyof Orientations} Orientation
 */
export const Orientations = {
    TOPS: 'TOPS',
    SIDES: 'SIDES',
    OTHER: 'OTHER'
}

export const Role = {
    LEAD: 'LEAD',
    FOLLOW: 'FOLLOW',
    ALL: 'ALL',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    CENTER: 'CENTER'
}

/**
 * Helper enum for relationships
 * @typedef {keyof Relationships} Relationship
 */
export const Relationships = {
    PARTNER: 'PARTNER',
    CORNER: 'CORNER',
    OPPOSITE: 'OPPOSITE',
    CONTRARY: 'CONTRARY'
}
/**
 * Helper enum for positions
 * @typedef {keyof Positions} Position
 */
export const Positions = {
    FIRST_TOP_LEAD: 'first-top-lead',
    FIRST_TOP_FOLLOW: 'first-top-follow',
    SECOND_TOP_LEAD: 'second-top-lead',
    SECOND_TOP_FOLLOW: 'second-top-follow',
    FIRST_SIDE_LEAD: 'first-side-lead',
    FIRST_SIDE_FOLLOW: 'first-side-follow',
    SECOND_SIDE_LEAD: 'second-side-lead',
    SECOND_SIDE_FOLLOW: 'second-side-follow',
    TOP_CENTER: 'top-center',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_CENTER: 'bottom-center',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
    OUT_OF_POSITION: 'out-of-position'
}
/**
 * Helper enum for positions
 * @typedef {keyof DancerLayouts} DancerLayout
 */
export const DancerLayouts = {
    [Formations.EIGHT_HAND_SQUARE]: [
        Positions.FIRST_TOP_LEAD,
        Positions.FIRST_TOP_FOLLOW,
        Positions.SECOND_SIDE_LEAD,
        Positions.SECOND_SIDE_FOLLOW,
        Positions.SECOND_TOP_LEAD,
        Positions.SECOND_TOP_FOLLOW,
        Positions.FIRST_SIDE_LEAD,
        Positions.FIRST_SIDE_FOLLOW
    ],
    [Formations.TWO_FACING_TWO]: [
        Positions.FIRST_TOP_LEAD,
        Positions.FIRST_TOP_FOLLOW,
        Positions.SECOND_TOP_LEAD,
        Positions.SECOND_TOP_FOLLOW
    ],
    [Formations.THREE_FACING_THREE]: [
        Positions.TOP_LEFT,
        Positions.TOP_CENTER,
        Positions.TOP_RIGHT,
        Positions.BOTTOM_LEFT,
        Positions.BOTTOM_CENTER,
        Positions.BOTTOM_RIGHT
    ],
}
export const Group = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    FIRST_TOP: '1st TOP',
    SECOND_TOP: '2nd TOP',
    FIRST_SIDE: '1st SIDE',
    SECOND_SIDE: '2nd SIDE'
}
/**
 * Helper enum for formation groups
 * @typedef {keyof FormationGroups} Group
 */
export const FormationGroups = {
    [Formations.EIGHT_HAND_SQUARE]: {
        [Positions.FIRST_TOP_LEAD]: 'TOP',
        [Positions.FIRST_TOP_FOLLOW]: 'TOP',
        [Positions.SECOND_TOP_LEAD]: 'BOTTOM',
        [Positions.SECOND_TOP_FOLLOW]: 'BOTTOM',
        [Positions.FIRST_SIDE_LEAD]: '1st SIDE',
        [Positions.FIRST_SIDE_FOLLOW]: '1st SIDE',
        [Positions.SECOND_SIDE_LEAD]: '2nd SIDE',
        [Positions.SECOND_SIDE_FOLLOW]: '2nd SIDE',
    },
    [Formations.TWO_FACING_TWO]: {
        [Positions.FIRST_TOP_LEAD]: 'TOP',
        [Positions.FIRST_TOP_FOLLOW]: 'TOP',
        [Positions.SECOND_TOP_LEAD]: 'BOTTOM',
        [Positions.SECOND_TOP_FOLLOW]: 'BOTTOM',
    },
    [Formations.THREE_FACING_THREE]: {
        [Positions.TOP_LEFT]: 'TOP',
        [Positions.TOP_CENTER]: 'TOP',
        [Positions.TOP_RIGHT]: 'TOP',
        [Positions.BOTTOM_LEFT]: 'BOTTOM',
        [Positions.BOTTOM_CENTER]: 'BOTTOM',
        [Positions.BOTTOM_RIGHT]: 'BOTTOM',
    },
    // [Formations.SOLO]: {
    //     [Positions.FIRST_TOP_LEAD]: 'TOP',
    // }
}
/**
 * Helper enum for directions
 * @typedef {keyof Directions} Direction
 */
export const Directions = {
    RIGHT: 'RIGHT',
    LEFT: 'LEFT',
    UP: 'UP',
    DOWN: 'DOWN',
    UP_LEFT: 'UP_LEFT',
    UP_RIGHT: 'UP_RIGHT',
    DOWN_LEFT: 'DOWN_LEFT',
    DOWN_RIGHT: 'DOWN_RIGHT'
}
export const BEATS = 500