// src/components/ui/Icon.jsx
// ใช้แสดงไอคอนจากไฟล์รูปที่คุณทำเอง วางไว้ที่ public/icons/{name}.png
// เรียกใช้: <Icon name="box" /> หรือ <Icon name="box" size={24} />

export default function Icon({ name, size = 20, style, ...props }) {
    return (
        <img
            src={`/icons/${name}.png`}
            alt=""
            width={size}
            height={size}
            style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
            {...props}
        />
    );
}