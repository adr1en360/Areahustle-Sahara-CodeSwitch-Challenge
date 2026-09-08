import Link from "next/link";
import logo from "@/assets/logo.png";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image src={logo} alt="AreaHustle Logo" className="h-8 w-auto object-contain" />
            <span className="font-display text-lg font-bold">AreaHustle</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            The hyper-local gig marketplace that turns everyday work into a verified financial passport.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/Jobs">Browse Jobs</Link>
            </li>
            <li>
              <Link href="/Post-Task">Post a Task</Link>
            </li>
            <li>
              <Link href="/Passport">Financial Passport</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>About</li>
            <li>Press</li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Privacy</li>
            <li>Terms</li>
            <li>Compliance</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">© 2026 AreaHustle · Lagos · Built for the informal economy.</div>
    </footer>
  );
}
