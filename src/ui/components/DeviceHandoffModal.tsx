import { Copy, ExternalLink, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function DeviceHandoffModal({ dark, url, onClose }: { dark: boolean; url: string; onClose: () => void; }) {
  const [qr, setQr] = useState("");
  useEffect(() => { void QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } }).then(setQr); }, [url]);
  const local = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url);
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="handoff-title"><div className={`w-full max-w-md rounded-2xl border p-4 shadow-2xl ${dark ? "border-white/10 bg-[#151922] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}>
    <div className="flex items-start justify-between"><div className="flex items-center gap-2"><QrCode size={18} className="text-[#0f9f8f]" /><div><h2 id="handoff-title" className="text-sm font-extrabold">Open on a physical device</h2><p className={`text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Scan while the phone is on the same network.</p></div></div><button type="button" onClick={onClose} aria-label="Close device handoff" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/10"><X size={16} /></button></div>
    <div className="mt-4 grid place-items-center">{qr && <img src={qr} alt="QR code for current page" className="h-56 w-56 rounded-xl bg-white p-2" />}</div>
    <p className={`mt-3 break-all rounded-lg border p-2 text-[10px] ${dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-600"}`}>{url}</p>
    {local && <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-500">localhost only works on this computer. Replace it with your computer’s LAN IP and make sure the dev server listens on your network.</p>}
    <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => void navigator.clipboard.writeText(url)} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#0f9f8f]/30 px-3 text-[10px] font-bold text-[#0f9f8f]"><Copy size={13} />Copy URL</button><a href={url} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-lg bg-[#0f9f8f] px-3 text-[10px] font-bold text-white"><ExternalLink size={13} />Open</a></div>
  </div></div>;
}
