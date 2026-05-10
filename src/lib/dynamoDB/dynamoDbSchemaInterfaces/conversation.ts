export default interface Conversation {
    conversationId: string;
    timeStamp: string;
    clientName: string;
    conversationMethod: "Text" | "Email";
    phoneNumber?: string;
    email?: string;
    aiAutoResponseToggle?: boolean;
    conversationNotes?: string;
    newMessage: boolean;
    mostRecentMessage: string;
    lastMessageTimeStamp: string;
    readAt?: string;
    currentlyBeingRespondedByAi?: boolean;
    userInterventionRequired?: boolean;
}