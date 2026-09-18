"use client";

import React from "react";
import classNames from "classnames/bind";
import styles from "./EmergencyModal.module.scss";

const cx = classNames.bind(styles);

interface Props {
    isOpen: boolean;
    onClose: () => void;
    actions: string[];
}

export const EmergencyModal = ({ isOpen, onClose, actions }: Props) => {
    if (!isOpen) return null;

    return (
        <div className={cx("overlay")}>
            <div className={cx("modal")}>
                <div className={cx("title")}>🚨 CẢNH BÁO Y TẾ KHẨN CẤP</div>
                <p>
                    Phát hiện dấu hiệu nguy hiểm tới tính mạng. Cần sự can thiệp
                    y tế lập tức!
                </p>

                <ul style={{ paddingLeft: "20px", margin: "12px 0" }}>
                    {actions.map((act, i) => (
                        <li
                            key={i}
                            style={{ marginBottom: "6px", fontWeight: 500 }}
                        >
                            {act}
                        </li>
                    ))}
                </ul>

                <a href="tel:115" className={cx("callBtn")}>
                    📞 GỌI CẤP CỨU 115 NGAY
                </a>

                <button onClick={onClose} className={cx("closeBtn")}>
                    Tôi đã hiểu, đóng cảnh báo
                </button>
            </div>
        </div>
    );
};
