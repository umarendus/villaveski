"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // 🔥
import { motion, AnimatePresence } from "framer-motion";

const sections = ["kodu", "meist", "teenused", "kontakt"];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [active, setActive] = useState("kodu");

  const router = useRouter();
  const pathname = usePathname(); // 🔥 kontrollib kus oled
  const isHome = pathname === "/";

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;

    const headerOffset = 70;
    const elementPosition = section.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  };

  const handleClick = (id: string, isMobile = false) => {
    if (isMobile) setMobileMenuOpen(false);

    if (pathname !== "/") {
      router.push(`/#${id}`);
    } else {
      setTimeout(() => scrollToSection(id), isMobile ? 300 : 0);
    }
  };

 useEffect(() => {
  if (!isHome) return;

  // Track latest visibility ratio for each observed section
  const visibility = new Map<string, number>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (target instanceof HTMLElement) {
          const id = target.id;
          // Use 0 when not intersecting to deprioritize hidden sections
          visibility.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
      }

      // Pick the single most visible section across all currently tracked
      let bestId: string | null = null;
      let bestRatio = -1;
      for (const [id, ratio] of visibility) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }
      if (bestId) setActive(bestId);
    },
    {
      threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0...1 sammuga
      rootMargin: "-40% 0px -40% 0px", // annab keskele eelise
    }
  );

  sections.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      visibility.set(id, 0); // init with 0
      observer.observe(section);
    }
  });

  return () => {
    observer.disconnect();
    visibility.clear();
  };
}, [isHome]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white backdrop-blur-md px-6 py-0 border-b border-white/20 shadow-sm"
    style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left Logo - Desktop */}
        <Link
          href="/"
          className="hidden lg:flex relative items-center h-full cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image
            src="/sheep-black-l.svg"
            alt="Logo"
            width={0}
            height={0}
            sizes="100vh"
            className="h-full w-auto object-contain"
          />
        </Link>

        {/* Mobile Sheep Logos */}
<div className="lg:hidden flex items-center gap-1">
  <Link
    href="/"
    className="relative flex items-center h-full cursor-pointer hover:opacity-80 transition-opacity"
  >
    <Image
      src="/sheep-black-l.svg"
      alt="Logo"
      width={40}
      height={40}
      className="h-8 w-auto md:h-12" // 📏 väiksem mobiilil, suurem md ekraanil
    />
  </Link>
  <Link
    href="/"
    className="relative flex items-center h-full cursor-pointer hover:opacity-80 transition-opacity"
  >
    <Image
      src="/sheep-black-r.svg"
      alt="Logo"
      width={40}
      height={40}
      className="h-8 w-auto md:h-12" // 📏 sama reegel
    />
  </Link>
</div>


        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-10">
          {sections.map((id) => (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className={`relative font-medium text-m tracking-wide cursor-pointer transition-colors duration-300 ${
                isHome && active === id
                  ? "text-gray-900 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {id.toUpperCase()}
           
            </button>
          ))}
        </nav>

        {/* Right Logo - Desktop */}
        <Link
          href="/"
          className="hidden lg:flex relative items-center h-full cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image
            src="/sheep-black-r.svg"
            alt="Logo"
            width={0}
            height={0}
            sizes="100vh"
            className="h-full w-auto object-contain"
          />
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden text-black p-2 rounded-md cursor-pointer transition-transform duration-200 ease-in-out"
          aria-label="Toggle mobile menu"
        >
          <svg
            className={`w-8 h-8 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 z-50 bg-white/98 shadow-md"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center space-y-6 py-10 text-center"
            >
              {sections.map((id) => (
                <motion.div key={id} variants={itemVariants}>
                  <button
                    onClick={() => handleClick(id, true)}
                    className="block text-black text-2xl font-semibold tracking-wide cursor-pointer hover:text-gray-700 transition-colors"
                  >
                    {id.toUpperCase()}
                  </button>
                </motion.div>
              ))}

              {/* Socials */}
              <div className="flex justify-center gap-6 mt-4">
                <motion.a
                  href="https://www.facebook.com/groups/416254748471887/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                >
                  <Image src="/facebook.svg" alt="Facebook" width={38} height={38} />
                </motion.a>
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
