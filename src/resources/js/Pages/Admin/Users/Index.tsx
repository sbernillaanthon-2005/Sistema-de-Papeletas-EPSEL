import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Pagination } from "@/types/exit-slip";
import { useState } from "react";
type Person = {
    id: string;
    nombres: string;
    apellidos: string;
    rol: string;
    activo: boolean;
    area_id: string | null;
    jefe_id: string | null;
};
export default function Index({
    users,
    areas,
    roles,
    heads,
}: {
    users: Pagination<Person>;
    areas: { id: string; nombre: string }[];
    roles: { value: string; label: string }[];
    heads: Person[];
}) {
    const [updateError, setUpdateError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        nombres: "",
        apellidos: "",
        dni: "",
        password: "",
        rol: "area_head",
        area_id: "",
        cargo_designado: "",
    });
    const update = (u: Person, data: Record<string, string | boolean | null>) =>
        router.put(route("admin.users.update", u.id), data, {
            preserveScroll: true,
            onStart: () => setUpdateError(""),
            onError: errors => setUpdateError(Object.values(errors).join(" ")),
        });
    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-xl font-semibold">
                    Administración de usuarios
                </h1>
            }
        >
            <Head title="Usuarios" />
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                {updateError && <p role="alert" className="rounded bg-red-50 p-4 text-red-700">{updateError}</p>}
                <form
                    className="space-y-4 rounded-xl bg-white p-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route("admin.users.store"), {
                            onSuccess: () => form.reset(),
                        });
                    }}
                >
                    <h2 className="font-semibold">Crear usuario</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {(
                            [
                                "nombres",
                                "apellidos",
                                "dni",
                                "password",
                                "cargo_designado",
                            ] as const
                        ).map((k) => (
                            <label key={k} className="block">
                                {
                                    {
                                        nombres: "Nombres",
                                        apellidos: "Apellidos",
                                        dni: "DNI",
                                        password: "Contraseña inicial",
                                        cargo_designado: "Cargo",
                                    }[k]
                                }
                                <div className="relative">
                                    <input
                                        required
                                        type={
                                            k === "password"
                                                ? (showPassword ? "text" : "password")
                                                : "text"
                                        }
                                        className="mt-1 block w-full rounded border-slate-300 pr-16"
                                        value={form.data[k]}
                                        onChange={(e) =>
                                            form.setData(k, e.target.value)
                                        }
                                    />
                                    {k === "password" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 mt-[2px]"
                                            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </label>
                        ))}
                        <label>
                            Rol
                            <select
                                className="mt-1 block w-full rounded border-slate-300"
                                value={form.data.rol}
                                onChange={(e) =>
                                    form.setData("rol", e.target.value)
                                }
                            >
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Área
                            <select
                                className="mt-1 block w-full rounded border-slate-300"
                                value={form.data.area_id}
                                onChange={(e) =>
                                    form.setData("area_id", e.target.value)
                                }
                            >
                                <option value="">Sin Área</option>
                                {areas.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div role="alert" className="text-red-700">
                        {Object.entries(form.errors).map(([k, v]) => (
                            <p key={k}>{v}</p>
                        ))}
                    </div>
                    <button
                        disabled={form.processing}
                        className="rounded bg-blue-800 px-4 py-2 text-white"
                    >
                        Crear usuario
                    </button>
                </form>
                <div className="overflow-x-auto rounded-xl bg-white">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr>
                                {[
                                    "Usuario",
                                    "Rol",
                                    "Área",
                                    "Jefe asignado",
                                    "Acceso",
                                ].map((h) => (
                                    <th className="p-3" key={h}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="p-3">
                                        {u.apellidos} {u.nombres}
                                    </td>
                                    <td className="p-3">{u.rol}</td>
                                    <td className="p-3">
                                        <select
                                            aria-label={`Área de ${u.nombres}`}
                                            className="rounded border-slate-300"
                                            value={u.area_id || ""}
                                            onChange={(e) =>
                                                update(u, {
                                                    area_id:
                                                        e.target.value || null,
                                                    jefe_id: null,
                                                })
                                            }
                                        >
                                            <option value="">Sin Área</option>
                                            {areas.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            aria-label={`Jefe de ${u.nombres}`}
                                            className="rounded border-slate-300"
                                            value={u.jefe_id || ""}
                                            onChange={(e) =>
                                                update(u, {
                                                    jefe_id:
                                                        e.target.value || null,
                                                })
                                            }
                                        >
                                            <option value="">Sin jefe</option>
                                            {heads
                                                .filter(
                                                    (h) =>
                                                        h.id !== u.id &&
                                                        h.area_id === u.area_id,
                                                )
                                                .map((h) => (
                                                    <option
                                                        key={h.id}
                                                        value={h.id}
                                                    >
                                                        {h.apellidos}{" "}
                                                        {h.nombres}
                                                    </option>
                                                ))}
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            className="underline"
                                            onClick={() =>
                                                update(u, { activo: !u.activo })
                                            }
                                        >
                                            {u.activo
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex gap-4">
                    <span>
                        Página {users.current_page} de {users.last_page}
                    </span>
                    {users.prev_page_url && (
                        <button
                            onClick={() => router.visit(users.prev_page_url!)}
                        >
                            Anterior
                        </button>
                    )}
                    {users.next_page_url && (
                        <button
                            onClick={() => router.visit(users.next_page_url!)}
                        >
                            Siguiente
                        </button>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
