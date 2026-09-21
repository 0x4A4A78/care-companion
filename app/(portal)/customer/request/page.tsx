"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CircleEllipsis,
  Check,
  Landmark,
  Save,
  ShoppingBag,
  Stethoscope,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "../../../../components/ui";
import { serviceRequestSchema } from "../../../../lib/request-schema";

const categories = [
  { id: "hospital", label: "ไปพบแพทย์ / โรงพยาบาล", Icon: Stethoscope },
  { id: "bank", label: "ไปธนาคาร", Icon: Landmark },
  { id: "government", label: "ติดต่อราชการ", Icon: Building2 },
  { id: "shopping", label: "ซื้อสินค้า", Icon: ShoppingBag },
  { id: "other", label: "ธุระอื่น ๆ", Icon: CircleEllipsis },
] as const;
const requestSteps = [
  "ประเภทธุระ",
  "วันและเวลา",
  "สถานที่",
  "สิ่งที่ต้องการ",
  "ตรวจสอบ",
] as const;
const supportOptions = [
  "เดินเป็นเพื่อน",
  "ช่วยถือของชิ้นเล็ก",
  "ช่วยดูขั้นตอนและเอกสาร",
  "ช่วยใช้รถเข็น",
  "รอเป็นเพื่อนจนเสร็จธุระ",
];

function RequestInner() {
  const searchParams = useSearchParams();
  const isVoice = searchParams.get("voice") === "1";

  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<{ reference_no: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceLoaded, setVoiceLoaded] = useState(false);
  const [data, setData] = useState({
    category: "hospital" as string,
    serviceDate: "",
    startTime: "09:00",
    durationHours: 3,
    pickup: "",
    destination: "",
    supportNeeds: ["เดินเป็นเพื่อน"],
    notes: "",
  });

  // Auto-fill from voice intent
  useEffect(() => {
    if (!isVoice) return;
    const timer = setTimeout(() => {
      try {
        const stored = sessionStorage.getItem("voiceIntent");
        if (!stored) return;
        const intent = JSON.parse(stored);
        setData((prev) => ({
          ...prev,
          category: intent.category || prev.category,
          destination: intent.destination || prev.destination,
          serviceDate: intent.serviceDate || prev.serviceDate,
          startTime: intent.startTime || prev.startTime,
          supportNeeds: intent.supportNeeds?.length
            ? intent.supportNeeds
            : prev.supportNeeds,
        }));
        setVoiceLoaded(true);
        toast.success("นำข้อมูลจากผู้ช่วยเสียงมาใส่แล้ว", {
          description: "กรุณาตรวจสอบวัน เวลา และสถานที่ก่อนยืนยัน",
        });
        sessionStorage.removeItem("voiceIntent");
      } catch {
        /* ignore parse errors */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isVoice]);

  function toggleSupport(item: string) {
    setData((d) => ({
      ...d,
      supportNeeds: d.supportNeeds.includes(item)
        ? d.supportNeeds.filter((x) => x !== item)
        : [...d.supportNeeds, item],
    }));
  }
  async function next() {
    setError("");

    // Step 1 validation
    if (step === 1) {
      if (!data.category) {
        setError("กรุณาเลือกประเภทธุระ");
        toast.warning("กรุณาเลือกประเภทธุระ");
        return;
      }
    }

    // Step 2 validation
    if (step === 2) {
      if (!data.serviceDate) {
        setError("กรุณาเลือกวันที่ใช้บริการ");
        toast.warning("กรุณาเลือกวันที่ใช้บริการ");
        return;
      }
      if (!data.startTime) {
        setError("กรุณาระบุเวลาเริ่มต้น");
        toast.warning("กรุณาระบุเวลาเริ่มต้น");
        return;
      }
    }

    // Step 3 validation
    if (step === 3) {
      const pickupClean = data.pickup.trim();
      const destClean = data.destination.trim();
      if (!pickupClean) {
        setError("กรุณาระบุสถานที่ต้นทาง");
        toast.warning("กรุณาระบุสถานที่ต้นทาง");
        return;
      }
      if (pickupClean.length < 3) {
        setError("สถานที่ต้นทางต้องมีความยาวอย่างน้อย 3 ตัวอักษร");
        toast.warning("สถานที่ต้นทางต้องมีความยาวอย่างน้อย 3 ตัวอักษร");
        return;
      }
      if (!destClean) {
        setError("กรุณาระบุจุดหมายปลายทาง");
        toast.warning("กรุณาระบุจุดหมายปลายทาง");
        return;
      }
      if (destClean.length < 3) {
        setError("จุดหมายปลายทางต้องมีความยาวอย่างน้อย 3 ตัวอักษร");
        toast.warning("จุดหมายปลายทางต้องมีความยาวอย่างน้อย 3 ตัวอักษร");
        return;
      }
      if (pickupClean.toLowerCase() === destClean.toLowerCase()) {
        setError("สถานที่ต้นทางและปลายทางต้องไม่เหมือนกัน");
        toast.warning("สถานที่ต้นทางและปลายทางต้องไม่เหมือนกัน");
        return;
      }
    }

    if (step === 5) {
      const result = serviceRequestSchema.safeParse(data);
      if (!result.success) {
        const firstIssue = result.error.issues?.[0];
        const errorMsg =
          firstIssue?.message ?? "กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนยืนยัน";
        setError(errorMsg);
        toast.error("ข้อมูลคำขอยังไม่ถูกต้อง", {
          description: errorMsg,
        });
        return;
      }
      setBusy(true);
      try {
        const response = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.data),
        });
        if (response.ok) {
          const body = await response.json();
          setCreatedRequest(body.data);
          setSuccess(true);
          toast.success("ส่งคำขอเรียบร้อยแล้ว", {
            description: "ระบบกำลังค้นหาผู้ช่วยที่เหมาะกับคุณ",
          });
          return;
        }
        const body = await response.json();
        setError(body.error ?? "ไม่สามารถส่งคำขอได้");
        toast.error(body.error ?? "ไม่สามารถส่งคำขอได้");
      } catch {
        setError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง");
        toast.error("เชื่อมต่อระบบไม่ได้", {
          description: "กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง",
        });
      } finally {
        setBusy(false);
      }
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  }
  if (success)
    return (
      <div className="page-wrap">
        <Card className="success-view">
          <div className="success-icon">
            <Check size={42} />
          </div>
          <h1>ส่งคำขอเรียบร้อยแล้ว</h1>
          <p>
            หมายเลขคำขอ <strong>{createdRequest?.reference_no}</strong>
            <br />
            เรากำลังค้นหาผู้ช่วยที่เหมาะกับคุณ
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link className="button button-primary" href="/companions">
              เลือกผู้ช่วยด้วยตัวเอง
            </Link>
            <Link className="button button-ghost" href={`/customer/jobs/${createdRequest?.reference_no}`}>
              ติดตามสถานะ
            </Link>
          </div>
        </Card>
      </div>
    );
  return (
    <div className="page-wrap request-page">
      <div className="page-header">
        <div>
          <h1>ขอผู้ช่วยร่วมเดินทาง</h1>
          <p>กรอกทีละขั้น ใช้เวลาประมาณ 3 นาที</p>
        </div>
        <button className="button button-ghost">
          <Save size={18} /> บันทึกร่าง
        </button>
      </div>
      {voiceLoaded && (
        <div className="voice-banner">
          <Volume2 size={22} /> กรอกข้อมูลจาก AI ผู้ช่วยเสียงแล้ว —
          ตรวจสอบแล้วกดยืนยัน
        </div>
      )}
      <Card className="form-card">
        <p className="mobile-step-label">
          ขั้นตอน {step} จาก {requestSteps.length} · {requestSteps[step - 1]}
        </p>
        <div className="form-progress">
          {requestSteps.map((label, i) => (
            <span
              key={label}
              data-step={i + 1}
              aria-current={i + 1 === step ? "step" : undefined}
              className={
                i + 1 === step ? "current" : i + 1 < step ? "done" : ""
              }
            >
              {label}
            </span>
          ))}
        </div>
        {step === 1 && (
          <div className="form-section">
            <h2>ต้องการไปทำธุระอะไร?</h2>
            <p>เลือกประเภทที่ใกล้เคียงที่สุด</p>
            <div className="choice-grid">
              {categories.map(({ id, label, Icon }) => {
                const selected = data.category === id;
                return (
                  <button
                    className={`choice ${selected ? "selected" : ""}`}
                    onClick={() => setData({ ...data, category: id })}
                    aria-pressed={selected}
                    key={id}
                  >
                    <Icon size={26} />
                    <strong>{label}</strong>
                    {selected && (
                      <Check
                        className="choice-check"
                        size={17}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="form-section">
            <h2>ต้องการใช้บริการวันและเวลาใด?</h2>
            <p>ระบุเวลาที่ต้องการให้ผู้ช่วยมาถึงต้นทาง</p>
            <div className="form-grid">
              <label className="field">
                <span>วันที่ใช้บริการ</span>
                <input
                  type="date"
                  value={data.serviceDate}
                  onChange={(e) =>
                    setData({ ...data, serviceDate: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>เวลาเริ่มต้น</span>
                <input
                  type="time"
                  value={data.startTime}
                  onChange={(e) =>
                    setData({ ...data, startTime: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>ระยะเวลาโดยประมาณ</span>
                <select
                  value={data.durationHours}
                  onChange={(e) =>
                    setData({ ...data, durationHours: Number(e.target.value) })
                  }
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option value={n} key={n}>
                      {n} ชั่วโมง
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="form-section">
            <h2>เดินทางจากที่ไหน ไปที่ไหน?</h2>
            <p>ใส่รายละเอียดให้ชัดเจนเพื่อให้ผู้ช่วยวางแผนการเดินทาง</p>
            <div className="form-grid">
              <label className="field field-full">
                <span>สถานที่ต้นทาง</span>
                <input
                  value={data.pickup}
                  onChange={(e) => setData({ ...data, pickup: e.target.value })}
                />
                <small>เช่น บ้านเลขที่ ซอย ถนน และจุดสังเกต</small>
              </label>
              <label className="field field-full">
                <span>จุดหมาย</span>
                <input
                  value={data.destination}
                  onChange={(e) =>
                    setData({ ...data, destination: e.target.value })
                  }
                />
              </label>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="form-section">
            <h2>ต้องการให้ช่วยเรื่องใดบ้าง?</h2>
            <p>เลือกได้หลายข้อ บริการนี้ไม่ครอบคลุมการดูแลรักษาทางการแพทย์</p>
            <div className="choice-grid">
              {supportOptions.map((item) => (
                <button
                  key={item}
                  className={`choice ${data.supportNeeds.includes(item) ? "selected" : ""}`}
                  onClick={() => toggleSupport(item)}
                >
                  <strong>{item}</strong>
                </button>
              ))}
            </div>
            <label className="field" style={{ marginTop: 18 }}>
              <span>รายละเอียดสำคัญเพิ่มเติม</span>
              <textarea
                maxLength={1000}
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
              />
              <small>
                {data.notes.length}/1000 ตัวอักษร ·
                อย่าใส่ข้อมูลสุขภาพที่ไม่จำเป็น
              </small>
            </label>
          </div>
        )}
        {step === 5 && (
          <div className="form-section">
            <h2>ตรวจสอบข้อมูลก่อนส่งคำขอ</h2>
            <p>หากต้องการแก้ไข กดย้อนกลับไปยังขั้นตอนก่อนหน้า</p>
            <div className="summary-list">
              <div className="summary-row">
                <span>ประเภทธุระ</span>
                <strong>
                  {categories.find((c) => c.id === data.category)?.label}
                </strong>
              </div>
              <div className="summary-row">
                <span>วันและเวลา</span>
                <strong>
                  {data.serviceDate} เวลา {data.startTime} น. ·{" "}
                  {data.durationHours} ชั่วโมง
                </strong>
              </div>
              <div className="summary-row">
                <span>เส้นทาง</span>
                <strong>
                  {data.pickup}
                  <br />
                  <ArrowRight
                    size={14}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />{" "}
                  {data.destination}
                </strong>
              </div>
              <div className="summary-row">
                <span>สิ่งที่ต้องการให้ช่วย</span>
                <strong>{data.supportNeeds.join(", ")}</strong>
              </div>
              <div className="summary-row">
                <span>ค่าบริการโดยประมาณ</span>
                <strong>
                  {data.durationHours * 300}–{data.durationHours * 350} บาท
                </strong>
              </div>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" style={{ color: "var(--red)", fontWeight: 700 }}>
            {error}
          </p>
        )}
        <div className="form-actions">
          {step > 1 ? (
            <button
              className="button button-ghost"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={19} /> ย้อนกลับ
            </button>
          ) : (
            <Link className="button button-ghost" href="/customer">
              ยกเลิก
            </Link>
          )}
          <button
            className="button button-primary"
            onClick={next}
            disabled={busy}
          >
            {busy
              ? "กำลังส่งคำขอ..."
              : step === 5
                ? "ยืนยันและค้นหาผู้ช่วย"
                : "ต่อไป"}
            <ArrowRight size={19} />
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestInner />
    </Suspense>
  );
}
