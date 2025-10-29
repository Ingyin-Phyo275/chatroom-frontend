export interface PrivateIncomingMessage {
    id: string,
    attachment_url: string,
    content: string,
    is_delivered: boolean,
    is_pinned: boolean,
    is_edit: boolean,
    is_group: boolean,
    sender: { id: string },
    receiver: { id: string },
    created_at: string,
}