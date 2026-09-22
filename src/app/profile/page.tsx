"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { ProtectedRoute } from "@/components";
import styles from "./page.module.scss";
import { FileProtectOutlined } from "@ant-design/icons";

const cx = classNames.bind(styles);

export function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Form states
    const [biologicalSex, setBiologicalSex] = useState<"MALE" | "FEMALE">(
        "MALE",
    );
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [heightCm, setHeightCm] = useState<number | "">("");
    const [weightKg, setWeightKg] = useState<number | "">("");
    const [bloodType, setBloodType] = useState<string>("UNKNOWN");
    const [systolic, setSystolic] = useState<number | "">("");
    const [diastolic, setDiastolic] = useState<number | "">("");
    const [preExistingConditions, setPreExistingConditions] =
        useState<string>("");

    // Tính chỉ số BMI
    const calculateBMI = () => {
        if (
            typeof heightCm === "number" &&
            typeof weightKg === "number" &&
            heightCm > 0
        ) {
            const hMeter = heightCm / 100;
            const bmi = (weightKg / (hMeter * hMeter)).toFixed(1);
            return parseFloat(bmi);
        }
        return null;
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { text: "Gầy", color: "#eab308" };
        if (bmi < 24.9) return { text: "Bình thường", color: "#22c55e" };
        if (bmi < 29.9) return { text: "Thừa cân", color: "#f97316" };
        return { text: "Béo phì", color: "#ef4444" };
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get("/health-profiles/me");
            const data = res.data?.data || res.data;

            if (data) {
                setBiologicalSex(data.biologicalSex || "MALE");
                if (data.dateOfBirth) {
                    setDateOfBirth(
                        new Date(data.dateOfBirth).toISOString().split("T")[0],
                    );
                }
                setHeightCm(data.heightCm || "");
                setWeightKg(data.weightKg || "");
                setBloodType(data.bloodType || "UNKNOWN");
                setSystolic(data.bloodPressure?.systolic || "");
                setDiastolic(data.bloodPressure?.diastolic || "");
                setPreExistingConditions(
                    Array.isArray(data.preExistingConditions)
                        ? data.preExistingConditions.join(", ")
                        : "",
                );
            }
        } catch (err: any) {
            console.log("Chưa có hồ sơ hoặc lỗi tải:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        const payload = {
            biologicalSex,
            dateOfBirth: dateOfBirth || undefined,
            heightCm: heightCm !== "" ? Number(heightCm) : null,
            weightKg: weightKg !== "" ? Number(weightKg) : null,
            bloodType: bloodType || "UNKNOWN",
            bloodPressure: {
                systolic: systolic !== "" ? Number(systolic) : null,
                diastolic: diastolic !== "" ? Number(diastolic) : null,
            },
            preExistingConditions: preExistingConditions
                ? preExistingConditions.split(",").map((s) => s.trim())
                : [],
        };

        try {
            await api.patch("/health-profiles/me", payload);
            setMessage({
                type: "success",
                text: "Cập nhật hồ sơ sức khỏe thành công!",
            });
        } catch (err: any) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Lỗi khi lưu hồ sơ.",
            });
        } finally {
            setSaving(false);
        }
    };

    const bmiValue = calculateBMI();
    const bmiCategory = bmiValue ? getBMICategory(bmiValue) : null;

    return (
        <ProtectedRoute>
            <div className={cx("container")}>
                <div className={cx("wrapper")}>
                    {/* Header với nút quay lại Dashboard */}
                    <header className={cx("header")}>
                        <div>
                            <h1>
                                <FileProtectOutlined
                                    style={{ marginRight: "8px" }}
                                />
                                Hồ Sơ Sức Khỏe Cá Nhân
                            </h1>
                            <p
                                style={{
                                    color: "#64748b",
                                    fontSize: "14px",
                                    marginTop: "4px",
                                }}
                            >
                                Cung cấp thông tin chính xác giúp AI phân tích
                                sức khỏe chuẩn xác nhất.
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className={cx("backBtn")}
                            style={{ textDecoration: "none" }}
                        >
                            ← Quay lại Dashboard
                        </Link>
                    </header>

                    <div className={cx("card")}>
                        {message.text && (
                            <div
                                className={cx("successMsg")}
                                style={{
                                    backgroundColor:
                                        message.type === "success"
                                            ? "#dcfce7"
                                            : "#fee2e2",
                                    color:
                                        message.type === "success"
                                            ? "#15803d"
                                            : "#b91c1c",
                                }}
                            >
                                {message.text}
                            </div>
                        )}

                        {loading ? (
                            <p>Đang tải thông tin hồ sơ...</p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {/* Thông tin cơ bản */}
                                <div className={cx("formGrid")}>
                                    <div className={cx("formGroup")}>
                                        <label>Giới tính sinh học:</label>
                                        <select
                                            value={biologicalSex}
                                            onChange={(e: any) =>
                                                setBiologicalSex(e.target.value)
                                            }
                                        >
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                        </select>
                                    </div>

                                    <div className={cx("formGroup")}>
                                        <label>Ngày sinh:</label>
                                        <input
                                            type="date"
                                            value={dateOfBirth}
                                            onChange={(e) =>
                                                setDateOfBirth(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Khối chỉ số thể chất (BMI, Nhóm máu, Huyết áp) */}
                                <div
                                    style={{
                                        background: "#f8fafc",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "15px",
                                            margin: "0 0 12px 0",
                                            color: "#0284c7",
                                        }}
                                    >
                                        📊 Chỉ Số Thể Chất & Sinh Hiệu
                                    </h3>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr 1fr",
                                            gap: "12px",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <div
                                            className={cx("formGroup")}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <label>Chiều cao (cm):</label>
                                            <input
                                                type="number"
                                                placeholder="VD: 170"
                                                value={heightCm}
                                                onChange={(e) =>
                                                    setHeightCm(
                                                        e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : "",
                                                    )
                                                }
                                            />
                                        </div>

                                        <div
                                            className={cx("formGroup")}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <label>Cân nặng (kg):</label>
                                            <input
                                                type="number"
                                                placeholder="VD: 65"
                                                value={weightKg}
                                                onChange={(e) =>
                                                    setWeightKg(
                                                        e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : "",
                                                    )
                                                }
                                            />
                                        </div>

                                        <div
                                            className={cx("formGroup")}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <label>Nhóm máu:</label>
                                            <select
                                                value={bloodType}
                                                onChange={(e) =>
                                                    setBloodType(e.target.value)
                                                }
                                            >
                                                <option value="UNKNOWN">
                                                    Chưa chọn
                                                </option>
                                                <option value="A_POSITIVE">
                                                    A+
                                                </option>
                                                <option value="A_NEGATIVE">
                                                    A-
                                                </option>
                                                <option value="B_POSITIVE">
                                                    B+
                                                </option>
                                                <option value="B_NEGATIVE">
                                                    B-
                                                </option>
                                                <option value="AB_POSITIVE">
                                                    AB+
                                                </option>
                                                <option value="AB_NEGATIVE">
                                                    AB-
                                                </option>
                                                <option value="O_POSITIVE">
                                                    O+
                                                </option>
                                                <option value="O_NEGATIVE">
                                                    O-
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Hiển thị BMI tự động */}
                                    {bmiValue && bmiCategory && (
                                        <div
                                            style={{
                                                padding: "8px 12px",
                                                background: "#fff",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                marginBottom: "12px",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Chỉ số BMI:{" "}
                                            <strong>{bmiValue}</strong> — Mức
                                            độ:{" "}
                                            <span
                                                style={{
                                                    color: bmiCategory.color,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {bmiCategory.text}
                                            </span>
                                        </div>
                                    )}

                                    {/* Huyết áp */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "12px",
                                        }}
                                    >
                                        <div
                                            className={cx("formGroup")}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <label>
                                                Huyết áp tâm thu (SYS - mmHg):
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="VD: 120"
                                                value={systolic}
                                                onChange={(e) =>
                                                    setSystolic(
                                                        e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : "",
                                                    )
                                                }
                                            />
                                        </div>
                                        <div
                                            className={cx("formGroup")}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <label>
                                                Huyết áp tâm trương (DIA -
                                                mmHg):
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="VD: 80"
                                                value={diastolic}
                                                onChange={(e) =>
                                                    setDiastolic(
                                                        e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : "",
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tiền sử bệnh nền */}
                                <div className={cx("formGroup")}>
                                    <label>
                                        Tiền sử bệnh nền (cách nhau bởi dấu
                                        phẩy):
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: Cao huyết áp, Tiểu đường tuýp 2, Dạ dày"
                                        value={preExistingConditions}
                                        onChange={(e) =>
                                            setPreExistingConditions(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={cx("saveBtn")}
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : "Lưu Hồ Sơ Sức Khỏe"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

export default ProfilePage;
