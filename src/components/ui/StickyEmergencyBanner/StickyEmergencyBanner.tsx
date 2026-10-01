"use client";

import React from "react";
import classNames from "classnames/bind";
import styles from "./StickyEmergencyBanner.module.scss";

const cx = classNames.bind(styles);

interface Props {
    visible: boolean;
    onViewGuide: () => void;
    message?: string;
}

export const StickyEmergencyBanner = ({
    visible,
    onViewGuide,
    message = "Phát hiện dấu hiệu cấp cứu nguy kịch. Cần liên hệ hỗ trợ y tế khẩn cấp!",
}: Props) => {
    if (!visible) return null;

    return (
        <aside className={cx("banner")} role="alert" aria-live="assertive">
            <div className={cx("content")}>
                <span className={cx("pulseIcon")}>🚨</span>
                <span className={cx("message")}>{message}</span>
            </div>

            <div className={cx("actions")}>
                <a href="tel:115" className={cx("callLink")}>
                    📞 Gọi 115
                </a>
                <button
                    type="button"
                    onClick={onViewGuide}
                    className={cx("guideBtn")}
                >
                    Xem sơ cứu ➔
                </button>
            </div>
        </aside>
    );
};

export default StickyEmergencyBanner;
