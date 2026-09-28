<?php

namespace App\Http\Controllers\Admin;

use App\Domain\User\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::with(['area', 'jefe'])->orderBy('apellidos')->paginate(20),
            'areas' => Area::orderBy('nombre')->get(),
            'heads' => User::where('rol', 'area_head')->where('activo', true)->get(['id', 'nombres', 'apellidos', 'area_id']),
            'roles' => [
                ['value' => UserRole::PRACTITIONER->value, 'label' => UserRole::PRACTITIONER->label()],
                ['value' => UserRole::WORKER->value, 'label' => UserRole::WORKER->label()],
                ['value' => UserRole::AREA_HEAD->value, 'label' => UserRole::AREA_HEAD->label()],
                ['value' => UserRole::HR->value, 'label' => UserRole::HR->label()],
                ['value' => 'security', 'label' => 'Vigilancia'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'dni' => 'required|string|size:8|unique:users',
            'password' => 'required|string|min:8',
            'rol' => 'required|in:'.UserRole::PRACTITIONER->value.','.UserRole::WORKER->value.','.UserRole::AREA_HEAD->value.','.UserRole::HR->value.',security',
            'area_id' => 'required_if:rol,'.UserRole::AREA_HEAD->value.'|nullable|exists:areas,id',
            'cargo_designado' => 'required|string',
        ]);

        $user = User::create([
            'id' => Str::uuid()->toString(),
            'nombres' => $request->nombres,
            'apellidos' => $request->apellidos,
            'dni' => $request->dni,
            'email' => $request->dni . '@epsel.com.pe',
            'password' => Hash::make($request->password),
            'rol' => $request->rol,
            'area_id' => $request->area_id,
            'cargo_designado' => $request->cargo_designado,
            'activo' => true,
        ]);

        // "cuando el ADMIN cree o asigne un JEFE_AREA a un Ã¡rea, asigna ese jefe a los usuarios del Ã¡rea que tengan jefe_id nulo"
        if ($user->rol->value === UserRole::AREA_HEAD->value && $user->area_id) {
            User::where('area_id', $user->area_id)
                ->whereNull('jefe_id')
                ->where('id', '!=', $user->id)
                ->update(['jefe_id' => $user->id]);
        }

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'activo' => 'boolean',
            'area_id' => 'nullable|exists:areas,id',
            'jefe_id' => 'nullable|exists:users,id',
        ]);

        if ($request->filled('jefe_id')) {
            $head = User::whereKey($request->jefe_id)->where('rol', 'area_head')->where('activo', true)->first();
            if (! $head || $head->id === $user->id || $head->area_id !== ($request->exists('area_id') ? $request->area_id : $user->area_id)) {
                throw ValidationException::withMessages(['jefe_id' => 'Selecciona un jefe activo de la misma Área.']);
            }
        }
        if ($user->id === $request->user()->id && $request->has('activo') && ! $request->boolean('activo')) {
            throw ValidationException::withMessages(['activo' => 'No puedes desactivar tu propia cuenta.']);
        }
        $user->update($request->only('activo', 'area_id', 'jefe_id'));

        // If assigned as head...
        if ($user->rol->value === UserRole::AREA_HEAD->value && $user->area_id) {
            User::where('area_id', $user->area_id)
                ->whereNull('jefe_id')
                ->where('id', '!=', $user->id)
                ->update(['jefe_id' => $user->id]);
        }

        return back()->with('success', 'Usuario actualizado correctamente.');
    }
}
