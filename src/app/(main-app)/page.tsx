/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import styles from "./page.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Conversation from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/conversation";
import { getConversations } from "@/lib/dynamoDB/helper/ConversationHelper";
import ConversationSelectionBox from "@/lib/components/ConversationSelectionBox";
import MessageThread from "@/lib/components/MessageThread";
import { useLoading } from "@/lib/components/context/LoadingContext";
import { useUser } from "@/lib/components/context/UserContext";
import { useAbly } from "@/lib/components/context/AblyContext";
import { COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL } from "@/lib/ably/ablyConstants";

type ConversationsCursor = Record<string, any> | null;

const CONVERSATIONS_LIMIT = 20;

export default function Home() {
  const { setLoading } = useLoading();
  const { user } = useUser();
  const { ably } = useAbly();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  const [conversationCursor, setConversationCursor] = useState<Record<string, any> | null>(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isFetchingMoreConversations, setIsFetchingMoreConversations] =
    useState(false);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const isFetchingMoreRef = useRef(false);

  const minSwipeDistance = 80;

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    setTouchEndX(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStartX === null || touchEndX === null) return;

    const distance = touchStartX - touchEndX;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && currentConversation) {
      setCurrentConversation(null);
    }
  }

  const fetchInitialConversations = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getConversations("Text", CONVERSATIONS_LIMIT, conversationCursor);

      setConversations(data.items as Conversation[]);
      setConversationCursor(data.cursor);
      setHasMoreConversations(Boolean(data.cursor));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const fetchMoreConversations = useCallback(async () => {
    if (!conversationCursor) return;
    if (!hasMoreConversations) return;
    if (isFetchingMoreRef.current) return;

    isFetchingMoreRef.current = true;
    setIsFetchingMoreConversations(true);

    try {
      const data = await getConversations(
        "Text",
        CONVERSATIONS_LIMIT,
        conversationCursor
      );

      setConversations((previous) => {
        const existingIds = new Set(previous.map((c) => c.conversationId));

        const newItems = (data.items as Conversation[]).filter(
          (conversation) => !existingIds.has(conversation.conversationId)
        );

        return [...previous, ...newItems];
      });

      setConversationCursor(data.cursor);
      setHasMoreConversations(Boolean(data.cursor));
    } catch (error) {
      console.error(error);
    } finally {
      isFetchingMoreRef.current = false;
      setIsFetchingMoreConversations(false);
    }
  }, [conversationCursor, hasMoreConversations]);

  function handleConversationListScroll(e: React.UIEvent<HTMLDivElement>) {
    const element = e.currentTarget;

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    const shouldFetchMore = distanceFromBottom < 120;

    if (shouldFetchMore) {
      fetchMoreConversations();
    }
  }

  useEffect(() => {

    async function getInitialConversations(){
      fetchInitialConversations();
    }
    getInitialConversations()
  }, [fetchInitialConversations]);

  useEffect(() => {
    if (!ably) {
      return;
    }

    const channel = ably.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

    const handleConversationUpdate = (message: any) => {
      const data = message.data;
      const conversationUpdate = data.conversation;
      const aiResponding = data.aiResponding;

      setConversations((previous) =>
        previous.map((c) =>
          c.conversationId === conversationUpdate.conversationId
            ? { ...c, currentlyBeingRespondedByAi: aiResponding }
            : c
        )
      );

      setCurrentConversation((previous) => {
        if (!previous) return previous;

        if (previous.conversationId !== conversationUpdate.conversationId) {
          return previous;
        }

        return {
          ...previous,
          currentlyBeingRespondedByAi: aiResponding,
        };
      });
    };

    channel.subscribe(
      "ai-responding-to-conversation-update",
      handleConversationUpdate
    );

    return () => {
      channel.unsubscribe(
        "ai-responding-to-conversation-update",
        handleConversationUpdate
      );
    };
  }, [ably]);

  useEffect(() => {
    if (!ably) {
      console.log("no ably");
      return;
    }

    const channel = ably.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

    const handleConversationUpdate = (message: any) => {
      const data = message.data;
      const newConversation = data.conversation;

      setConversations((previous) => {
        const filtered = previous.filter(
          (c) => c.conversationId !== newConversation.conversationId
        );

        return [newConversation, ...filtered];
      });
    };

    channel.subscribe("brand-new-conversation-update", handleConversationUpdate);

    return () => {
      channel.unsubscribe(
        "brand-new-conversation-update",
        handleConversationUpdate
      );
    };
  }, [ably]);

  useEffect(() => {
    if (!ably) {
      return;
    }

    const channel = ably.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

    const handleConversationUpdate = (message: any) => {
      const data = message.data;
      console.log(data);

      if (data.needsHumanIntervention) {
        const conversationUpdate = data.conversation;

        setConversations((previous) => {
          const updated = previous.map((c) =>
            c.conversationId === conversationUpdate.conversationId
              ? {
                ...c,
                newMessage: true,
                userInterventionRequired:
                  data.needsHumanIntervention ?? false,
              }
              : c
          );

          const index = updated.findIndex(
            (c) => c.conversationId === conversationUpdate.conversationId
          );

          if (index === -1) return updated;

          const [item] = updated.splice(index, 1);

          return [item, ...updated];
        });

        return;
      }

      if (data.message.COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage !== user?.name) {
        const conversationUpdate = data.conversation;

        setConversations((previous) => {
          const updated = previous.map((c) =>
            c.conversationId === conversationUpdate.conversationId
              ? {
                ...c,
                newMessage: true,
                mostRecentMessage: data.message.body,
                userInterventionRequired:
                  data.needsHumanIntervention ?? false,
              }
              : c
          );

          const index = updated.findIndex(
            (c) => c.conversationId === conversationUpdate.conversationId
          );

          if (index === -1) return updated;

          const [item] = updated.splice(index, 1);

          return [item, ...updated];
        });
      } else {
        const conversationUpdate = data.conversation;

        setConversations((previous) => {
          const updated = previous.map((c) =>
            c.conversationId === conversationUpdate.conversationId
              ? {
                ...c,
                newMessage: false,
                mostRecentMessage: data.message.body,
                userInterventionRequired: false,
              }
              : c
          );

          const index = updated.findIndex(
            (c) => c.conversationId === conversationUpdate.conversationId
          );

          if (index === -1) return updated;

          const [item] = updated.splice(index, 1);

          return [item, ...updated];
        });
      }
    };

    channel.subscribe(
      "conversation-update-new-message",
      handleConversationUpdate
    );

    return () => {
      channel.unsubscribe(
        "conversation-update-new-message",
        handleConversationUpdate
      );
    };
  }, [ably, user]);

  if (!user) {
    return <></>;
  }

  return (
    <div
      className={`${styles.mainDiv} ${currentConversation ? styles.mobileThreadOpen : ""
        }`}
    >
      <div
        className={styles.messageSelectionDiv}
        onScroll={handleConversationListScroll}
      >
        {conversations.map((message, index) => {
          return (
            <ConversationSelectionBox
              key={`${message.conversationId}`}
              clientName={message.clientName}
              newMessage={message.newMessage}
              mostRecentMessage={message.mostRecentMessage}
              conversation={message}
              setCurrentConversation={setCurrentConversation}
              aiResponding={message.currentlyBeingRespondedByAi ?? false}
              setConversations={setConversations}
              arrayIndex={index}
            />
          );
        })}

        {isFetchingMoreConversations && (
          <div className={styles.conversationPaginationLoading}>
            Loading more conversations...
          </div>
        )}

        {!hasMoreConversations && conversations.length > 0 && (
          <div className={styles.conversationPaginationEnd}>
            No more conversations
          </div>
        )}
      </div>

      <div
        className={styles.messageArea}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentConversation && (
          <MessageThread conversation={currentConversation} />
        )}
      </div>
    </div>
  );
}
