"use client";
import classNames from "classnames/bind";
import styles from "./EmergencyModal.module.scss";
import type { EmergencyCategory } from "@/types/safety";

const cx = classNames.bind(styles);

interface Props {
    isOpen: boolean;
    onClose: () => void;
    actions: string[];
    category?: EmergencyCategory;
    title?: string;
}

export const EmergencyModal = ({
    isOpen,
    onClose,
    actions = [],
    category = "GENERAL",
    title,
}: Props) => {
    if (!isOpen) return null;

    return (
        <div className={cx("overlay")}>
            <div className={cx("modal")}>
                <div className={cx("header")}>
                    <span className={cx("alertIcon")}>🚨</span>
                    <div>
                        <h2 className={cx("title")}>
                            {title || "CẢNH BÁO Y TẾ CẤP CỨU KHẨN CẤP"}
                        </h2>
                        <span className={cx("subtitle")}>
                            Phát hiện dấu hiệu đe dọa tính mạng. Cần can thiệp y
                            tế ngay!
                        </span>
                    </div>
                </div>

                {/* SƠ ĐỒ ĐẶC THÙ: DẤU HIỆU ĐỘT QUỴ F.A.S.T */}
                {category === "STROKE_FAST" && (
                    <div className={cx("fastBox")}>
                        <div className={cx("fastTitle")}>
                            QUY TẮC NHẬN DIỆN ĐỘT QUỴ (F.A.S.T)
                        </div>
                        <div className={cx("fastGrid")}>
                            <div className={cx("fastItem")}>
                                <strong>F - Face</strong>
                                <span>Mặt méo, nụ cười lệch một bên</span>
                            </div>
                            <div className={cx("fastItem")}>
                                <strong>A - Arm</strong>
                                <span>Yếu tay, không nâng đều hai tay</span>
                            </div>
                            <div className={cx("fastItem")}>
                                <strong>S - Speech</strong>
                                <span>Nói ngọng, líu lưỡi, khó nói</span>
                            </div>
                            <div className={cx("fastItem")}>
                                <strong>T - Time</strong>
                                <span>Gọi ngay 115, tính từng phút!</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* HÀNH ĐỘNG KHUYẾN NGHỊ BAN ĐẦU */}
                <div className={cx("instructionsBox")}>
                    <h4>HÀNH ĐỘNG CẦN LÀM NGAY:</h4>
                    <ul>
                        {actions.length > 0 ? (
                            actions.map((act, i) => <li key={i}>{act}</li>)
                        ) : (
                            <>
                                <li>
                                    Gọi ngay cấp cứu 115 hoặc nhờ người thân trợ
                                    giúp.
                                </li>
                                <li>Không tự lái xe, không vận động mạnh.</li>
                                <li>
                                    Giữ thông thoáng đường thở và nới lỏng trang
                                    phục.
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                {/* KHỐI NÚT HÀNH ĐỘNG CỨU NẠN TỨC THÌ */}
                <div className={cx("actionGroup")}>
                    <a href="tel:115" className={cx("callBtn")}>
                        📞 GỌI CẤP CỨU 115 NGAY
                    </a>
                    <a
                        href="https://www.google.com/maps/search/b%E1%BB%87nh+vi%E1%BB%87n+g%E1%BA%A7n+nh%E1%BA%A5t"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx("mapBtn")}
                    >
                        🏥 Tìm Bệnh Viện Gần Nhất
                    </a>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className={cx("closeBtn")}
                >
                    Tôi đã liên hệ hỗ trợ / Đóng cảnh báo
                </button>
            </div>
        </div>
    );
};
