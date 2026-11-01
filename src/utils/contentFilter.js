// src/utils/contentFilter.js
// ระบบตรวจสอบคำไม่เหมาะสม คำสแลง สิ่งผิดกฎหมาย และคำทับศัพท์คาราโอเกะ (Automated Content Filter)

// 1. ตัวอักษรล่องหนและช่องว่างที่ตามองไม่เห็น (Zero-width characters)
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u00AD\u2060\u180E\u0000-\u001F]/g;

// 2. รายการคำสุภาพ/คำอาหาร/คำทั่วไปที่ต้องยกเว้น (Whitelist เพื่อป้องกัน False-Positive)
const WHITELIST = [
    "หอยทอด",
    "หอยลาย",
    "หอยแครง",
    "หอยนางรม",
    "หอยแมลงภู่",
    "หอยจ๊อ",
    "หอยจ้อ",
    "น้ำมันหอย",
    "กะเพราหอย",
    "เปลือกหอย",
    "ก๋วยเตี๋ยวเนื้อ",
    "เนื้อวัว",
    "เนื้อหมู",
    "เนื้อไก่",
    "เนื้อปลา",
    "เนื้อเค้ก",
    "เนื้อผ้า",
    "เนื้อครีม",
    "ลูกชิ้นเนื้อ",
    "ชาเขียว",
    "ชาเขียวมัทฉะ",
    "สีเขียว",
    "พริกเขียว",
    "ถั่วเขียว",
    "ผักเขียว",
    "มะนาวเขียว",
    "เขียวหวาน",
    "ขนมจีนน้ำยา",
    "น้ำยาล้างจาน",
    "น้ำยาปรับผ้านุ่ม",
    "น้ำยาซักผ้า",
    "น้ำยาล้างห้องน้ำ",
    "น้ำยาเช็ดกระจก",
    "น้ำยาถูพื้น",
    "น้ำยาบ้วนปาก",
    "น้ำยาล้างคอนแทค",
    "ลูกอม",
    "ยาอม",
    "อมยิ้ม",
    "ผักสด",
    "นมสด",
    "อาหารสด",
    "ผลไม้สด",
    "ปลาสด",
    "กุ้งสด",
    "ม้านั่ง",
    "ม้าโยก",
    "ม้าลาย",
    "ถุงผ้า",
    "ถุงเท้า",
    "ถุงกระดาษ",
    "ถุงขยะ",
    "ถุงซิปล็อค",
    "มีดทำครัว",
    "มีดปอกผลไม้",
    "มีดโกน",
    "มีดตัดเล็บ",
    "เค้ก",
    "เคสโทรศัพท์",
    "เคสไอโฟน",
    "เคาน์เตอร์",
    "คอยดู",
    "รอคอย",
    "คอยท่า",
];

// 3. พจนานุกรมคำต้องห้าม (Blacklist Dictionary) ครอบคลุม 7 หมวดหมู่
const BLACKLIST = [
    // หมวด 1: คำหยาบ 18+ / อวัยวะเพศ / พฤติกรรมทางเพศ (Sexual & Vulgar)
    "ควย", "หี", "แตด", "หำ", "หรรม", "จู๋", "จิ๋ม", "จิมิ", "หมอย", "เย็ด", "เงี่ยน", "แตกใน", "น้ำแตก",
    "ดูดควย", "อมควย", "เลียหี", "เลียแตด", "เสียบตูด", "รูทวาร", "ชักว่าว", "ข่มขืน", "โม้ก", "เยด",
    "pussy", "dick", "cock", "vagina", "hentai", "kuy", "kuay",

    // หมวด 2: การค้าประเวณี / นวดแอบแฝง / บริการทางเพศ (Prostitution & Adult Services)
    "กระหรี่", "กะหรี่", "ไซด์ไลน์", "sideline", "รับงาน", "ขายตัว", "รับงานn", "นวดกษัย", "นวดกระปู๋",
    "นวดเฉพาะจุด", "นวดพริตตี้", "นวดb2b", "คอลเสียว", "งานคอล", "ขายคลิป", "คลิปโป๊", "คลิปหลุด",
    "นัดยิ้ม", "นัดเย", "onlyfans",

    // หมวด 3: บุหรี่ไฟฟ้า / พอต / ยาสูบ (Vapes, Pods & Tobacco)
    "พอต", "พอด", "พอท", "พ็อต", "พ๊อต", "ปอดไฟฟ้า", "บุหรี่", "บุหรี", "บูหรี่", "บหรี่", "บหรี",
    "หัวพอต", "หัวพอด", "ตัวเครื่องพอต", "น้ำยาพอต", "น้ำยาบุหรี่", "หัวน้ำยา", "สูบพอต", "นิกโคติน",
    "นิโคติน", "relx", "infy", "marbo", "voopoo", "caliburn", "nevoks", "jues", "uwell", "smok",
    "vape", "pod",

    // หมวด 4: ยาเสพติด / สารมึนเมา (Narcotics & Controlled Substances)
    "ยาบ้า", "ยาไอซ์", "เคตามีน", "ยาเค", "พอตเค", "กัญชา", "ปุ๊น", "ปุ้น", "พันลำ", "บ้องกัญชา",
    "น้ำท่อม", "น้ำกระท่อม", "4x100", "4คูณ100", "สี่คูณร้อย", "ทรามาดอล", "โปรโคดิล", "ยาโปร",
    "แฮปปี้วอเตอร์", "ยาเสียสาว", "ยาดมสลบ", "เฮโรอีน", "โคเคน", "ฝิ่น", "มอร์ฟีน", "ยาอี", "ยาเลิฟ",
    "เห็ดเมา", "ดมกาว",

    // หมวด 5: การพนันออนไลน์ / ชักชวนทุจริต / บัญชีม้า (Gambling & Fraud)
    "สล็อต", "slot", "บาคาร่า", "baccarat", "คาสิโน", "แทงบอล", "หวยใต้ดิน", "หวยเถื่อน", "เว็บพนัน",
    "ปั่นบาคาร่า", "รับปั่นบาคาร่า", "เครดิตฟรี", "แจกเครดิต", "ยูสใหม่", "เว็บตรง", "บัญชีม้า",
    "รับเปิดบัญชี", "รับซื้อบัญชี", "วุฒิปลอม", "บัตรปลอม", "ใบขับขี่ปลอม", "เงินกู้นอกระบบ",

    // หมวด 6: อาวุธ / วัตถุอันตราย (Weapons & Dangerous Items)
    "ปืน", "ปืนเถื่อน", "ปืนปากกา", "แบลงค์กัน", "ลูกกระสุน", "กระสุนปืน", "ดินปืน", "ระเบิด", "ประทัดยักษ์", "สนับมือ", "มีดสปริง",

    // หมวด 7: สินค้าควบคุมพิเศษ / เซ็กส์ทอย (Sex Toys & Contraband)
    "ดิลโด้", "dildo", "ไข่สั่น", "จิ๋มกระป๋อง", "อวัยวะเพศเทียม", "ยาปลุกเซ็กส์", "ไวอากร้า", "ยาทำแท้ง", "ยาขับเลือด",

    // หมวด 8: คำด่าทอหยาบคายรุนแรง
    "เหี้ย", "ไอ้เหี้ย", "อีเหี้ย", "ดอกทอง", "อีสัตว์", "ไอ้สัตว์", "สถุล", "ระยำ", "จัญไร"
];

// 4. กฎตรวจจับคำทับศัพท์ / คาราโอเกะภาษาอังกฤษ (Transliteration & Phonetic Slang)
const TRANSLITERATION_RULES = [
    {
        name: "Hum (คำทับศัพท์ หำ/หรรม)",
        regex: /(^|[^a-zA-Z0-9ก-๙])h[\s\-_.*~]*u[\s\-_.*~]*m+($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "Hee (คำทับศัพท์ หี)",
        regex: /(^|[^a-zA-Z0-9ก-๙])h[\s\-_.*~]*e[\s\-_.*~]*e+($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "I here / Ai here / Hia (คำทับศัพท์ ไอ้เหี้ย/อีเหี้ย)",
        regex: /(^|[^a-zA-Z0-9ก-๙])((i|ai|e|ay)[\s\-_.*~]*(here|hea|hia)|(ihere|aihere|ehere|aihia|ehia)|(i|ai|e)[\s\-_.*~]*เหี้ย)($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "Kuy / Kuay (คำทับศัพท์ ควย)",
        regex: /(^|[^a-zA-Z0-9ก-๙])k[\s\-_.*~]*u[\s\-_.*~]*a?[\s\-_.*~]*y+($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "Yed / Yhed (คำทับศัพท์ เย็ด)",
        regex: /(^|[^a-zA-Z0-9ก-๙])y[\s\-_.*~]*h?[\s\-_.*~]*e[\s\-_.*~]*d+($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "Karee / Gari (คำทับศัพท์ กะหรี่)",
        regex: /(^|[^a-zA-Z0-9ก-๙])((k|g)[\s\-_.*~]*a[\s\-_.*~]*r[\s\-_.*~]*e{2,}|(gari|karee|garee))($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "Dok thong (คำทับศัพท์ ดอกทอง)",
        regex: /(^|[^a-zA-Z0-9ก-๙])do[kg][\s\-_.*~]*thong($|[^a-zA-Z0-9ก-๙])/i,
    },
    {
        name: "I kwai / Ai kwai (คำทับศัพท์ ควาย)",
        regex: /(^|[^a-zA-Z0-9ก-๙])(i|ai|e)[\s\-_.*~]*(kwai|kwaai|qwai)($|[^a-zA-Z0-9ก-๙])/i,
    },
];

// 5. Regular Expressions ดักจับกลเม็ดการเลี่ยงคำ (Evasions, Leetspeak, Delimiters)
const REGEX_EVASIONS = [
    // ควย evasions: ค-ว-ย, ค ว ย, ค.ว.ย, ค0ย, คoy, kuy, cuy, คvy
    /[คฅck][\s\-_.*~0oOvVwW]*[วoOvVwW0][\s\-_.*~]*[ยy]/i,
    // หี evasions: ห-ี, ห ี, ห.ี, hี, hee
    /[หh][\s\-_.*~]*[ีิ]/i,
    // พอต evasions: พ-อ-ต, พ อ ต, พ.อ.ต, พ0ต, pod, pot
    /[พp][\s\-_.*~0oO]*[อ0oO][\s\-_.*~]*[ตดทธtd]/i,
    // บุหรี่/บุหรี evasions: บ-ุ-ห-ร-ี่, บุหsี่, บหรี่, บหรี, บุหรี
    /[บb][\s\-_.*~]*[ุิี]*[\s\-_.*~]*[หh][\s\-_.*~]*[รsลl][\s\-_.*~]*[ี่ีิ]/i,
    // กระหรี่/กะหรี่/กระหsี่/กะหsี่
    /ก[\s\-_.*~]*[ระร]*[\s\-_.*~]*ห[\s\-_.*~]*[รsลl][\s\-_.*~]*[ี่ีิ]/i,
    // หssม / หรรม / หำ
    /[หh][\s\-_.*~]*([รs]{2}|ำ)[\s\-_.*~]*ม?/i,
    // v-a-p-e
    /v[\s\-_.*~4@]*a[\s\-_.*~]*p[\s\-_.*~3]*e/i,
    // p-o-d
    /p[\s\-_.*~0oO]*o[\s\-_.*~]*d/i,
    // s-l-o-t / 5-l-o-t / 5lot
    /[s5$][\s\-_.*~1l|]*l[\s\-_.*~0oO]*o[\s\-_.*~7t]*t/i,
];

/**
 * ปรับรูปประโยคเป็นรูปแบบต่างๆ เพื่อตรวจจับ (Normalized Variants)
 */
function getNormalizedVariants(raw) {
    if (!raw) return [];
    let clean = raw.toString().replace(ZERO_WIDTH_REGEX, "").toLowerCase();

    // รูปแบบที่ 1: ตัวหนังสือเดิมที่ลบตัวอักษรล่องหนออกแล้ว
    const variants = [clean];

    // รูปแบบที่ 2: แปลงตัวอักษรละตินที่คนไทยชอบใช้แทนพยัญชนะไทย (Leetspeak Mapping)
    let thaiMapped = clean
        .replace(/s/g, "ร")
        .replace(/0/g, "อ")
        .replace(/1/g, "เ")
        .replace(/h/g, "ห")
        .replace(/k/g, "ค")
        .replace(/y/g, "ย")
        .replace(/w/g, "ว")
        .replace(/p/g, "พ")
        .replace(/d/g, "ด")
        .replace(/t/g, "ต")
        .replace(/b/g, "บ");
    variants.push(thaiMapped);

    return variants;
}

/**
 * ลบสัญลักษณ์คั่น (Delimiters) ออกทั้งหมด
 */
function stripDelimiters(text) {
    return text.replace(/[\s\-_.*~,;:!?'"\\/|#@$%^&+=`()[\]{}<>]+/g, "");
}

/**
 * ยุบตัวอักษรที่พิมพ์ซ้ำหลายตัวให้เหลือตัวเดียว
 */
function collapseChars(text) {
    return text.replace(/(.)\1+/gu, "$1");
}

/**
 * ตรวจสอบข้อความว่ามีคำไม่เหมาะสมหรือไม่
 * @param {string} text - ข้อความที่ต้องการตรวจสอบ
 * @returns {{ isValid: boolean, matchedWord?: string }}
 */
export function checkInappropriateContent(text) {
    if (!text || typeof text !== "string") return { isValid: true };

    const variants = getNormalizedVariants(text);

    // ป้องกัน Whitelist ก่อน โดยแทนที่คำสุภาพด้วยช่องว่าง
    const maskedVariants = variants.map((v) => {
        let m = v;
        for (const safe of WHITELIST) {
            const safeLower = safe.toLowerCase();
            m = m.replaceAll(safeLower, " ");
        }
        return m;
    });

    // 1. ตรวจสอบด้วยกฎคำทับศัพท์ / คาราโอเกะภาษาอังกฤษ (Transliteration Rules)
    for (const rule of TRANSLITERATION_RULES) {
        for (const v of maskedVariants) {
            if (rule.regex.test(v)) {
                return {
                    isValid: false,
                    matchedWord: rule.name,
                };
            }
        }
    }

    // 2. ตรวจสอบด้วย RegEx Evasions
    for (const regex of REGEX_EVASIONS) {
        for (const v of maskedVariants) {
            if (regex.test(v)) {
                return {
                    isValid: false,
                    matchedWord: "คำหรือสแลงที่ไม่เหมาะสม",
                };
            }
        }
    }

    // 3. ตรวจสอบกับ Blacklist ทั่วไป
    for (const v of maskedVariants) {
        const stripped = stripDelimiters(v);
        const collapsed = collapseChars(stripped);

        for (const bad of BLACKLIST) {
            const badLower = bad.toLowerCase();
            const badStripped = stripDelimiters(badLower);

            if (
                v.includes(badLower) ||
                stripped.includes(badStripped) ||
                collapsed.includes(badStripped)
            ) {
                return {
                    isValid: false,
                    matchedWord: bad,
                };
            }
        }
    }

    return { isValid: true };
}

/**
 * ตรวจสอบหลายฟิลด์พร้อมกันและสรุปผล
 * @param {Array<{ label: string, value: string }>} fields
 * @returns {{ isValid: boolean, error: string | null, details: Array<{ label: string, matchedWord: string }> }}
 */
export function validateFields(fields) {
    if (!Array.isArray(fields)) return { isValid: true, error: null, details: [] };

    const violations = [];

    for (const field of fields) {
        if (!field || !field.value) continue;
        const res = checkInappropriateContent(field.value);
        if (!res.isValid) {
            violations.push({
                label: field.label || "ข้อความ",
                matchedWord: res.matchedWord,
            });
        }
    }

    if (violations.length > 0) {
        const summaryMsg = violations
            .map((v) => `• ใน "${v.label}": ตรวจพบคำต้องห้ามหรือไม่เหมาะสม (${v.matchedWord})`)
            .join("\n");

        return {
            isValid: false,
            error: `ไม่อนุมัติ: ระบบตรวจพบคำไม่เหมาะสม คำสแลง หรือคำทับศัพท์ต้องห้าม กรุณาแก้ไขก่อนดำเนินการ:\n${summaryMsg}`,
            details: violations,
        };
    }

    return {
        isValid: true,
        error: null,
        details: [],
    };
}
