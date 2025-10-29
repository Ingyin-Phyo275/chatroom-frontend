export interface PrivateCallResponse {
    callData : {
        id: string,
        duration: string,
        created_at: string,
        ended_at: string,
        initiator: {
            id: string,
            username: string
        },
        receiver: {
            id: string,
            username: string
        }
    },
    call_type: string,
    from: string
}