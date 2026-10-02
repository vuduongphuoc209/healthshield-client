"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import classNames from "classnames/bind";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { api } from "@/lib/axios";
import { ProtectedRoute, NotificationBell } from "@/components";
import type { HealthAnalyticsOverview } from "@/types";
import styles from "./page.module.scss";

const cx = classNames.bind(styles);

const RISK_COLORS = {
    LOW: "#10b981", // Xanh ngọc
    MODERATE: "#f59e0b", // Vàng
    HIGH: "#f97316", // Cam
    CRITICAL: "#ef4444", // Đỏ
};

export default function AnalyticsPage() {
    const [data, setData] = useState<HealthAnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Gọi endpoint bạn vừa tạo ở backend
            const response = await api.get("/ai-analysis/overview");
            setData(response.data.data);
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message ||
                    "Không thể tải dữ liệu thống kê.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <ProtectedRoute>
                <div className={cx("loading")}>
                    Đang phân tích dữ liệu tổng quan...
                </div>
            </ProtectedRoute>
        );
    if (errorMsg || !data)
        return (
            <ProtectedRoute>
                <div className={cx("error")}>{errorMsg}</div>
            </ProtectedRoute>
        );

    // Chuẩn bị dữ liệu cho biểu đồ tròn (Pie Chart)
    const pieData = [
        {
            name: "Cấp cứu",
            value: data.riskDistribution.CRITICAL,
            color: RISK_COLORS.CRITICAL,
        },
        {
            name: "Cao",
            value: data.riskDistribution.HIGH,
            color: RISK_COLORS.HIGH,
        },
        {
            name: "Trung bình",
            value: data.riskDistribution.MODERATE,
            color: RISK_COLORS.MODERATE,
        },
        {
            name: "Thấp",
            value: data.riskDistribution.LOW,
            color: RISK_COLORS.LOW,
        },
    ].filter((item) => item.value > 0);

    // Chuẩn bị dữ liệu cho biểu đồ cột tiến độ
    const followUpData = [
        {
            name: "Thuyên giảm",
            count: data.followUpStats.improvedCount,
            fill: "#10b981",
        },
        {
            name: "Không đổi",
            count: data.followUpStats.unchangedCount,
            fill: "#94a3b8",
        },
        {
            name: "Nặng hơn",
            count: data.followUpStats.worsenedCount,
            fill: "#ef4444",
        },
    ];

    return (
        <ProtectedRoute>
            <div className={cx("container")}>
                <div className={cx("wrapper")}>
                    <header className={cx("header")}>
                        <div className={cx("headerInfo")}>
                            <h1>Tổng Quan Sức Khỏe</h1>
                            <p>
                                Phân tích dữ liệu y tế cá nhân và xu hướng sức
                                khỏe
                            </p>
                        </div>
                        <div className={cx("navActions")}>
                            <NotificationBell />
                            <Link href="/dashboard" className={cx("navLink")}>
                                ← Quay lại Dashboard
                            </Link>
                        </div>
                    </header>

                    {/* HÀNG 1: CÁC THẺ THỐNG KÊ NHANH */}
                    <div className={cx("statsGrid")}>
                        <div className={cx("statCard")}>
                            <span className={cx("statLabel")}>
                                Điểm Ổn Định
                            </span>
                            <div className={cx("statValue", "textPrimary")}>
                                {data.summary.healthStabilityScore}{" "}
                                <span className={cx("statSuffix")}>/ 100</span>
                            </div>
                        </div>
                        <div className={cx("statCard")}>
                            <span className={cx("statLabel")}>
                                Số Lần Đánh Giá
                            </span>
                            <div className={cx("statValue")}>
                                {data.summary.totalAssessments}
                            </div>
                        </div>
                        <div className={cx("statCard")}>
                            <span className={cx("statLabel")}>
                                Cảnh Báo Cấp Cứu
                            </span>
                            <div className={cx("statValue", "textDanger")}>
                                {data.summary.criticalAlertsCount}
                            </div>
                        </div>
                        <div className={cx("statCard")}>
                            <span className={cx("statLabel")}>
                                Tỷ Lệ Thuyên Giảm
                            </span>
                            <div className={cx("statValue", "textSuccess")}>
                                {data.followUpStats.recoveryRatePercent}%
                            </div>
                        </div>
                    </div>

                    {/* HÀNG 2: BIỂU ĐỒ & CHỈ SỐ SINH HIỆU */}
                    <div className={cx("mainGrid")}>
                        {/* Biểu đồ phân bổ rủi ro */}
                        <div className={cx("card")}>
                            <h3>Phân Bổ Rủi Ro Sức Khỏe</h3>
                            <div className={cx("chartWrapper")}>
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={250}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className={cx("emptyText")}>
                                        Chưa có đủ dữ liệu
                                    </p>
                                )}
                            </div>
                            <div className={cx("chartLegend")}>
                                {pieData.map((item, i) => (
                                    <span key={i} className={cx("legendItem")}>
                                        <span
                                            className={cx("dot")}
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        {item.name} ({item.value})
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Thông tin sinh hiệu hiện tại */}
                        <div className={cx("card", "vitalsCard")}>
                            <h3>Chỉ Số Thể Chất (Vitals)</h3>
                            <div className={cx("vitalsGrid")}>
                                <div className={cx("vitalItem")}>
                                    <span className={cx("vLabel")}>
                                        Chỉ số BMI
                                    </span>
                                    <span className={cx("vValue")}>
                                        {data.currentVitals.bmi || "--"}
                                    </span>
                                    <span className={cx("vDesc")}>
                                        {data.currentVitals.bmiCategory}
                                    </span>
                                </div>
                                <div className={cx("vitalItem")}>
                                    <span className={cx("vLabel")}>
                                        Huyết áp gần nhất
                                    </span>
                                    <span className={cx("vValue")}>
                                        {data.currentVitals.bloodPressure
                                            ?.systolic
                                            ? `${data.currentVitals.bloodPressure.systolic}/${data.currentVitals.bloodPressure.diastolic}`
                                            : "--/--"}
                                    </span>
                                    <span className={cx("vDesc")}>mmHg</span>
                                </div>
                                <div className={cx("vitalItem")}>
                                    <span className={cx("vLabel")}>
                                        Nhóm máu
                                    </span>
                                    <span className={cx("vValue")}>
                                        {data.currentVitals.bloodType !==
                                        "UNKNOWN"
                                            ? data.currentVitals.bloodType
                                            : "--"}
                                    </span>
                                </div>
                                <div className={cx("vitalItem")}>
                                    <span className={cx("vLabel")}>
                                        Chiều cao / Cân nặng
                                    </span>
                                    <span className={cx("vValue")}>
                                        {data.currentVitals.heightCm || "--"}cm
                                        / {data.currentVitals.weightKg || "--"}
                                        kg
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Biểu đồ diễn tiến phục hồi */}
                        <div className={cx("card", "fullWidth")}>
                            <h3>Hiệu Quả Phục Hồi (Follow-up)</h3>
                            <div className={cx("chartWrapper")}>
                                {data.followUpStats.totalFollowUps > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={250}
                                    >
                                        <BarChart
                                            data={followUpData}
                                            margin={{
                                                top: 20,
                                                right: 30,
                                                left: 0,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#e2e8f0"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: "transparent" }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={60}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className={cx("emptyText")}>
                                        Chưa có ghi nhận theo dõi phục hồi nào.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
