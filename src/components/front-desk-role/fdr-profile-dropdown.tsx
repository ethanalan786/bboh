"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

interface FDRProfileDropdownProps {
  variant?: 'header' | 'sidebar';
}

export default function FDRProfileDropdown({ variant = 'header' }: FDRProfileDropdownProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleProfileClick = () => {
    window.location.href = '/dashboard/front-desk-role/profile';
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const userName = session?.user?.name || "John Doe";
  const userImage = session?.user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="gap-3 flex items-center cursor-pointer p-1 bg-transparent border-none outline-none w-full">
        <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[11px] font-semibold text-neutral-300 overflow-hidden">
          {userImage ? (
            <img
              src={userImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(userName)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none dark:text-white">{userName}</p>
          <p className="text-[11px] dark:text-neutral-500 mt-0.5">Front Desk</p>
        </div>
        <ChevronDown size={13} className="dark:text-neutral-600" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === 'sidebar' ? 'start' : 'end'} className="w-56 dark:bg-[#111] dark:border-[#1a1a1a]">
        <DropdownMenuItem onClick={handleProfileClick} className="dark:text-white dark:focus:bg-[#1a1a1a]">
          <User size={16} />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:bg-[#1a1a1a]" />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="dark:text-red-400 dark:focus:bg-red-900/20"
        >
          <LogOut size={16} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}