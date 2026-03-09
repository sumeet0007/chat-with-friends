import { db } from "@/lib/db";

/**
 * Shared message query service
 * Handles fetching messages with proper pagination and includes
 */

const MESSAGES_BATCH = 10;

export interface MessageQueryOptions {
    channelId: string;
    cursor?: string | null;
}

export interface MessageQueryResult {
    items: any[];
    nextCursor: string | null;
}

/**
 * Fetch messages for a channel with pagination
 */
export async function getChannelMessages(
    options: MessageQueryOptions
): Promise<MessageQueryResult> {
    const { channelId, cursor } = options;

    let messages;

    if (cursor) {
        messages = await db.message.findMany({
            take: MESSAGES_BATCH,
            skip: 1,
            cursor: {
                id: cursor,
            },
            where: {
                channelId,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    }
                },
                replyTo: {
                    include: {
                        member: {
                            include: {
                                profile: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    } else {
        messages = await db.message.findMany({
            take: MESSAGES_BATCH,
            where: {
                channelId,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    }
                },
                replyTo: {
                    include: {
                        member: {
                            include: {
                                profile: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    }

    let nextCursor = null;

    if (messages.length === MESSAGES_BATCH) {
        nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return {
        items: messages,
        nextCursor,
    };
}

/**
 * Fetch direct messages for a conversation with pagination
 */
export async function getDirectMessages(
    conversationId: string,
    cursor?: string | null
): Promise<MessageQueryResult> {
    let messages;

    if (cursor) {
        messages = await db.directMessage.findMany({
            take: MESSAGES_BATCH,
            skip: 1,
            cursor: {
                id: cursor,
            },
            where: {
                conversationId,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    }
                },
                replyTo: {
                    include: {
                        member: {
                            include: {
                                profile: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    } else {
        messages = await db.directMessage.findMany({
            take: MESSAGES_BATCH,
            where: {
                conversationId,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    }
                },
                replyTo: {
                    include: {
                        member: {
                            include: {
                                profile: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    }

    let nextCursor = null;

    if (messages.length === MESSAGES_BATCH) {
        nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return {
        items: messages,
        nextCursor,
    };
}
