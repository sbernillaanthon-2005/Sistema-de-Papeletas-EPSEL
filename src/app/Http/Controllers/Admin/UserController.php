<?php

namespace App\Http\Controllers\Admin;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\User\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\ExitSlip;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:120', 'rol' => ['nullable', Rule::enum(UserRole::class)], 'activo' => 'nullable|in:0,1']);
        $query = User::with(['area', 'jefe'])->orderBy('apellidos')->orderBy('id');
        if ($request->filled('q')) {
            $term = '%'.addcslashes(trim($filters['q']), '%_\\').'%';
            $query->where(fn ($q) => $q->where('nombres', 'ilike', $term)->orWhere('apellidos', 'ilike', $term)->orWhere('dni', 'ilike', $term));
        }
        if ($request->filled('rol')) {
            $query->where('rol', $filters['rol']);
        }
        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        $workflowCounts = ExitSlip::query()
            ->selectRaw('estado, count(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');
        $workflow = collect([
            ExitSlipStatus::SUBMITTED,
            ExitSlipStatus::SUBMITTED_TO_HR,
            ExitSlipStatus::SUBMITTED_TO_SECURITY,
            ExitSlipStatus::COMPLETED,
            ExitSlipStatus::REJECTED,
        ])->map(function (ExitSlipStatus $status) use ($workflowCounts) {
            return [
                'key' => $status->value,
                'label' => $status->label(),
                'value' => (int) ($workflowCounts[$status->value] ?? 0),
            ];
        });

        $firstMonth = now('America/Lima')->subMonths(5)->startOfMonth();
        $monthCounts = ExitSlip::query()
            ->where('created_at', '>=', $firstMonth)
            ->selectRaw("to_char(date_trunc('month', created_at), 'YYYY-MM') as month_key, count(*) as total")
            ->groupBy('month_key')
            ->pluck('total', 'month_key');
        $monthly = collect(range(5, 0))->map(function (int $offset) use ($monthCounts) {
            $month = now('America/Lima')->subMonths($offset)->startOfMonth();

            return [
                'label' => ucfirst($month->translatedFormat('M')),
                'value' => (int) ($monthCounts[$month->format('Y-m')] ?? 0),
            ];
        });

        $accessCounts = User::query()
            ->selectRaw('rol, activo, count(*) as total')
            ->groupBy('rol', 'activo')
            ->get()
            ->groupBy('rol');
        $accessByRole = collect(UserRole::cases())->map(function (UserRole $role) use ($accessCounts) {
            $counts = $accessCounts->get($role->value, collect());

            return [
                'key' => $role->value,
                'label' => $role->label(),
                'active' => (int) ($counts->firstWhere('activo', true)?->total ?? 0),
                'inactive' => (int) ($counts->firstWhere('activo', false)?->total ?? 0),
            ];
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $query->paginate(15)->withQueryString(),
            'filters' => $filters,
            'summary' => ['total' => User::count(), 'active' => User::where('activo', true)->count(), 'heads' => User::where('rol', 'area_head')->where('activo', true)->count(), 'areas' => Area::count()],
            'workflow' => $workflow,
            'monthly' => $monthly,
            'accessByRole' => $accessByRole,
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

    public function store(Request $request, AuditLogger $audit)
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
            'email' => $request->dni.'@epsel.com.pe',
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

        $audit->record($request, 'user.created', 'Creó una cuenta de usuario.', User::class, $user->id, [
            'dni' => $user->dni,
            'role' => $user->rol->value,
        ]);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(Request $request, string $id, AuditLogger $audit)
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
        $changes = $request->only('activo', 'area_id', 'jefe_id');
        $user->update($changes);

        // If assigned as head...
        if ($user->rol->value === UserRole::AREA_HEAD->value && $user->area_id) {
            User::where('area_id', $user->area_id)
                ->whereNull('jefe_id')
                ->where('id', '!=', $user->id)
                ->update(['jefe_id' => $user->id]);
        }

        $audit->record($request, 'user.updated', 'Actualizó acceso o asignación de un usuario.', User::class, $user->id, $changes);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(Request $request, string $id, AuditLogger $audit)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['activo' => 'No puedes eliminar tu propia cuenta.']);
        }

        $audit->record($request, 'user.deleted', 'Eliminó una cuenta de usuario.', User::class, $user->id, [
            'dni' => $user->dni,
            'role' => $user->rol->value,
        ]);
        $user->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }
}
