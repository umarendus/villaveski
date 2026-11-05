// Kohtade riba: must = kinnitatud, kuldne triibuline = broneeritud (ootab kinnitust), hele = vaba.
// Kasutusel avalikul lehel ja halduses, et mõlemad näitaksid sama pilti.

const STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(135deg, #be9f7a 0 5px, #d9c3a5 5px 10px)",
};

type Props = {
  capacity: number;
  confirmed: number; // sh väljaspool lehte broneeritud
  pending: number; // ootel registreeringute inimesed
  legend?: boolean;
  size?: "sm" | "md";
};

export default function SeatBar({ capacity, confirmed, pending, legend = true, size = "md" }: Props) {
  const free = Math.max(capacity - confirmed, 0);
  const pendingShown = Math.min(pending, free);
  const queue = Math.max(pending - free, 0); // rohkem ootel kui vabu kohti
  const h = size === "sm" ? "h-2" : "h-3";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="img" aria-label={`${confirmed} kinnitatud, ${pending} ootab kinnitust, ${free} vaba ${capacity}-st`}>
        {Array.from({ length: capacity }, (_, i) => {
          const kind = i < confirmed ? "confirmed" : i < confirmed + pendingShown ? "pending" : "free";
          return (
            <span
              key={i}
              className={`${h} flex-1 min-w-[14px] rounded-full ${
                kind === "confirmed" ? "bg-black" : kind === "free" ? "bg-[#be9f7a]/25" : ""
              }`}
              style={kind === "pending" ? STRIPES : undefined}
            />
          );
        })}
      </div>
      {legend && (
        <ul
          className={`flex flex-wrap gap-x-4 gap-y-1 mt-3 ${size === "sm" ? "text-xs" : "text-sm"} text-gray-600`}
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
        >
          <li className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-black" /> {confirmed} kinnitatud
          </li>
          {pending > 0 && (
            <li className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={STRIPES} /> {pending} ootab kinnitust
              {queue > 0 && <span className="text-[#7a5f40]">(+{queue} järjekorras)</span>}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#be9f7a]/25 border border-[#be9f7a]/40" /> {free} vaba
          </li>
        </ul>
      )}
    </div>
  );
}
