export type ChatRole = "user" | "model";

export interface IChatMessage {
    _id?: string;
    role: ChatRole;
    content: string;
    isEmergencyAlert?: boolean;
    timestamp: string;
}

export interface IChatSession {
    _id: string;
    title: string;
    status: "ACTIVE" | "COMPLETED";
    createdAt: string;
    updatedAt: string;
    messages?: IChatMessage[];
}
