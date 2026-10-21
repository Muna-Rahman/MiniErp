"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Window, Button, Loading } from "@/components/retro";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🖥️" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/suppliers", label: "Suppliers", icon: "🏭" },
  { href: "/purchases", label: "Purchases", icon: "🧾" },
  { href: "/sales", label: "Sales", icon: "🛒" },
  { href: "/expenses", label: "Expenses", icon: "💸" },
];

function Clock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return <span className="clock">{now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>;
}

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <div className="center-screen">
        <Window title="Starting Mini ERP 95..." icon="⏳">
          <Loading label="Checking your session" />
        </Window>
      </div>
    );
  }

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <Window title="Programs" icon="📁">
            <nav className="nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "active" : ""}>
                  <span className="ico">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </nav>
          </Window>
        </aside>
        <main>{children}</main>
      </div>

      <footer className="taskbar">
        <span className="btn start">
          <span>🪟</span> Start
        </span>
        <span className="user">{session.user.name || session.user.email}</span>
        <Button size="small" onClick={signOut}>
          Sign out
        </Button>
        <Clock />
      </footer>
    </>
  );
}
