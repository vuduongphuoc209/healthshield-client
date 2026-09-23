"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import styles from "./NotificationBell.module.scss";
import { NotificationOutlined } from "@ant-design/icons";

const cx = classNames.bind(styles);

export interface NotificationItem {
    id: string;
    type: "FOLLOW_UP_REMINDER" | "RISK_ALERT" | "SYSTEM";
    title: string;
    message: string;
    isRead: boolean;
    metadata?: {
        assessmentId?: string;
    } | null;
    createdAt: string;
}

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // 1. Lấy số lượng thông báo chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get("/notifications/unread-count");
            setUnreadCount(res.data.data.unreadCount || 0);
        } catch (error) {
            console.error("Lỗi khi tải số lượng thông báo:", error);
        }
    }, []);

    // 2. Lấy danh sách thông báo khi mở dropdown
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get("/notifications?limit=10");
            const items = res.data.data.items || [];
            setNotifications(items);
        } catch (error) {
            console.error("Lỗi khi tải danh sách thông báo:", error);
        } finally {
            setLoading(false);
        }
    };

    // Chu kỳ cập nhật số thông báo chưa đọc mỗi 30 giây
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Bắt sự kiện Click Outside để tự động đóng dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen) {
            fetchNotifications();
            fetchUnreadCount();
        }
        setIsOpen(!isOpen);
    };

    // Đánh dấu tất cả đã đọc
    const handleMarkAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) =>
                prev.map((item) => ({ ...item, isRead: true })),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Lỗi đánh dấu tất cả đã đọc:", error);
        }
    };

    // Click vào một thông báo cụ thể
    const handleNotificationClick = async (notif: NotificationItem) => {
        if (!notif.isRead) {
            try {
                await api.patch(`/notifications/${notif.id}/read`);
                setNotifications((prev) =>
                    prev.map((item) =>
                        item.id === notif.id ? { ...item, isRead: true } : item,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Lỗi đánh dấu đã đọc:", error);
            }
        }

        setIsOpen(false);
        // Nếu là thông báo nhắc nhở cập nhật, chuyển sang trang lịch sử/tiến triển
        if (notif.type === "FOLLOW_UP_REMINDER") {
            router.push("/dashboard/history");
        }
    };

    const getTypeBadge = (type: NotificationItem["type"]) => {
        switch (type) {
            case "FOLLOW_UP_REMINDER":
                return { text: "Nhắc nhở", classModifier: "reminder" };
            case "RISK_ALERT":
                return { text: "Cảnh báo", classModifier: "alert" };
            case "SYSTEM":
            default:
                return { text: "Hệ thống", classModifier: "system" };
        }
    };

    return (
        <div className={cx("bellContainer")} ref={dropdownRef}>
            <button
                type="button"
                className={cx("bellBtn")}
                onClick={handleToggle}
                aria-label="Thông báo sức khỏe"
            >
                <NotificationOutlined />
                {unreadCount > 0 && (
                    <span className={cx("badge")}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={cx("dropdown")}>
                    <div className={cx("dropdownHeader")}>
                        <h3>Thông Báo Sức Khỏe</h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className={cx("markAllBtn")}
                                onClick={handleMarkAllRead}
                            >
                                Đã đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className={cx("notificationList")}>
                        {loading ? (
                            <div className={cx("stateText")}>
                                Đang tải thông báo...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className={cx("stateText")}>
                                Không có thông báo nào
                            </div>
                        ) : (
                            notifications.map((item) => {
                                const badgeInfo = getTypeBadge(item.type);
                                return (
                                    <div
                                        key={item.id}
                                        className={cx("item", {
                                            unread: !item.isRead,
                                        })}
                                        onClick={() =>
                                            handleNotificationClick(item)
                                        }
                                    >
                                        <div className={cx("itemHeader")}>
                                            <span
                                                className={cx(
                                                    "typeTag",
                                                    `typeTag--${badgeInfo.classModifier}`,
                                                )}
                                            >
                                                {badgeInfo.text}
                                            </span>
                                            <span className={cx("timestamp")}>
                                                {new Date(
                                                    item.createdAt,
                                                ).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}{" "}
                                                -{" "}
                                                {new Date(
                                                    item.createdAt,
                                                ).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                        <div className={cx("itemTitle")}>
                                            {item.title}
                                        </div>
                                        <div className={cx("itemMessage")}>
                                            {item.message}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
