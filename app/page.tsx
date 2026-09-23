import { ArrowRight, BadgeCheck, Building2, HeartHandshake, Landmark, MapPin, Mic, ShieldCheck, ShoppingBag, Star, Stethoscope, UsersRound } from "lucide-react";
import Link from "next/link";
import { Brand } from "../components/brand";
import { Avatar, Badge, Card } from "../components/ui";

const services = [
  [Stethoscope, "ไปพบแพทย์", "มีเพื่อนไปตามนัดและช่วยติดต่อจุดบริการ"],
  [Landmark, "ไปธนาคาร", "ช่วยเดินทาง รอคิว และเตรียมเอกสารทั่วไป"],
  [Building2, "ติดต่อราชการ", "ไปเป็นเพื่อนและช่วยดูขั้นตอนการติดต่อ"],
  [ShoppingBag, "ซื้อสินค้า", "ช่วยเลือกซื้อ ถือของชิ้นเล็ก และเดินทางกลับบ้าน"],
] as const;

export default function Home() {
  return (
    <div className="landing">
      <header className="public-nav"><Brand /><nav><a href="#voice">AI ผู้ช่วย</a><a href="#how">วิธีใช้งาน</a><a href="#service">บริการของเรา</a><a href="#safety">ความปลอดภัย</a></nav><div className="nav-actions"><Link className="button button-ghost" href="/admin" style={{ borderColor: "#cce0ff", background: "#f0f6ff", color: "var(--blue)", display: "inline-flex", alignItems: "center", gap: 6 }}><ShieldCheck size={16} /> แอดมิน (Admin)</Link><Link className="button button-ghost" href="/login">เข้าสู่ระบบ</Link><Link className="button button-primary" href="/login">เริ่มใช้งาน</Link></div></header>
      <main>
        <section className="hero">
          <div className="hero-copy"><Badge tone="green"><BadgeCheck size={17} /> แพลตฟอร์มช่วยเดินทางที่ไว้ใจได้</Badge><h1>ทุกการเดินทาง<br /><span>มีเพื่อนเคียงข้าง</span></h1><p>ค้นหาผู้ช่วยร่วมเดินทางสำหรับไปพบแพทย์ ไปธนาคาร ติดต่อราชการ หรือทำธุระนอกบ้าน ให้คุณและครอบครัวสบายใจมากขึ้น</p><div className="hero-actions"><Link className="button button-primary button-large" href="/login">ขอผู้ช่วยเดินทาง <ArrowRight size={22} /></Link><a className="button button-ghost button-large" href="#voice">ลองพูดบอกเรา <Mic size={20} /></a></div><div className="trust-row"><span><ShieldCheck />ตรวจสอบตัวตน</span><span><UsersRound />เลือกผู้ช่วยได้</span><span><HeartHandshake />ดูแลตลอดงาน</span></div></div>
          <div className="hero-visual" aria-label="ตัวอย่างผู้ช่วยร่วมเดินทาง"><div className="blob blob-one"/><div className="blob blob-two"/><Card className="match-card"><div className="match-head"><Avatar name="นว" tone="green" large /><div><Badge tone="green"><BadgeCheck size={15}/> ยืนยันตัวตนแล้ว</Badge><h3>คุณนวพล ใจดี</h3><p>ผู้ช่วยร่วมเดินทาง · กรุงเทพฯ</p></div></div><div className="rating"><strong><Star size={18} fill="#f3a712" color="#f3a712"/> 4.9</strong><span>56 รีวิว</span><span>ประสบการณ์ 4 ปี</span></div><div className="route"><span className="route-dot"/><div><small>นัดหมายถัดไป</small><strong>พาคุณสมพรไปโรงพยาบาล</strong><p><MapPin size={16}/> 24 ก.ย. · 09:00 น.</p></div></div></Card><div className="floating-card safe"><ShieldCheck/><span><strong>ปลอดภัย อุ่นใจ</strong><small>ติดต่อครอบครัวได้ทุกเวลา</small></span></div></div>
        </section>

        {/* ─── Voice AI Section ─── */}
        <section id="voice" className="section voice-section">
          <div className="section-heading">
            <span>AI ผู้ช่วยอัจฉริยะ</span>
            <h2>พูดบอกเราได้เลย</h2>
            <p>ไม่ต้องพิมพ์ ไม่ต้องกรอกแบบฟอร์ม แค่กดปุ่มแล้วพูดภาษาไทย AI จะจัดการให้ทั้งหมด</p>
          </div>
          <div className="voice-demo">
            <div className="voice-demo-visual">
              <div className="voice-mic-demo"><Mic size={44} /></div>
              <div className="voice-waves"><span /><span /><span /><span /><span /></div>
              <p style={{color:"var(--muted)",fontWeight:650}}>กดปุ่มไมค์แล้วพูดบอกเรา</p>
            </div>
            <div className="voice-examples">
              <div className="voice-example">&ldquo;อยากไปโรงพยาบาลศิริราชพรุ่งนี้ตอนเก้าโมง&rdquo;<small>AI จะเข้าใจ: ไปพบแพทย์ · โรงพยาบาลศิริราช · พรุ่งนี้ 09:00</small></div>
              <div className="voice-example">&ldquo;ไปธนาคารกสิกรวันจันทร์บ่ายสองโมง ช่วยถือของด้วย&rdquo;<small>AI จะเข้าใจ: ไปธนาคาร · ธนาคารกสิกรไทย · บ่ายสองโมง · ช่วยถือของ</small></div>
              <div className="voice-example">&ldquo;อยากไปซื้อของที่ตลาด ใช้รถเข็น&rdquo;<small>AI จะเข้าใจ: ซื้อสินค้า · ตลาด · ช่วยใช้รถเข็น</small></div>
            </div>
          </div>
        </section>

        <section id="service" className="section"><div className="section-heading"><span>บริการที่ตอบโจทย์</span><h2>ไปทำธุระได้อย่างมั่นใจ</h2><p>เลือกความช่วยเหลือที่เหมาะกับการเดินทางของคุณ</p></div><div className="service-grid">{services.map(([Icon,title,desc])=><Card key={title} className="service-card"><span className="service-icon"><Icon size={28}/></span><h3>{title}</h3><p>{desc}</p></Card>)}</div></section>
        <section id="how" className="section how"><div className="section-heading"><span>ง่ายเพียง 3 ขั้นตอน</span><h2>เริ่มต้นใช้งานได้ทันที</h2></div><div className="steps">{[["1","บอกความต้องการ","พูดหรือพิมพ์ — ระบุธุระ วัน เวลา สถานที่"],["2","เลือกผู้ช่วย","ดูโปรไฟล์ ประสบการณ์ ราคา และรีวิว"],["3","เดินทางอย่างสบายใจ","ติดตามสถานะ ติดต่อผู้ช่วย และยืนยันเมื่อจบงาน"]].map(([n,t,d])=><div className="step" key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></div>)}</div></section>
        <section id="safety" className="safety-section"><div><ShieldCheck size={44}/><span><strong>ขอบเขตบริการที่ชัดเจน</strong><p>Companion ให้ความช่วยเหลือด้านการเดินทางและการทำธุระทั่วไปเท่านั้น ไม่ใช่บุคลากรทางการแพทย์หรือผู้ดูแลรักษาผู้ป่วย</p></span></div><Link href="/login" className="button button-white">ทดลองใช้งาน</Link></section>
      </main>
      <footer><Brand/><p>หากมีเหตุฉุกเฉินหรือมีอาการเจ็บป่วย กรุณาติดต่อ 1669 หรือสถานพยาบาลโดยตรง</p><div style={{margin:"10px 0"}}><Link href="/admin" className="text-link" style={{fontSize:".88rem",display:"inline-flex",alignItems:"center",gap:5}}><ShieldCheck size={15}/> เข้าสู่ระบบผู้ดูแล (Admin Console สำหรับทดสอบ)</Link></div><small>© 2026 Care Companion · โครงงาน Web Application</small></footer>
    </div>
  );
}
