"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MessageThread.module.css";
import { Send } from "@mui/icons-material";
import Conversation from "../dynamoDB/dynamoDbSchemaInterfaces/conversation";
import {
  createConversationMessage,
  getMessagesByConversationId,
} from "../dynamoDB/helper/ConversationAndMessageHelper";
import ConversationAndMessages from "../dynamoDB/dynamoDbSchemaInterfaces/conversationAndMessages";
import { formatIsoTimeToAmPm } from "../util/stringUtil";
import { setConversationAiResponseToggle } from "../dynamoDB/helper/ConversationHelper";
import { useAbly } from "./context/AblyContext";
import * as Ably from "ably";
import { COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL } from "../ably/ablyConstants";
import { useUser } from "./context/UserContext";

export default function MessageThread({
  conversation,
  onAiToggleChange,
}: {
  conversation: Conversation;
  onAiToggleChange?: (value: boolean) => void;
}) {
  const { ably } = useAbly();
  const { user } = useUser()
  const [messages, setMessages] = useState<ConversationAndMessages[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendError, setSendError] = useState("");
  const [nextKey, setNextKey] = useState<Record<string, unknown> | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [aiResponseToggle, setAiResponseToggle] = useState(
    conversation.aiAutoResponseToggle ?? false
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldScrollToBottomRef = useRef(true);

  useEffect(() => {
    async function getMessages() {
      setIsInitialLoading(true);
      try {
        shouldScrollToBottomRef.current = true;

        const request = await getMessagesByConversationId(
          conversation.conversationId
        );

        setMessages(request.messages.reverse());
        setNextKey(request.nextKey);
        setHasMoreMessages(Boolean(request.nextKey));
        setAiResponseToggle(conversation.aiAutoResponseToggle ?? false);
      } catch (error) {
        // future error handling
      } finally {
        setIsInitialLoading(false);
      }
    }

    setMessages([]);
    setNextKey(undefined);
    setHasMoreMessages(true);

    getMessages();
  }, [conversation]);

  useEffect(() => {
    if (!ably) {
      // future error handling
      return;
    }
    const channel = ably.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

    const handleConversationUpdate = (message: any) => {
      const data = message.data
      if (data.conversation.conversationId === conversation.conversationId && data.message.COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage !== user?.name) {

        shouldScrollToBottomRef.current = true;

        setMessages((previous) => {
          const copyArray = [...previous];
          copyArray.push(data.message);
          return copyArray;
        });
      }
    };

    channel.subscribe("conversation-update-new-message", handleConversationUpdate);

    return () => {
      channel.unsubscribe("conversation-update-new-message", handleConversationUpdate);
    };
  }, [ably, conversation]);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    if (!shouldScrollToBottomRef.current) return;

    requestAnimationFrame(() => {
      scrollToBottom();
      shouldScrollToBottomRef.current = false;
    });
  }, [messages]);

  function showSendErrorNotification() {
    setSendError("Message failed to send. Please try again.");

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    errorTimeoutRef.current = setTimeout(() => {
      setSendError("");
    }, 3500);
  }

  function scrollToBottom() {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }

  async function loadMoreMessages() {
    if (!nextKey || isLoadingMoreMessages || !hasMoreMessages) return;

    const container = containerRef.current;
    if (!container) return;

    const previousScrollHeight = container.scrollHeight;

    setIsLoadingMoreMessages(true);
    shouldScrollToBottomRef.current = false;

    try {
      const request = await getMessagesByConversationId(
        conversation.conversationId,
        nextKey
      );

      const olderMessages = request.messages.reverse();

      setMessages((prevMessages) => [...olderMessages, ...prevMessages]);
      setNextKey(request.nextKey);
      setHasMoreMessages(Boolean(request.nextKey));

      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const newScrollHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
      });
    } catch (error) {
      // future error handling
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }

  function handleMessagesScroll() {
    const container = containerRef.current;
    if (!container) return;

    const isAtTop = container.scrollTop <= 20;

    if (isAtTop) {
      loadMoreMessages();
    }
  }

  const handleSendMessage = async () => {
    if (conversation.currentlyBeingRespondedByAi) return;

    const trimmedMessage = messageText.trim();

    if (!trimmedMessage) return;

    const newMessage: ConversationAndMessages = {
      conversationId: conversation.conversationId,
      COMPANY_NAME_PLACEHOLDERSentMessage: true,
      COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage: user?.name,
      body: trimmedMessage,
      timeStamp: new Date().toISOString(),
      clientName: conversation.clientName,
    };

    try {
      await createConversationMessage({
        ...newMessage,
        conversationTimeStamp: conversation.timeStamp,
      });
      shouldScrollToBottomRef.current = true;

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageText("");
      setSendError("");
    } catch (error) {
      showSendErrorNotification();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  async function handleResponseToggle(e: any) {
    const newValue = e.target.checked;
    setAiResponseToggle(newValue);
    onAiToggleChange?.(newValue);
    try {
      await setConversationAiResponseToggle(conversation.conversationId, conversation.timeStamp, newValue);
    } catch (error) {
      setAiResponseToggle(!newValue);
      onAiToggleChange?.(!newValue);
    }
  }

  return (
    <section className={styles.threadContainer}>
      {sendError && (
        <div className={styles.errorNotification}>
          {sendError}
        </div>
      )}

      <header className={styles.threadHeader}>
        <div>
          <h2 className={styles.clientName}>{conversation.clientName}</h2>
          <p className={styles.clientStatus}>{conversation.phoneNumber}</p>
        </div>

        <label className={styles.aiToggleWrapper}>
          <span className={styles.aiToggleText}>AI Responses</span>

          <input
            type="checkbox"
            checked={aiResponseToggle}
            onChange={(event) => handleResponseToggle(event)}
            className={styles.aiToggleInput}
          />

          <span className={styles.aiToggleSlider}></span>
        </label>
      </header>

      <div
        ref={containerRef}
        className={styles.messagesContainer}
        onScroll={handleMessagesScroll}
      >
        {isInitialLoading ? (
          <div className={styles.initialLoadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : null}

        {isLoadingMoreMessages ? (
          <div className={styles.paginationLoadingContainer}>
            <div className={styles.loadingSpinner}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={`${message.timeStamp} ${message.body}`}
            className={`${styles.messageRow} ${message.COMPANY_NAME_PLACEHOLDERSentMessage
              ? styles.myMessageRow
              : styles.theirMessageRow
              }`}
          >
            <div
              className={`${styles.messageBubble} ${message.COMPANY_NAME_PLACEHOLDERSentMessage
                ? styles.myMessage
                : styles.theirMessage
                }`}
            >
              <div className={styles.messageMeta}>
                <span>
                  {message.COMPANY_NAME_PLACEHOLDERSentMessage
                    ? message.COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage
                    : conversation.clientName}
                </span>
                <span>{formatIsoTimeToAmPm(message.timeStamp)}</span>
              </div>

              <p className={styles.messageBody}>{message.body}</p>
            </div>
          </div>
        ))}

        {conversation.currentlyBeingRespondedByAi ? (
          <div className={`${styles.messageRow} ${styles.myMessageRow}`}>
            <div className={`${styles.messageBubble} ${styles.myMessage}`}>
              <div className={styles.messageMeta}>
                <span>AI</span>
                <span>Responding</span>
              </div>

              <div className={styles.respondingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className={styles.replyBox}>
        <textarea
          className={styles.textarea}
          placeholder={
            conversation.currentlyBeingRespondedByAi
              ? "AI is responding..."
              : "Write a reply..."
          }
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={conversation.currentlyBeingRespondedByAi}
        />

        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={
            !messageText.trim() || conversation.currentlyBeingRespondedByAi
          }
        >
          <Send />
        </button>
      </footer>
    </section>
  );
}