"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { ProtectedRoute, NotificationBell } from "@/components";
import styles from "./page.module.scss";

const cx = classNames.bind(styles);

interface IFollowUp {
    _id?: string;
    status: "IMPROVED" | "UNCHANGED" | "WORSED";
    note?: string;
    createdAt: string;
}

interface AssessmentItem {
    _id: string;
    symptomSummary: string;
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    riskExplanation: string;
    possibleCauses: string[];
    recommendedActions: string[];
    createdAt: string;
    followUps?: IFollowUp[];
}

export default function AssessmentHistoryPage() {
    const [history, setHistory] = useState<AssessmentItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<AssessmentItem | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // Form follow-up state
    const [status, setStatus] = useState<"IMPROVED" | "UNCHANGED" | "WORSED">(
        "IMPROVED",
    );
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get("/ai-analysis/history");
            const data = response.data?.data || response.data;
            const items = Array.isArray(data) ? data : [];
            setHistory(items);
            if (items.length > 0) {
                setSelectedItem(items[0]);
            }
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message ||
                    "Không thể tải lịch sử đánh giá.",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleFollowUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        try {
            setSubmitting(true);
            const res = await api.post(
                `/ai-analysis/${selectedItem._id}/follow-up`,
                {
                    status,
                    note,
                },
            );

            const updatedItem = res.data.data;
            setSelectedItem(updatedItem);
            setHistory((prev) =>
                prev.map((item) =>
                    item._id === updatedItem._id ? updatedItem : item,
                ),
            );
            setNote("");
            alert("Cập nhật tình trạng thành công!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Lỗi khi gửi cập nhật.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusText = (st: string) => {
        switch (st) {
            case "IMPROVED":
                return "🟢 Đã thuyên giảm / Tốt hơn";
            case "UNCHANGED":
                return "🟡 Không thay đổi";
            case "WORSED":
                return "🔴 Nặng hơn / Triệu chứng mới";
            default:
                return st;
        }
    };

    return (
        <ProtectedRoute>
            <div className={cx("container")}>
                <div className={cx("wrapper")}>
                    <header className={cx("header")}>
                        <div>
                            <h1>Lịch Sử & Theo Dõi Tiến Triển (Follow-up)</h1>
                            <p style={{ fontSize: "14px", color: "#6b7280" }}>
                                Theo dõi và cập nhật tình trạng sức khỏe theo
                                thời gian
                            </p>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                            }}
                        >
                            <NotificationBell />
                            <Link
                                href="/dashboard"
                                className={cx("historyLink")}
                            >
                                ← Quay lại Phân Tích
                            </Link>
                        </div>
                    </header>
                    {loading ? (
                        <div
                            className={cx("card")}
                            style={{ textAlign: "center" }}
                        >
                            Đang tải lịch sử...
                        </div>
                    ) : errorMsg ? (
                        <div
                            className={cx("card")}
                            style={{ color: "#dc2626" }}
                        >
                            {errorMsg}
                        </div>
                    ) : history.length === 0 ? (
                        <div
                            className={cx("card")}
                            style={{ textAlign: "center" }}
                        >
                            Chưa có bản ghi đánh giá sức khỏe nào.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 2fr",
                                gap: "20px",
                            }}
                        >
                            {/* Danh sách các lần phân tích */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                {history.map((item) => (
                                    <div
                                        key={item._id}
                                        className={cx(
                                            "card",
                                            "resultCard",
                                            `resultCard--${item.riskLevel}`,
                                        )}
                                        style={{
                                            cursor: "pointer",
                                            border:
                                                selectedItem?._id === item._id
                                                    ? "2px solid #0284c7"
                                                    : undefined,
                                        }}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6b7280",
                                                }}
                                            >
                                                {new Date(
                                                    item.createdAt,
                                                ).toLocaleDateString("vi-VN")}
                                            </span>
                                            <span
                                                className={cx(
                                                    "badge",
                                                    `badge--${item.riskLevel}`,
                                                )}
                                            >
                                                {item.riskLevel}
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontWeight: 500,
                                                fontSize: "14px",
                                            }}
                                        >
                                            {item.symptomSummary}
                                        </p>
                                        {item.followUps &&
                                            item.followUps.length > 0 && (
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#0284c7",
                                                        marginTop: "4px",
                                                        display: "block",
                                                    }}
                                                >
                                                    💬 {item.followUps.length}{" "}
                                                    lần cập nhật
                                                </span>
                                            )}
                                    </div>
                                ))}
                            </div>

                            {/* Chi tiết bản ghi & Form Follow-up */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                }}
                            >
                                {selectedItem && (
                                    <>
                                        <div
                                            className={cx(
                                                "card",
                                                "resultCard",
                                                `resultCard--${selectedItem.riskLevel}`,
                                            )}
                                        >
                                            <span
                                                className={cx(
                                                    "badge",
                                                    `badge--${selectedItem.riskLevel}`,
                                                )}
                                            >
                                                Mức Độ Rủi Ro:{" "}
                                                {selectedItem.riskLevel}
                                            </span>
                                            <p>
                                                <strong>
                                                    Thời gian đánh giá:
                                                </strong>{" "}
                                                {new Date(
                                                    selectedItem.createdAt,
                                                ).toLocaleString("vi-VN")}
                                            </p>
                                            <p>
                                                <strong>Tóm tắt:</strong>{" "}
                                                {selectedItem.symptomSummary}
                                            </p>
                                            <p>
                                                <strong>Giải thích:</strong>{" "}
                                                {selectedItem.riskExplanation}
                                            </p>
                                        </div>

                                        {/* Khối Cập Nhật Tiến Triển (Follow-up UI Form) */}
                                        <div
                                            className={cx("card")}
                                            style={{
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    marginTop: 0,
                                                    fontSize: "16px",
                                                    marginBottom: "12px",
                                                }}
                                            >
                                                🔄 Cập Nhật Tiến Triển Sau Đánh
                                                Giá
                                            </h3>
                                            <form
                                                onSubmit={handleFollowUpSubmit}
                                            >
                                                <div
                                                    style={{
                                                        marginBottom: "12px",
                                                    }}
                                                >
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            fontSize: "14px",
                                                            marginBottom: "4px",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        Diễn tiến sức khỏe hiện
                                                        tại:
                                                    </label>
                                                    <select
                                                        value={status}
                                                        onChange={(e: any) =>
                                                            setStatus(
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            borderRadius: "6px",
                                                            border: "1px solid #ccc",
                                                        }}
                                                    >
                                                        <option value="IMPROVED">
                                                            🟢 Đã thuyên giảm /
                                                            Tốt hơn
                                                        </option>
                                                        <option value="UNCHANGED">
                                                            🟡 Không thay đổi
                                                        </option>
                                                        <option value="WORSED">
                                                            🔴 Nặng hơn / Xuất
                                                            hiện triệu chứng mới
                                                        </option>
                                                    </select>
                                                </div>

                                                <div
                                                    style={{
                                                        marginBottom: "12px",
                                                    }}
                                                >
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            fontSize: "14px",
                                                            marginBottom: "4px",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        Ghi chú thêm (không bắt
                                                        buộc):
                                                    </label>
                                                    <textarea
                                                        value={note}
                                                        onChange={(e) =>
                                                            setNote(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="VD: Đã uống thuốc hạ sốt, hiện tại còn sốt nhẹ 37.8 độ..."
                                                        rows={2}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            borderRadius: "6px",
                                                            border: "1px solid #ccc",
                                                            resize: "vertical",
                                                        }}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    style={{
                                                        padding: "8px 16px",
                                                        backgroundColor:
                                                            "#0284c7",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {submitting
                                                        ? "Đang gửi..."
                                                        : "Gửi Cập Nhật Follow-up"}
                                                </button>
                                            </form>

                                            {/* Danh sách các lần theo dõi đã ghi nhận */}
                                            {selectedItem.followUps &&
                                                selectedItem.followUps.length >
                                                    0 && (
                                                    <div
                                                        style={{
                                                            marginTop: "20px",
                                                            borderTop:
                                                                "1px solid #e2e8f0",
                                                            paddingTop: "12px",
                                                        }}
                                                    >
                                                        <h4
                                                            style={{
                                                                margin: "0 0 8px 0",
                                                                fontSize:
                                                                    "14px",
                                                            }}
                                                        >
                                                            Lịch sử cập nhật:
                                                        </h4>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                gap: "8px",
                                                            }}
                                                        >
                                                            {selectedItem.followUps.map(
                                                                (f, idx) => (
                                                                    <div
                                                                        key={
                                                                            f._id ||
                                                                            idx
                                                                        }
                                                                        style={{
                                                                            fontSize:
                                                                                "13px",
                                                                            background:
                                                                                "#fff",
                                                                            padding:
                                                                                "8px",
                                                                            borderRadius:
                                                                                "6px",
                                                                            border: "1px solid #cbd5e1",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                fontWeight: 500,
                                                                            }}
                                                                        >
                                                                            {getStatusText(
                                                                                f.status,
                                                                            )}
                                                                        </div>
                                                                        {f.note && (
                                                                            <div
                                                                                style={{
                                                                                    color: "#475569",
                                                                                    marginTop:
                                                                                        "2px",
                                                                                }}
                                                                            >
                                                                                "
                                                                                {
                                                                                    f.note
                                                                                }

                                                                                "
                                                                            </div>
                                                                        )}
                                                                        <div
                                                                            style={{
                                                                                fontSize:
                                                                                    "11px",
                                                                                color: "#94a3b8",
                                                                                marginTop:
                                                                                    "4px",
                                                                            }}
                                                                        >
                                                                            {new Date(
                                                                                f.createdAt,
                                                                            ).toLocaleString(
                                                                                "vi-VN",
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
