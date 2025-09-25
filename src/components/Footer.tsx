import Image from "next/image";

export default function Footer() {
  return (
<footer className=" text-black bg-gray-50 text-center py-10"
style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
  {/* Ülemine tekst */}
  <h3 className="text-lg font-semibold mb-6">
    JÄLGI MEID KA SOTSIAALMEEDIAS
  </h3>

  {/* Ikoonid */}
  <div className="flex justify-center items-center gap-6 mb-6">
    <a
      href="https://www.facebook.com/groups/416254748471887/"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-70 transition"
    >
      <Image
        src="/facebook.svg"
        alt="Facebook"
        width={38}
        height={38}
      
      />
    </a>

  </div>

  {/* Õiguste teema */}
  <p className="text-sm">
    &copy; {new Date().getFullYear()} Sörve Villaveski. Kõik õigused kaitstud.
  </p>
</footer>

  );
}