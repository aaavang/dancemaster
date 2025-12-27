import {goHome, mingle, normalizeRotation, positions} from "./moves.js";
import {DancerLayouts, Directions, FormationGroups, Formations, Positions, Relationships} from "./enums.js";
import {clearHeader, updateHeader} from "./header.js";

/**
 * DanceMaster class
 */
export class DanceMaster {
    /**
     *
     * @param options
     */
    constructor(options) {
        this.state = {
            formation: options.formation,
            dancers: {},
        }

        this.mingling = false
        this.minglingTimelinesPromise = null

        this.moveSet = [];

        this.danceFloor = window.document.getElementById('dance-floor')

        const centerElem = document.createElement('div')
        centerElem.id = 'center-point'
        this.danceFloor.appendChild(centerElem)
        centerElem.style.left = `${positions.center.x - 5}px`
        centerElem.style.top = `${positions.center.y - 5}px`

        switch (options.formation) {
            case Formations.EIGHT_HAND_SQUARE:
                this.createDancer('red', options.formation, Positions.FIRST_TOP_LEAD)
                this.createDancer('blue', options.formation, Positions.FIRST_TOP_FOLLOW);
                this.createDancer('green', options.formation, Positions.SECOND_TOP_LEAD);
                this.createDancer('yellow', options.formation, Positions.SECOND_TOP_FOLLOW);
                this.createDancer('purple', options.formation, Positions.FIRST_SIDE_LEAD);
                this.createDancer('orange', options.formation, Positions.FIRST_SIDE_FOLLOW);
                this.createDancer('pink', options.formation, Positions.SECOND_SIDE_LEAD);
                this.createDancer('brown', options.formation, Positions.SECOND_SIDE_FOLLOW);
                break;
            case Formations.TWO_FACING_TWO:
                this.createDancer('red', options.formation, Positions.FIRST_TOP_LEAD)
                this.createDancer('blue', options.formation, Positions.FIRST_TOP_FOLLOW);
                this.createDancer('green', options.formation, Positions.SECOND_TOP_LEAD);
                this.createDancer('yellow', options.formation, Positions.SECOND_TOP_FOLLOW);
                break;
            // case Formations.SOLO:
            //     this.createDancer('red', options.formation, Positions.FIRST_TOP_LEAD)
            //     break;
            default:
                throw new Error("invalid formation")
        }
    }

    /**
     * Run a single move
     * @param move
     * @returns {Promise<void>}
     */
    async runMove(move) {
        if (this.mingling && move !== mingle) {
            this.mingling = false
            updateHeader('Stop Mingling')
            await this.minglingTimelinesPromise
            await goHome(this)
        }
        try {
            await move(this)
        } catch (e) {
            console.error(e)
            updateHeader(e.message)
            setTimeout(() => {
                clearHeader()
            }, 2000)
        }
        this.normalizeDancerRotations();
    }

    async run() {
        for (const move of this.moveSet) {
            await move(this)
            this.normalizeDancerRotations();
        }
        updateHeader('Done')
    }

    /**
     * Normalize all dancer rotations to be between 0 and 360.  This helps prevent rapid unwinding when turning around.
     */
    normalizeDancerRotations() {
        for (const dancer of Object.values(this.state.dancers)) {
            const normalizedRotation = normalizeRotation(dancer.arrowElem);
            dancer.arrowElem.style.transform = `rotate(${normalizeRotation(dancer.arrowElem)}deg)`
            dancer.currentOffset.rotation = normalizedRotation
        }
    }

    clear() {
        for (const dancer of Object.values(this.state.dancers)) {
            dancer.elem.remove()
        }
    }

    adjustPositions() {
        for (const dancer of Object.values(this.state.dancers)) {
            const position = positions[this.state.formation][dancer.role]
            dancer.elem.style.left = `${position.x}px`
            dancer.elem.style.top = `${position.y}px`
        }

        const centerElem = document.getElementById('center-point')
        centerElem.style.left = `${positions.center.x - 5}px`
        centerElem.style.top = `${positions.center.y - 5}px`
    }

    async reset() {
        for (const dancer of Object.values(this.state.dancers)) {
            dancer.elem.style.left = `${positions[this.state.formation][dancer.role].x}px`
            dancer.elem.style.top = `${positions[this.state.formation][dancer.role].y}px`
            dancer.elem.style.transform = `rotate(${positions[this.state.formation][dancer.role].rotation}deg)`
            dancer.currentNamedPosition = dancer.role
            dancer.currentOffset = {
                x: 0,
                y: 0,
                rotation: positions[this.state.formation][dancer.role].rotation
            }
            dancer.facingPartner = false
            dancer.turnedAround = false
        }
    }

    createDancer(color, formation, role) {
        const generateRandomName = () => {
            const names = ["Alex", "Davin", "Emmalee", "Justin", "Grace", "Danielle", "Sam", "Katie", "Paul", "Stephen", "Sharon", "Amy", "Ed", "Elaine", "Elvira", "Hailey", "Gaby", "Dawn", "Tim", "Liam", "Emma", "Noah", "Olivia", "Aiden", "Sophia", "Mason", "Isabella", "Lucas", "Mia", "Ethan", "Amelia", "James", "Harper", "Benjamin", "Evelyn", "Elijah", "Charlotte", "William", "Abigail", "Alexander", "Ella", "Henry", "Chloe", "Sebastian", "Madison", "Jackson", "Scarlett", "Mateo", "Aria", "Daniel", "Grace", "Matthew", "Zoe", "Joseph", "Riley", "David", "Lily", "Samuel", "Avery", "David", "Victoria", "John", "Camila", "Gabriel", "Penelope", "Carter", "Layla", "Owen", "Mila", "Wyatt", "Ellie", "Jack"]

            return names[Math.floor(Math.random() * names.length)]
        }

        const name = generateRandomName()
        const dancerElem = document.createElement('div')
        dancerElem.id = role
        dancerElem.classList.add("dancer")
        dancerElem.style.left = `${positions[formation][role].x}px`
        dancerElem.style.top = `${positions[formation][role].y}px`

        const label = document.createElement('div')
        label.classList.add('label')
        label.innerHTML = `${name} <br/> ${role}`
        dancerElem.appendChild(label)

        const arrow = document.createElement('div')
        arrow.classList.add('arrow')
        arrow.id = `arrow-${role}`
        arrow.innerHTML = '↓'
        arrow.style.backgroundColor = color
        arrow.style.transform = `rotate(${positions[formation][role].rotation}deg)`
        dancerElem.appendChild(arrow)
        dancerElem.onclick = () => {
            const partner = this.getPositionNameFromRelationship(role, Relationships.PARTNER)
            const corner = this.getPositionNameFromRelationship(role, Relationships.CORNER)
            const contrary = this.getPositionNameFromRelationship(role, Relationships.CONTRARY)
            const arrowRotation = arrow.style.transform
            const facingPartner = this.state.dancers[role].facingPartner

            alert(`My Role: ${role}\nPartner: ${partner}\nCorner: ${corner}\nContrary: ${contrary}\nArrow Rotation: ${arrowRotation}\nFacing Partner: ${facingPartner}`)
        }

        this.state.dancers[role] = {
            name,
            color,
            elem: dancerElem,
            role,
            targetId: `#${role}`,
            arrowId: `#${arrow.id}`,
            arrowElem: arrow,
            position: positions[formation][role],
            currentNamedPosition: role,
            group: FormationGroups[formation][role],
            currentOffset: {
                x: 0,
                y: 0,
                rotation: positions[formation][role].rotation
            },
            facingPartner: false,
            turnedAround: false
        }

        this.danceFloor.appendChild(dancerElem)
    }

    getNextPositionNameOfSameRole(direction, role) {
        switch (this.state.formation) {
            case Formations.EIGHT_HAND_SQUARE:
                const positionIndex = DancerLayouts[this.state.formation].indexOf(role)
                const numberOfPositions = DancerLayouts[this.state.formation].length;
                let nextIndex = (direction === Directions.RIGHT ? positionIndex + 2 : positionIndex - 2) % numberOfPositions
                nextIndex = (nextIndex % numberOfPositions + numberOfPositions) % numberOfPositions

                return DancerLayouts[this.state.formation][nextIndex]
            default:
                throw new Error("invalid formation")
        }
    }

    getNextPosition(direction, role) {
        switch (this.state.formation) {
            case Formations.EIGHT_HAND_SQUARE:
                const positionIndex = DancerLayouts[this.state.formation].indexOf(role)
                const numberOfPositions = DancerLayouts[this.state.formation].length;
                let nextIndex = (direction === Directions.RIGHT ? positionIndex + 1 : positionIndex - 1) % numberOfPositions
                nextIndex = (nextIndex % numberOfPositions + numberOfPositions) % numberOfPositions

                return DancerLayouts[this.state.formation][nextIndex]
            default:
                throw new Error("invalid formation")
        }
    }

    isLead(role) {
        switch (this.state.formation) {
            case Formations.TWO_FACING_TWO:
            case Formations.EIGHT_HAND_SQUARE:
                return DancerLayouts[this.state.formation].indexOf(role) % 2 === 0
            default:
                throw new Error("invalid formation")
        }
    }

    /**
     * Get the position for a specific relationship
     * @param {Position} currentPosition
     * @param {Relationship} targetRelationship
     */
    getPositionNameFromRelationship(currentPosition, targetRelationship) {
        const positionIndex = DancerLayouts[this.state.formation].indexOf(currentPosition)
        const numberOfPositions = DancerLayouts[this.state.formation].length;
        const isLead = positionIndex % 2 === 0
        let nextIndex
        switch (this.state.formation) {
            case Formations.EIGHT_HAND_SQUARE:
                switch (targetRelationship) {
                    case Relationships.PARTNER:
                        nextIndex = isLead ? positionIndex + 1 : positionIndex - 1
                        break;
                    case Relationships.CORNER:
                        nextIndex = isLead ? positionIndex - 1 : positionIndex + 1
                        break;
                    case Relationships.CONTRARY:
                        nextIndex = isLead ? positionIndex - 3 : positionIndex + 3
                        break;
                    case Relationships.OPPOSITE:
                        nextIndex = isLead ? positionIndex - 3 : positionIndex + 3
                        break;
                    default:
                        throw new Error("invalid relationship")
                }
                break
            case Formations.TWO_FACING_TWO:
                switch (targetRelationship) {
                    case Relationships.PARTNER:
                        nextIndex = isLead ? positionIndex + 1 : positionIndex - 1
                        break;
                    case Relationships.OPPOSITE:
                    case Relationships.CORNER:
                        nextIndex = isLead ? positionIndex - 1 : positionIndex + 1
                        break;
                }
                break
            // case Formations.SOLO:
            //     return Positions.FIRST_TOP_LEAD
            default:
                throw new Error("invalid formation")
        }
        nextIndex = (nextIndex % numberOfPositions + numberOfPositions) % numberOfPositions
        return DancerLayouts[this.state.formation][nextIndex]
    }
}
