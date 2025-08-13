
'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Stethoscope,
  ShoppingCart,
} from 'lucide-react'

export function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    // Fetch unread notifications count
    if (session?.user?.id) {
      fetch(`/api/notifications/count?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => setNotifications(data?.count || 0))
        .catch(() => {})
    }
  }, [session?.user?.id])

  const isActive = (href: string) => pathname === href

  const customerNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FileText },
    { href: '/orders', label: 'My Orders', icon: FileText },
    { href: '/orders/new', label: 'New Order', icon: FileText },
    { href: '/consultations', label: 'Consultations', icon: Stethoscope },
  ]

  const reviewerNavItems = [
    { href: '/reviewer/dashboard', label: 'Dashboard', icon: FileText },
    { href: '/reviewer/orders', label: 'Orders', icon: FileText },
    { href: '/reviewer/schedule', label: 'Schedule', icon: Stethoscope },
    { href: '/reviewer/reviews', label: 'Reviews', icon: FileText },
  ]

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: User },
    { href: '/admin/orders', label: 'Orders', icon: FileText },
    { href: '/admin/payments', label: 'Payments', icon: FileText },
  ]

  const getNavItems = () => {
    if (!session?.user) return []
    
    switch (session.user.role) {
      case 'CUSTOMER':
        return customerNavItems
      case 'REVIEWER':
        return reviewerNavItems
      case 'ADMIN':
        return adminNavItems
      default:
        return customerNavItems
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">MedReview</span>
            </Link>

            {/* Desktop Navigation */}
            {session?.user && (
              <div className="hidden md:flex items-center space-x-1 ml-8">
                {getNavItems().map(({ href, label, icon: Icon }) => (
                  <Button
                    key={href}
                    variant={isActive(href) ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link href={href} className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/notifications" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                        {notifications > 9 ? '9+' : notifications}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Shopping Cart (for customers) */}
                {session.user.role === 'CUSTOMER' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                    </Link>
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user.name && <p className="font-medium">{session.user.name}</p>}
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                        <Badge variant="outline" className="w-fit text-xs">
                          {session.user.role}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {session?.user && isMenuOpen && (
          <div className="md:hidden border-t bg-background p-4">
            <div className="flex flex-col space-y-2">
              {getNavItems().map(({ href, label, icon: Icon }) => (
                <Button
                  key={href}
                  variant={isActive(href) ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="justify-start"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href={href} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
