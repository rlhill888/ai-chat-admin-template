'use client';

import Conversation from "../dynamoDB/dynamoDbSchemaInterfaces/conversation";
import { setConversationAsRead } from "../dynamoDB/helper/ConversationHelper";
import styles from "./ConversationSelectionBox.module.css";

export default function ConversationSelectionBox({
  clientName,
  mostRecentMessage,
  newMessage,
  aiResponding,
  setCurrentConversation,
  conversation,
  setConversations,
  arrayIndex,
}: {
  clientName: string;
  mostRecentMessage: string;
  newMessage: boolean;
  aiResponding: boolean;
  setCurrentConversation: Function;
  conversation: Conversation;
  setConversations: Function;
  arrayIndex: number;
}) {
  const userInterventionRequired =
    conversation.userInterventionRequired === true;

  return (
    <div
      onClick={async () => {
        setCurrentConversation(conversation);

        if (newMessage) {
          try {
            await setConversationAsRead(
              conversation.conversationId,
              conversation.timeStamp
            );

            setConversations((previous: Conversation[]) => {
              const copyArray = [...previous];

              copyArray[arrayIndex] = {
                ...copyArray[arrayIndex],
                newMessage: false,
              };

              return copyArray;
            });
          } catch (error) {
            // future error handling
          }
        }
      }}
      id={styles["main-div"]}
      className={
        userInterventionRequired
          ? styles["user-intervention-required"]
          : undefined
      }
    >
      <div>
        <div className={styles["header-row"]}>
          <h3 className={styles["header-text"]}>{clientName}</h3>

          {userInterventionRequired ? (
            <div className={styles["alert-label"]}>
              User intervention required
            </div>
          ) : null}
        </div>

        <div className={styles["recent-message-div"]}>
          <p>{mostRecentMessage}</p>

          {aiResponding ? (
            <div className={styles["ai-responding-indicator"]}>
              <span>AI</span>

              <div className={styles["typing-dots"]}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles["right-indicators"]}>
        {userInterventionRequired ? (
          <div className={styles["alert-notification-dot"]}></div>
        ) : null}

        {newMessage ? <div className={styles["notification-dot"]}></div> : null}
      </div>
    </div>
  );
}