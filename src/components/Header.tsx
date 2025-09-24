"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const sections = ["meist", "teenused", "protsess", "hinnapoliitika", "kontakt"];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [active, setActive] = useState("");

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Custom scroll handler (smooth + offset)
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;

    const headerOffset = 68; // header height
    const elementPosition = section.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  };

  // IntersectionObserver for active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(id);
          });
        },
        { threshold: 0.6 }
      );

      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      // lg breakpoint is 1024px in Tailwind
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Framer Motion variants
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

  // Wait for exit animation before scrolling
  const handleMobileClick = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => scrollToSection(id), 300); // sama kestus kui motion.div exit
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/70 backdrop-blur-md px-6 py-0 border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
                <Link
  href="/"
  className="relative flex items-center h-full hover:opacity-80 transition-opacity"
>
  <Image
    src="/logo.svg"
    alt="Logo"
    width={0}
    height={0}
    sizes="100vh"
    className="h-full w-auto object-contain"
  />
</Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-10">
          {sections.map((id) =>
            id !== "kontakt" ? (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`relative font-medium text-sm tracking-wide transition-colors duration-300 ${
                  active === id
                    ? "text-gray-900 font-semibold"
                    : active === ""
                    ? "text-gray-800 hover:text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {id.toUpperCase()}
                {active === id && (
                  <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-gray-900 transition-all duration-300" />
                )}
              </button>
            ) : null
          )}
        </nav>

        {/* CTA Button */}
        <button
          onClick={() => scrollToSection("kontakt")}
          className={`hidden lg:block transition-transform duration-300 ${
            active === "kontakt" ? "scale-110 text-gray-900" : "hover:scale-110 text-gray-800"
          }`}
        >
          <Image
            src="/sinu-leht.svg"
            alt="Sinu Leht - Kirjuta Meile"
            width={100}
            height={50}
            className="h-9 w-auto"
          />
        </button>

        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden text-black p-2 rounded-md transition-transform duration-200 ease-in-out"
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
            className="fixed top-15 left-0 right-0  z-50 bg-white/98"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
    <motion.div
  variants={menuVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  className="flex flex-col items-center space-y-6 py-10 text-center"
>
              {sections.filter((id) => id !== "kontakt").map((id) => (
                <motion.div key={id} variants={itemVariants}>
                  <button
                    onClick={() => handleMobileClick(id)}
                    className="block text-black text-2xl font-semibold  tracking-wide hover:text-gray-700 transition-colors"
                  >
                    {id.toUpperCase()}
                  </button>
                </motion.div>
              ))}

              {/* CTA */}
              <motion.div variants={itemVariants}>
                <button
                  onClick={() => handleMobileClick("kontakt")}
                  className="flex justify-center mb-6 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/sinu-leht.svg"
                    alt="Kirjuta Meile"
                    width={100}
                    height={50}
                    className="h-14 w-auto "
                  />
                </button>

                {/* Socials */}
                <div className="flex justify-center gap-6 mt-4">
                  <motion.a href="https://www.facebook.com/umarendus" target="_blank" rel="noopener noreferrer" variants={itemVariants}>
                    <Image src="/facebook.svg" alt="Facebook" width={30} height={30} />
                  </motion.a>
                  <motion.a href="http://linkedin.com/company/umarendus" target="_blank" rel="noopener noreferrer" variants={itemVariants}>
                    <Image src="/linkedin.svg" alt="LinkedIn" width={30} height={30} />
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
