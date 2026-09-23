"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
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
    redFlags?: string[];
    medicalDisclaimer?: string;
    createdAt: string;
    followUps?: IFollowUp[];
}

interface PatientVitals {
    biologicalSex?: string;
    bloodType?: string;
    heightCm?: number;
    weightKg?: number;
    bloodPressure?: {
        systolic?: number;
        diastolic?: number;
    };
    preExistingConditions?: string[];
}

export default function AssessmentHistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<AssessmentItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<AssessmentItem | null>(
        null,
    );
    const [patientVitals, setPatientVitals] = useState<PatientVitals | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // --- State Bộ lọc & Tìm kiếm ---
    const [riskFilter, setRiskFilter] = useState<string>("ALL");
    const [timeFilter, setTimeFilter] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // --- Form Follow-up State ---
    const [status, setStatus] = useState<"IMPROVED" | "UNCHANGED" | "WORSED">(
        "IMPROVED",
    );
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchPatientProfile();
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

    const fetchPatientProfile = async () => {
        try {
            const res = await api.get("/health-profile");
            const data = res.data?.data || res.data;
            if (data) {
                setPatientVitals(data);
            }
        } catch {
            // Không bắt buộc phải có profile để chạy history
        }
    };

    // --- Logic Lọc & Tìm kiếm ---
    const filteredHistory = useMemo(() => {
        return history.filter((item) => {
            // 1. Lọc theo Risk Level
            if (riskFilter !== "ALL" && item.riskLevel !== riskFilter) {
                return false;
            }

            // 2. Lọc theo thời gian
            if (timeFilter !== "ALL") {
                const itemDate = new Date(item.createdAt).getTime();
                const now = new Date().getTime();
                const daysDiff = (now - itemDate) / (1000 * 3600 * 24);

                if (timeFilter === "7_DAYS" && daysDiff > 7) return false;
                if (timeFilter === "30_DAYS" && daysDiff > 30) return false;
            }

            // 3. Tìm kiếm theo từ khóa triệu chứng
            if (searchTerm.trim() !== "") {
                const term = searchTerm.toLowerCase();
                const inSummary = item.symptomSummary
                    .toLowerCase()
                    .includes(term);
                const inExplanation = item.riskExplanation
                    ?.toLowerCase()
                    .includes(term);
                if (!inSummary && !inExplanation) return false;
            }

            return true;
        });
    }, [history, riskFilter, timeFilter, searchTerm]);

    // Khi danh sách lọc thay đổi, tự động chọn bản ghi đầu tiên nếu bản ghi hiện tại không thuộc danh sách
    useEffect(() => {
        if (filteredHistory.length > 0) {
            const exists = filteredHistory.some(
                (i) => i._id === selectedItem?._id,
            );
            if (!exists) {
                setSelectedItem(filteredHistory[0]);
            }
        } else {
            setSelectedItem(null);
        }
    }, [filteredHistory, selectedItem]);

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

    // --- Hàm xuất báo cáo y tế ra PDF ---
    const handleExportPDF = () => {
        if (!selectedItem) {
            alert("Vui lòng chọn một phiên đánh giá để xuất báo cáo!");
            return;
        }
        window.print();
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
                    {/* Header chuẩn (Sẽ ẩn khi in PDF) */}
                    <header className={cx("header", "noPrint")}>
                        <div>
                            <h1>Lịch Sử & Theo Dõi Tiến Triển (Follow-up)</h1>
                            <p style={{ fontSize: "14px", color: "#6b7280" }}>
                                Theo dõi, lọc lịch sử và xuất báo cáo sức khỏe
                                cho bác sĩ
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
                    ) : (
                        <div className={cx("mainLayout")}>
                            {/* CỘT TRÁI: BỘ LỌC & DANH SÁCH (Ẩn khi in PDF) */}
                            <div className={cx("sidebar", "noPrint")}>
                                {/* Khối Bộ Lọc */}
                                <div className={cx("filterCard")}>
                                    <div className={cx("filterHeader")}>
                                        <span>🔍 Bộ lọc lịch sử</span>
                                        <button
                                            type="button"
                                            className={cx("resetBtn")}
                                            onClick={() => {
                                                setRiskFilter("ALL");
                                                setTimeFilter("ALL");
                                                setSearchTerm("");
                                            }}
                                        >
                                            Đặt lại
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Tìm triệu chứng..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className={cx("searchInput")}
                                    />

                                    <div className={cx("filterGrid")}>
                                        <div>
                                            <label>Mức độ rủi ro:</label>
                                            <select
                                                value={riskFilter}
                                                onChange={(e) =>
                                                    setRiskFilter(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="ALL">
                                                    Tất cả mức độ
                                                </option>
                                                <option value="CRITICAL">
                                                    🔴 Cấp cứu (CRITICAL)
                                                </option>
                                                <option value="HIGH">
                                                    🟠 Cao (HIGH)
                                                </option>
                                                <option value="MODERATE">
                                                    🟡 Trung bình (MODERATE)
                                                </option>
                                                <option value="LOW">
                                                    🟢 Thấp (LOW)
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label>Thời gian:</label>
                                            <select
                                                value={timeFilter}
                                                onChange={(e) =>
                                                    setTimeFilter(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="ALL">
                                                    Toàn bộ thời gian
                                                </option>
                                                <option value="7_DAYS">
                                                    7 ngày gần nhất
                                                </option>
                                                <option value="30_DAYS">
                                                    30 ngày gần nhất
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={cx("resultCount")}>
                                        Hiển thị:{" "}
                                        <strong>
                                            {filteredHistory.length}
                                        </strong>{" "}
                                        / {history.length} bản ghi
                                    </div>
                                </div>

                                {/* Danh sách bản ghi sau lọc */}
                                <div className={cx("historyList")}>
                                    {filteredHistory.length === 0 ? (
                                        <div className={cx("emptyItem")}>
                                            Không tìm thấy bản ghi phù hợp.
                                        </div>
                                    ) : (
                                        filteredHistory.map((item) => (
                                            <div
                                                key={item._id}
                                                className={cx(
                                                    "card",
                                                    "historyItemCard",
                                                    `historyItemCard--${item.riskLevel}`,
                                                    {
                                                        active:
                                                            selectedItem?._id ===
                                                            item._id,
                                                    },
                                                )}
                                                onClick={() =>
                                                    setSelectedItem(item)
                                                }
                                            >
                                                <div className={cx("itemTop")}>
                                                    <span
                                                        className={cx(
                                                            "dateText",
                                                        )}
                                                    >
                                                        {new Date(
                                                            item.createdAt,
                                                        ).toLocaleDateString(
                                                            "vi-VN",
                                                        )}
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
                                                    className={cx(
                                                        "summaryText",
                                                    )}
                                                >
                                                    {item.symptomSummary}
                                                </p>
                                                {item.followUps &&
                                                    item.followUps.length >
                                                        0 && (
                                                        <span
                                                            className={cx(
                                                                "followUpCount",
                                                            )}
                                                        >
                                                            💬{" "}
                                                            {
                                                                item.followUps
                                                                    .length
                                                            }{" "}
                                                            lần cập nhật
                                                        </span>
                                                    )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* CỘT PHẢI: CHI TIẾT & BẢN IN PDF */}
                            <div className={cx("detailContent")}>
                                {selectedItem ? (
                                    <>
                                        {/* Khối Thanh Công Cụ Thao Tác (Ẩn khi in) */}
                                        <div
                                            className={cx(
                                                "actionToolbar",
                                                "noPrint",
                                            )}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "14px",
                                                    color: "#475569",
                                                }}
                                            >
                                                Mã phiên:{" "}
                                                <code>{selectedItem._id}</code>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleExportPDF}
                                                className={cx("exportPdfBtn")}
                                            >
                                                🖨️ Xuất Báo Cáo PDF
                                            </button>
                                        </div>

                                        {/* GIAO DIỆN BÁO CÁO Y TẾ (Hiển thị cả trên web & Khi in PDF) */}
                                        <div
                                            className={cx(
                                                "medicalReportCard",
                                                `riskBorder--${selectedItem.riskLevel}`,
                                            )}
                                        >
                                            {/* Header chuẩn y tế chỉ hiển thị khi in */}
                                            <div
                                                className={cx(
                                                    "printHeader",
                                                    "printOnly",
                                                )}
                                            >
                                                <div
                                                    className={cx(
                                                        "hospitalBrand",
                                                    )}
                                                >
                                                    <h2>
                                                        HEALTHSHIELD AI — HỆ
                                                        THỐNG ĐÁNH GIÁ SỨC KHỎE
                                                        SƠ BỘ
                                                    </h2>
                                                    <p>
                                                        Báo cáo tóm tắt triệu
                                                        chứng & khuyến nghị y
                                                        khoa ban đầu
                                                    </p>
                                                </div>
                                                <div
                                                    className={cx("reportMeta")}
                                                >
                                                    <div>
                                                        Mã hồ sơ:{" "}
                                                        {selectedItem._id}
                                                    </div>
                                                    <div>
                                                        Ngày in:{" "}
                                                        {new Date().toLocaleDateString(
                                                            "vi-VN",
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Thông tin bệnh nhân & Chỉ số sinh hiệu (Print & Web) */}
                                            <div className={cx("patientBox")}>
                                                <div
                                                    className={cx(
                                                        "patientGrid",
                                                    )}
                                                >
                                                    <div>
                                                        <strong>
                                                            Họ và tên:
                                                        </strong>{" "}
                                                        {user?.fullName ||
                                                            "Bệnh nhân"}
                                                    </div>
                                                    <div>
                                                        <strong>Email:</strong>{" "}
                                                        {user?.email}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Thời gian phân tích:
                                                        </strong>{" "}
                                                        {new Date(
                                                            selectedItem.createdAt,
                                                        ).toLocaleString(
                                                            "vi-VN",
                                                        )}
                                                    </div>
                                                    {patientVitals && (
                                                        <>
                                                            <div>
                                                                <strong>
                                                                    Giới tính:
                                                                </strong>{" "}
                                                                {patientVitals.biologicalSex ===
                                                                "FEMALE"
                                                                    ? "Nữ"
                                                                    : "Nam"}
                                                            </div>
                                                            <div>
                                                                <strong>
                                                                    Nhóm máu:
                                                                </strong>{" "}
                                                                {patientVitals.bloodType ||
                                                                    "N/A"}
                                                            </div>
                                                            <div>
                                                                <strong>
                                                                    Huyết áp:
                                                                </strong>{" "}
                                                                {patientVitals
                                                                    .bloodPressure
                                                                    ?.systolic
                                                                    ? `${patientVitals.bloodPressure.systolic}/${patientVitals.bloodPressure.diastolic} mmHg`
                                                                    : "Chưa ghi nhận"}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Trạng thái rủi ro */}
                                            <div className={cx("riskSection")}>
                                                <span
                                                    className={cx(
                                                        "badge",
                                                        `badge--${selectedItem.riskLevel}`,
                                                    )}
                                                >
                                                    Mức Độ Nguy Cơ:{" "}
                                                    {selectedItem.riskLevel}
                                                </span>
                                            </div>

                                            <div className={cx("reportRow")}>
                                                <strong>
                                                    Tóm tắt triệu chứng:
                                                </strong>
                                                <p>
                                                    {
                                                        selectedItem.symptomSummary
                                                    }
                                                </p>
                                            </div>

                                            <div className={cx("reportRow")}>
                                                <strong>
                                                    Phân tích & Giải thích y tế:
                                                </strong>
                                                <p>
                                                    {
                                                        selectedItem.riskExplanation
                                                    }
                                                </p>
                                            </div>

                                            {selectedItem.possibleCauses
                                                ?.length > 0 && (
                                                <div
                                                    className={cx(
                                                        "reportSection",
                                                    )}
                                                >
                                                    <h4>
                                                        Nguyên nhân tiềm năng có
                                                        thể gặp:
                                                    </h4>
                                                    <ul>
                                                        {selectedItem.possibleCauses.map(
                                                            (c, i) => (
                                                                <li key={i}>
                                                                    {c}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedItem.recommendedActions
                                                ?.length > 0 && (
                                                <div
                                                    className={cx(
                                                        "reportSection",
                                                    )}
                                                >
                                                    <h4>
                                                        Khuyến nghị hành động
                                                        ban đầu:
                                                    </h4>
                                                    <ul>
                                                        {selectedItem.recommendedActions.map(
                                                            (a, i) => (
                                                                <li key={i}>
                                                                    {a}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedItem.redFlags &&
                                                selectedItem.redFlags.length >
                                                    0 && (
                                                    <div
                                                        className={cx(
                                                            "reportSection",
                                                            "redFlagBox",
                                                        )}
                                                    >
                                                        <h4
                                                            style={{
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            🚩 Cảnh báo nguy
                                                            hiểm (Red Flags):
                                                        </h4>
                                                        <ul>
                                                            {selectedItem.redFlags.map(
                                                                (flag, i) => (
                                                                    <li
                                                                        key={i}
                                                                        style={{
                                                                            color: "#dc2626",
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        {flag}
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                            {/* Khối Lịch sử Follow-up */}
                                            {selectedItem.followUps &&
                                                selectedItem.followUps.length >
                                                    0 && (
                                                    <div
                                                        className={cx(
                                                            "reportSection",
                                                            "followUpLogSection",
                                                        )}
                                                    >
                                                        <h4>
                                                            Nhật ký theo dõi
                                                            tiến triển sức khỏe:
                                                        </h4>
                                                        <div
                                                            className={cx(
                                                                "followUpTimeline",
                                                            )}
                                                        >
                                                            {selectedItem.followUps.map(
                                                                (f, idx) => (
                                                                    <div
                                                                        key={
                                                                            f._id ||
                                                                            idx
                                                                        }
                                                                        className={cx(
                                                                            "followUpItem",
                                                                        )}
                                                                    >
                                                                        <div
                                                                            className={cx(
                                                                                "fStatus",
                                                                            )}
                                                                        >
                                                                            {getStatusText(
                                                                                f.status,
                                                                            )}
                                                                        </div>
                                                                        {f.note && (
                                                                            <div
                                                                                className={cx(
                                                                                    "fNote",
                                                                                )}
                                                                            >
                                                                                "
                                                                                {
                                                                                    f.note
                                                                                }
                                                                                "
                                                                            </div>
                                                                        )}
                                                                        <div
                                                                            className={cx(
                                                                                "fDate",
                                                                            )}
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

                                            {/* Disclaimer */}
                                            <div className={cx("disclaimer")}>
                                                {selectedItem.medicalDisclaimer ||
                                                    "Đây là đánh giá rủi ro sơ bộ dựa trên thông tin cung cấp, không thay thế cho chẩn đoán hoặc điều trị y tế chuyên nghiệp. Nếu triệu chứng nghiêm trọng, hãy gọi cấp cứu hoặc đến cơ sở y tế gần nhất."}
                                            </div>

                                            {/* Chữ ký xác nhận dành riêng cho trang in PDF */}
                                            <div
                                                className={cx(
                                                    "signatureGrid",
                                                    "printOnly",
                                                )}
                                            >
                                                <div>
                                                    <p>Người lập báo cáo</p>
                                                    <br />
                                                    <br />
                                                    <strong>
                                                        {user?.fullName ||
                                                            "Người dùng"}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <p>
                                                        Bác sĩ / Nhân viên tiếp
                                                        nhận
                                                    </p>
                                                    <br />
                                                    <br />
                                                    <span>
                                                        (Ký, ghi rõ họ tên)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* FORM CẬP NHẬT FOLLOW-UP (Ẩn khi in PDF) */}
                                        <div
                                            className={cx(
                                                "card",
                                                "followUpCard",
                                                "noPrint",
                                            )}
                                        >
                                            <h3>
                                                🔄 Cập Nhật Tiến Triển Sau Đánh
                                                Giá
                                            </h3>
                                            <form
                                                onSubmit={handleFollowUpSubmit}
                                            >
                                                <div
                                                    className={cx("formGroup")}
                                                >
                                                    <label>
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
                                                    className={cx("formGroup")}
                                                >
                                                    <label>
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
                                                        placeholder="VD: Đã uống thuốc theo đơn, hiện tại các cơn đau đã giảm dần..."
                                                        rows={2}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className={cx("submitBtn")}
                                                >
                                                    {submitting
                                                        ? "Đang gửi..."
                                                        : "Gửi Cập Nhật Follow-up"}
                                                </button>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className={cx("card")}
                                        style={{ textAlign: "center" }}
                                    >
                                        Vui lòng chọn một phiên đánh giá từ danh
                                        sách bên trái.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
