export interface UserTeamsState {
    teams: string[]
}

export enum UserTeamsStateActions {
    ADD,
    REMOVE
}

export interface UserTeamsStateUpdateEvt {
    type: UserTeamsStateActions,
    name: string
}

export const UserTeamsReducer = (doc: UserTeamsState, evt: UserTeamsStateUpdateEvt) => {
    if (doc.teams === undefined) {
        doc.teams = []
    }
    switch (evt.type) {
        case UserTeamsStateActions.ADD:
            doc.teams.push(evt.name)
            break;
        default:
            console.error("unsupported action: ", evt)
    }
}
