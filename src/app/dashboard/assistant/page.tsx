"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute, NotificationBell, EmergencyModal } from "@/components";
import styles from "./page.module.scss";

const cx = classNames.bind(styles);

interface IChatMessage {
    _id?: string;
    role: "user" | "model";
    content: string;
    isEmergencyAlert?: boolean;
    timestamp: string;
}

interface IChatSession {
    _id: string;
    title: string;
    status: "ACTIVE" | "COMPLETED";
    createdAt: string;
    updatedAt: string;
    messages?: IChatMessage[];
}

const QUICK_PROMPTS = [
    "Tôi bị đau đầu kèm chóng mặt nhẹ từ sáng nay",
    "Đau thắt vùng thượng vị sau khi ăn no",
    "Bị sốt 38.5 độ kèm ho khan và mệt mỏi",
    "Nhịp tim đập nhanh hồi hộp khi vận động",
];

export default function AIAssistantPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [sessions, setSessions] = useState<IChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<IChatSession | null>(
        null,
    );
    const [inputMessage, setInputMessage] = useState("");
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [sending, setSending] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cuộn xuống tin nhắn mới nhất
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [currentSession?.messages, sending]);

    // 1. Tải danh sách phiên chat
    const fetchSessions = async () => {
        try {
            setLoadingSessions(true);
            const res = await api.get("/ai-analysis/chat/sessions");
            const data: IChatSession[] = res.data?.data || [];
            setSessions(data);

            if (data.length > 0) {
                await loadSessionDetails(data[0]._id);
            } else {
                await handleCreateNewSession();
            }
        } catch (error) {
            console.error("Lỗi khi tải phiên chat:", error);
        } finally {
            setLoadingSessions(false);
        }
    };

    // 2. Tải chi tiết một phiên chat kèm tin nhắn
    const loadSessionDetails = async (sessionId: string) => {
        try {
            const res = await api.get(`/ai-analysis/chat/session/${sessionId}`);
            setCurrentSession(res.data.data);
        } catch (error) {
            console.error("Không thể tải tin nhắn:", error);
        }
    };

    // 3. Tạo phiên chat mới
    const handleCreateNewSession = async () => {
        try {
            const res = await api.post("/ai-analysis/chat/session", {});
            const newSession: IChatSession = res.data.data;
            setSessions((prev) => [newSession, ...prev]);
            setCurrentSession(newSession);
        } catch (error) {
            console.error("Lỗi tạo phiên chat:", error);
        }
    };

    // 4. Gửi tin nhắn
    const handleSendMessage = async (customText?: string) => {
        const textToSend = (customText || inputMessage).trim();
        if (!textToSend || !currentSession || sending) return;

        setInputMessage("");
        setSending(true);

        // Optimistic UI: Đẩy tin nhắn người dùng lên khung chat trước
        const optimisticUserMessage: IChatMessage = {
            role: "user",
            content: textToSend,
            timestamp: new Date().toISOString(),
        };

        setCurrentSession((prev) =>
            prev
                ? {
                      ...prev,
                      messages: [
                          ...(prev.messages || []),
                          optimisticUserMessage,
                      ],
                  }
                : null,
        );

        try {
            const res = await api.post(
                `/ai-analysis/chat/session/${currentSession._id}/message`,
                { message: textToSend },
            );

            const updatedSession: IChatSession = res.data.data;
            setCurrentSession(updatedSession);

            // Cập nhật lại tiêu đề phiên chat trong sidebar nếu có thay đổi
            setSessions((prev) =>
                prev.map((s) =>
                    s._id === updatedSession._id
                        ? {
                              ...s,
                              title: updatedSession.title,
                              updatedAt: updatedSession.updatedAt,
                          }
                        : s,
                ),
            );

            // Kiểm tra cảnh báo cấp cứu khẩn cấp từ Tầng 1 Guardrail
            const lastMsg =
                updatedSession.messages?.[updatedSession.messages.length - 1];
            if (lastMsg?.isEmergencyAlert) {
                setShowEmergencyModal(true);
            }
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                    "Không thể kết nối đến Trợ lý AI.",
            );
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <ProtectedRoute>
            <div className={cx("container")}>
                <div className={cx("wrapper")}>
                    {/* Header chung */}
                    <header className={cx("header")}>
                        <div className={cx("brand")}>
                            <h1>HealthShield Assistant 🩺</h1>
                            <p>
                                Trợ lý ảo tư vấn & đánh giá rủi ro sức khỏe sơ
                                bộ qua AI
                            </p>
                        </div>
                        <div className={cx("navActions")}>
                            <NotificationBell />
                            <Link href="/dashboard" className={cx("navLink")}>
                                Form Phân Tích
                            </Link>
                            <Link
                                href="/dashboard/history"
                                className={cx("navLink")}
                            >
                                📜 Lịch Sử
                            </Link>
                        </div>
                    </header>

                    <div className={cx("chatLayout")}>
                        {/* SIDEBAR: DANH SÁCH CUỘC TRÒ CHUYỆN */}
                        <aside className={cx("sidebar")}>
                            <button
                                type="button"
                                className={cx("newChatBtn")}
                                onClick={handleCreateNewSession}
                            >
                                + Cuộc Trò Chuyện Mới
                            </button>

                            <div className={cx("sessionList")}>
                                {loadingSessions ? (
                                    <div className={cx("loadingText")}>
                                        Đang tải hội thoại...
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className={cx("loadingText")}>
                                        Chưa có cuộc trò chuyện nào
                                    </div>
                                ) : (
                                    sessions.map((item) => (
                                        <div
                                            key={item._id}
                                            className={cx("sessionItem", {
                                                active:
                                                    currentSession?._id ===
                                                    item._id,
                                            })}
                                            onClick={() =>
                                                loadSessionDetails(item._id)
                                            }
                                        >
                                            <div className={cx("sessionTitle")}>
                                                {item.title}
                                            </div>
                                            <div className={cx("sessionDate")}>
                                                {new Date(
                                                    item.updatedAt ||
                                                        item.createdAt,
                                                ).toLocaleDateString("vi-VN")}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>

                        {/* MAIN CHAT WINDOW */}
                        <main className={cx("chatArea")}>
                            {/* Khu vực hiển thị tin nhắn */}
                            <div className={cx("messagesContainer")}>
                                {currentSession?.messages &&
                                currentSession.messages.length > 0 ? (
                                    currentSession.messages.map(
                                        (msg, index) => (
                                            <div
                                                key={msg._id || index}
                                                className={cx(
                                                    "messageWrapper",
                                                    `messageWrapper--${msg.role}`,
                                                )}
                                            >
                                                <div
                                                    className={cx(
                                                        "bubble",
                                                        `bubble--${msg.role}`,
                                                        {
                                                            emergency:
                                                                msg.isEmergencyAlert,
                                                        },
                                                    )}
                                                >
                                                    <div
                                                        className={cx(
                                                            "senderLabel",
                                                        )}
                                                    >
                                                        {msg.role === "user"
                                                            ? "Bạn"
                                                            : "HealthShield AI"}
                                                    </div>
                                                    <div
                                                        className={cx(
                                                            "bubbleContent",
                                                        )}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                    <div
                                                        className={cx(
                                                            "timestamp",
                                                        )}
                                                    >
                                                        {new Date(
                                                            msg.timestamp,
                                                        ).toLocaleTimeString(
                                                            "vi-VN",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <div className={cx("emptyChatState")}>
                                        <div className={cx("emptyIcon")}>
                                            🩺
                                        </div>
                                        <h3>
                                            Chào bạn, {user?.fullName || "bạn"}!
                                        </h3>
                                        <p>
                                            Tôi là trợ lý y tế HealthShield AI.
                                            Hãy mô tả triệu chứng hoặc vấn đề
                                            sức khỏe bạn đang gặp phải.
                                        </p>

                                        {/* Gợi ý triệu chứng nhanh */}
                                        <div
                                            className={cx(
                                                "quickPromptsSection",
                                            )}
                                        >
                                            <span>Gợi ý câu hỏi nhanh:</span>
                                            <div className={cx("promptChips")}>
                                                {QUICK_PROMPTS.map(
                                                    (prompt, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            className={cx(
                                                                "promptChip",
                                                            )}
                                                            onClick={() =>
                                                                handleSendMessage(
                                                                    prompt,
                                                                )
                                                            }
                                                        >
                                                            {prompt}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sending && (
                                    <div
                                        className={cx(
                                            "messageWrapper",
                                            "messageWrapper--model",
                                        )}
                                    >
                                        <div
                                            className={cx(
                                                "bubble",
                                                "bubble--model",
                                                "typing",
                                            )}
                                        >
                                            <span className={cx("dot")}></span>
                                            <span className={cx("dot")}></span>
                                            <span className={cx("dot")}></span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Khu vực soạn thảo tin nhắn */}
                            <div className={cx("inputArea")}>
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) =>
                                        setInputMessage(e.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập triệu chứng của bạn (Shift + Enter để xuống dòng)..."
                                    rows={2}
                                    className={cx("chatInput")}
                                    disabled={sending}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSendMessage()}
                                    disabled={sending || !inputMessage.trim()}
                                    className={cx("sendBtn")}
                                >
                                    {sending ? "..." : "Gửi ➔"}
                                </button>
                            </div>
                        </main>
                    </div>
                </div>

                {/* Emergency Modal Triage */}
                <EmergencyModal
                    isOpen={showEmergencyModal}
                    onClose={() => setShowEmergencyModal(false)}
                    actions={[
                        "Gọi ngay cấp cứu 115 hoặc nhờ người thân trợ giúp lập tức.",
                        "Không tự ý lái xe hay dùng các loại thuốc hạ sốt, giảm đau chưa rõ tác dụng phụ.",
                        "Nới lỏng trang phục và ngồi ở vị trí thông thoáng.",
                    ]}
                />
            </div>
        </ProtectedRoute>
    );
}
