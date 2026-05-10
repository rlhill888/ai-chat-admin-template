"use client";

import { useLoading } from "@/lib/components/context/LoadingContext";
import ConversationAndMessages from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/conversationAndMessages";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type CreateConversationMessageBody = Omit<
  ConversationAndMessages,
  "timeStamp" | "body"
> & {
  body: string;
  conversationTimeStamp: string;
};

const testConversations: Omit<CreateConversationMessageBody, "body">[] = [
  {
    conversationId: "+1 267-709-8221",
    conversationTimeStamp: "2026-05-03T00:22:21.036Z",
    clientName: "Rodney",
    COMPANY_NAME_PLACEHOLDERSentMessage: false,
  },
  {
    conversationId: "+1 215-555-1234",
    conversationTimeStamp: "2026-05-03T01:10:11.036Z",
    clientName: "Sarah",
    COMPANY_NAME_PLACEHOLDERSentMessage: false,
  },
  {
    conversationId: "+1 484-555-6789",
    conversationTimeStamp: "2026-05-03T02:30:45.036Z",
    clientName: "Jessica",
    COMPANY_NAME_PLACEHOLDERSentMessage: false,
  },
  {
    conversationId: "+1 856-555-4422",
    conversationTimeStamp: "2026-05-03T03:15:22.036Z",
    clientName: "Fernendez",
    COMPANY_NAME_PLACEHOLDERSentMessage: false,
  },
  {
    conversationId: "+1 609-555-9012",
    conversationTimeStamp: "2026-05-03T04:45:09.036Z",
    clientName: "Jason",
    COMPANY_NAME_PLACEHOLDERSentMessage: false,
  },
];

export default function Page() {
  const [message, setMessage] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState(
    testConversations[0].conversationId
  );
  const [sending, setSending] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const { setLoading } = useLoading();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [setLoading]);

  async function handleSendMessage() {
    setResponseMessage("");

    if (!message.trim()) {
      setResponseMessage("Please enter a message.");
      return;
    }

    const selectedConversation = testConversations.find(
      (conversation) => conversation.conversationId === selectedConversationId
    );

    if (!selectedConversation) {
      setResponseMessage("Please select a conversation.");
      return;
    }

    const newMessage: CreateConversationMessageBody = {
      ...selectedConversation,
      body: message,
    };

    try {
      setSending(true);

      const response = await fetch("/api/conversations/client-send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send test message.");
      }

      setResponseMessage(`Message sent for ${selectedConversation.clientName}.`);
      setMessage("");
    } catch (error) {

      setResponseMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Test Client Message API</h1>

        <p className={styles.description}>
          Select one test conversation, enter a message, and send it to your API
          route.
        </p>

        <div className={styles.selectorGroup}>
          {testConversations.map((conversation) => {
            const isSelected =
              selectedConversationId === conversation.conversationId;

            return (
              <label
                key={conversation.conversationId}
                className={`${styles.option} ${
                  isSelected ? styles.selectedOption : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    setSelectedConversationId(conversation.conversationId)
                  }
                  className={styles.checkbox}
                />

                <div>
                  <p className={styles.clientName}>{conversation.clientName}</p>
                  <p className={styles.phoneNumber}>
                    {conversation.conversationId}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <textarea
          className={styles.messageInput}
          placeholder="Type a test message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send Test Message"}
        </button>

        {responseMessage && (
          <p className={styles.responseMessage}>{responseMessage}</p>
        )}
      </section>
    </main>
  );
}