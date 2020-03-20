import { StandupProps } from "../components/standupreport"
import debug from 'debug'

const log = debug('util.standupdb')

enum actions {
    ADD,
    ADD_USER
}

export interface DailyState {
    standups: { [key: string]: StandupProps }
    users: string[]
}

export interface AddStandupAction {
    type: actions.ADD,
    standup: StandupProps,
}

export interface AddUserAction {
    type: actions.ADD_USER,
    userName: string,
}

export function addStandupAction(standup: StandupProps) {
    return {
        type: actions.ADD,
        standup: standup
    } as AddStandupAction
}

export type DailyAction = AddStandupAction | AddUserAction

export function addUserAction(userName: string) {
    return {
        type: actions.ADD_USER,
        userName: userName,
    } as AddUserAction
}

export const DailyStateReducer = (doc: DailyState, action: DailyAction) => {
    switch (action.type) {
        case actions.ADD:
            if (doc.standups === undefined) {
                doc.standups = {}
            }
            const standup = action.standup

            if (standup.today === undefined || standup.today === "") {
                delete doc.standups[standup.name]
                return
            }

            for (let key of Object.keys(standup)) {
                if (!Reflect.get(standup,key)) {
                    Reflect.set(standup, key, "")
                }
            }
            log("standup: ", standup)

            let existing = doc.standups[standup.name]
            if (!existing) {
                doc.standups[standup.name] = standup
                return
            }
            existing.today = standup.today
            existing.yesterday = standup.yesterday
            existing.blockers = standup.blockers

            break;
        case actions.ADD_USER:
            doc.users.push(action.userName);
            break;
        default:
            throw new Error("unrecognized action: " + (action as DailyAction).type.toString())
    }


}
