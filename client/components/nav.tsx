'use client'

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/workers", label: "Workers" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 border-r p-4 pt-6 w-48">
      <div className="text-xs font-medium mb-4 text-muted-foreground uppercase tracking-wider">Navigation</div>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname === link.href && "bg-accent text-accent-foreground"
            )}
          >
            {link.label}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
