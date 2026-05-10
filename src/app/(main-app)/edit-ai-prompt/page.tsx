'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useLoading } from '@/lib/components/context/LoadingContext';
import { useUser } from '@/lib/components/context/UserContext';
import { useRouter } from 'next/navigation';
import { getPrompt, updatePrompt } from '@/lib/dynamoDB/helper/PromptHelper';

export default function Page() {
    const { loading, setLoading } = useLoading()
    const { user } = useUser()
    const router = useRouter()
    const [aiResponsePrompt, setAiResponsePrompt] = useState(
        ``
    );

    const [needsUserInLoopPrompt, setNeedsUserInLoopPrompt] = useState(
        ``
    );
    useEffect(() => {
        async function getData() {
            setLoading(true)
            try {
                if (!user) {
                    return
                } else {
                    if (!user.admin) {
                        router.push("/")
                    } else {
                        const prompt = await getPrompt()
                        console.log(prompt)
                        setAiResponsePrompt(prompt.AIResponsePrompt)
                        setNeedsUserInLoopPrompt(prompt.FlagUserInLoopRequirements)
                        setLoading(false)
                    }
                }
            } catch (error) {
                // future error handling
            }

        }
        getData()

    }, [user])

    const [saved, setSaved] = useState(false);

    async function handleSave() {
        setSaved(false);

        try {
            const updatedPrompt = await updatePrompt(aiResponsePrompt, needsUserInLoopPrompt)
            setSaved(true);
        } catch (error) {
            // future error handling
        }


    }
    if(loading){
        return(<></>)
    }

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <div className={styles.header}>
                    <p className={styles.eyebrow}>AI Settings</p>
                    <h1 className={styles.title}>Edit Chatbot Prompts</h1>
                    <p className={styles.subtitle}>
                        Control how your AI chatbot responds to client messages and when it
                        should bring a human into the conversation.
                    </p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="ai-response-prompt">
                        AI Response Prompt
                    </label>
                    <p className={styles.description}>
                        This prompt tells the chatbot how to respond to incoming client
                        messages.
                    </p>
                    <textarea
                        id="ai-response-prompt"
                        className={styles.textarea}
                        value={aiResponsePrompt}
                        onChange={(e) => setAiResponsePrompt(e.target.value)}
                        rows={10}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="needs-user-loop-prompt">
                        Needs User In The Loop Prompt
                    </label>
                    <p className={styles.description}>
                        This prompt tells the AI when a message should be flagged for a real
                        team member to review.
                    </p>
                    <textarea
                        id="needs-user-loop-prompt"
                        className={styles.textarea}
                        value={needsUserInLoopPrompt}
                        onChange={(e) => setNeedsUserInLoopPrompt(e.target.value)}
                        rows={8}
                    />
                </div>

                <div className={styles.actions}>
                    {saved && <p className={styles.savedText}>Prompts saved.</p>}

                    <button className={styles.button} onClick={handleSave}>
                        Save Prompts
                    </button>
                </div>
            </section>
        </main>
    );
}