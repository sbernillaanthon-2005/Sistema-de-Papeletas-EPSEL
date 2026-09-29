import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode } from "react";
import NotificationBell from "@/Components/NotificationBell";
export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage().props;
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <nav className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 p-4">
                    <Link
                        href={route("dashboard")}
                        className="text-xl font-bold text-blue-900"
                    >
                        EPSEL · Papeletas
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <Link href={route("exit-slips.index")}>Bandeja</Link>
                        {auth.user.rol === "admin" && (
                            <Link href={route("admin.dashboard")}>
                                Usuarios
                            </Link>
                        )}
                        <Link href={route("profile.edit")} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-md transition-colors">
                            <div className="flex flex-col text-right hidden sm:flex mr-1">
                                <span className="font-semibold text-sm leading-tight text-gray-800">{auth.user.nombres}</span>
                                <span className="text-xs text-gray-500">{auth.user.rol_label}</span>
                            </div>
                            <img 
                                src={auth.user.profile_photo_url} 
                                alt={auth.user.nombres} 
                                className="h-9 w-9 rounded-full object-cover border border-gray-200" 
                            />
                        </Link>
                        <NotificationBell />
                        <Link href={route("logout")} method="post" as="button">
                            Salir
                        </Link>
                    </div>
                </div>
            </nav>
            {header && (
                <header className="bg-white shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 py-6">{header}</div>
                </header>
            )}
            {flash?.success && (
                <div
                    role="status"
                    className="mx-auto mt-4 max-w-7xl rounded bg-emerald-50 p-4 text-emerald-900"
                >
                    {flash.success}
                </div>
            )}
            <main>{children}</main>
        </div>
    );
}
