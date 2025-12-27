import {CeiliDance, FigureDance} from "./dance.js";
import {
    Moves,
    quarterCircleLeft,
    twoThreesToTheLeft,
    quarterCircleRight,
    twoThreesToTheRight,
    followsFastInnerCircleLeft,
    clapTwice,
    fastSwitchWithPartner,
    switchWithPartner,
    leadsFastInnerCircleLeft,
    advanceAndRetire,
    sidestepRight,
    turnPartnerHalfwayByTheRight,
    turnPartnerHalfwayByTheLeft,
    sidestepLeft,
    faceCenter,
    twoThreesToTheRightEndFacingPartner,
    followsInnerQuarterCircleLeft,
    followsTurnAround,
    followsInnerQuarterCircleRight, followsTwoThreesToTheRightWhileTurningAround, followsInnerQuarterCircleLeftEndHome
} from "./moves.js";
import {Formations} from "./enums.js";

export const threeTunes = new FigureDance("Three Tunes")
    .withFigure("Right Right/Left",
        new Moves([
                    quarterCircleLeft,
                    twoThreesToTheLeft,
                    quarterCircleRight,
                    twoThreesToTheRight,
                    quarterCircleRight,
                    twoThreesToTheRight,
                    quarterCircleLeft,
                    twoThreesToTheLeft,
                ]
            ))
    .withFigure("Rings",
        new Moves([
                followsFastInnerCircleLeft,
                clapTwice,
                fastSwitchWithPartner,
                switchWithPartner,
                leadsFastInnerCircleLeft,
                clapTwice,
                fastSwitchWithPartner,
                switchWithPartner,
            ]))
    .withSteps((figureDance) => {
        return [
            figureDance.figures["Right Right/Left"],
            figureDance.figures["Rings"]
        ]
    })

export const bonfireDance = new CeiliDance("Bonfire Dance")
    .withMoves(new Moves([
            // advanceAndRetire,
            // advanceAndRetire,
            // quarterCircleRight,
            // twoThreesToTheRight,
            // quarterCircleLeft,
            // twoThreesToTheLeft,
            // advanceAndRetire,
            // advanceAndRetire,
            // quarterCircleLeft,
            // twoThreesToTheLeft,
            // quarterCircleRight,
            // twoThreesToTheRightEndFacingPartner,
            //
            // sidestepRight,
            // turnPartnerHalfwayByTheRight,
            // turnPartnerHalfwayByTheLeft,
            // sidestepLeft,
            // turnPartnerHalfwayByTheLeft,
            // turnPartnerHalfwayByTheRight,
            // faceCenter,

            followsInnerQuarterCircleRight,
            followsTwoThreesToTheRightWhileTurningAround,
            followsInnerQuarterCircleLeftEndHome,
        ]))

export const dances = {
    "The Three Tunes": {
        name: "The Three Tunes",
        formation: Formations.EIGHT_HAND_SQUARE,
        executor: threeTunes
    },
    "Bonfire Dance": {
        name: "Bonfire Dance",
        formation: Formations.EIGHT_HAND_SQUARE,
        executor: bonfireDance
    }
}
