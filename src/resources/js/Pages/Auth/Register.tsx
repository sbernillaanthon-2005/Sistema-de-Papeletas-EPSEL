import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Area {
    id: string;
    nombre: string;
}

export default function Register({ areas }: { areas: Area[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        nombres: '',
        apellidos: '',
        dni: '',
        email: '',
        password: '',
        password_confirmation: '',
        area_id: '',
        cargo_designado: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Registro" />

            <form onSubmit={submit}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="nombres" value="Nombres" />
                        <TextInput
                            id="nombres"
                            name="nombres"
                            value={data.nombres}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('nombres', e.target.value)}
                            required
                        />
                        <InputError message={errors.nombres} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="apellidos" value="Apellidos" />
                        <TextInput
                            id="apellidos"
                            name="apellidos"
                            value={data.apellidos}
                            className="mt-1 block w-full"
                            autoComplete="family-name"
                            onChange={(e) => setData('apellidos', e.target.value)}
                            required
                        />
                        <InputError message={errors.apellidos} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="dni" value="DNI" />
                        <TextInput
                            id="dni"
                            name="dni"
                            value={data.dni}
                            className="mt-1 block w-full"
                            maxLength={8}
                            onChange={(e) => setData('dni', e.target.value)}
                            required
                        />
                        <InputError message={errors.dni} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Correo Electrónico" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="email"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="area_id" value="Área" />
                    <select
                        id="area_id"
                        name="area_id"
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={data.area_id}
                        onChange={(e) => setData('area_id', e.target.value)}
                        required
                    >
                        <option value="">Seleccione un área...</option>
                        {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.nombre}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.area_id} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="cargo_designado" value="Cargo / Designado" />
                    <TextInput
                        id="cargo_designado"
                        name="cargo_designado"
                        value={data.cargo_designado}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('cargo_designado', e.target.value)}
                        required
                    />
                    <InputError message={errors.cargo_designado} className="mt-2" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="password" value="Contraseña" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Confirmar Contraseña" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        ¿Ya estás registrado?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Registrarse
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
