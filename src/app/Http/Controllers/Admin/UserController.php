<?php

namespace App\Http\Controllers\Admin;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\User\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\CustomRole;
use App\Models\ResponsibleHead;
use App\Models\ExitSlip;
use App\Models\User;
use App\Models\SystemSetting;
use App\Support\AuditLogger;
use App\Support\PendingExitSlipMonitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request, PendingExitSlipMonitor $pendingMonitor)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:120', 'rol' => 'nullable|string|max:60', 'activo' => 'nullable|in:0,1']);
        $query = User::with(['area', 'jefe', 'customRole'])->orderBy('apellidos')->orderBy('id');
        if ($request->filled('q')) {
            $term = '%'.addcslashes(trim($filters['q']), '%_\\').'%';
            $query->where(fn ($q) => $q->where('nombres', 'ilike', $term)->orWhere('apellidos', 'ilike', $term)->orWhere('dni', 'ilike', $term));
        }
        if ($request->filled('rol')) {
            if (str_starts_with($filters['rol'], 'custom:')) {
                $customId = substr($filters['rol'], 7);
                abort_unless(CustomRole::whereKey($customId)->exists(), 422);
                $query->where('custom_role_id', $customId);
            } else {
                abort_unless(UserRole::tryFrom($filters['rol']), 422);
                $query->where('rol', $filters['rol'])->whereNull('custom_role_id');
            }
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

        $customRoles = CustomRole::orderBy('nombre')->get();
        $responsibleHeads = ResponsibleHead::pluck('nombre')
            ->concat(User::whereNotNull('jefe_responsable_nombre')->pluck('jefe_responsable_nombre'))
            ->concat(User::where('rol', UserRole::AREA_HEAD->value)->where('activo', true)->get(['nombres', 'apellidos'])->map(fn (User $head) => trim($head->nombres.' '.$head->apellidos)))
            ->filter()
            ->unique(fn (string $name) => mb_strtolower(trim($name)))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();
        $accessCounts = User::query()
            ->selectRaw('rol, custom_role_id, activo, count(*) as total')
            ->groupBy('rol', 'custom_role_id', 'activo')
            ->get();
        $accessByRole = collect(UserRole::cases())->map(function (UserRole $role) use ($accessCounts) {
            $counts = $accessCounts->where('rol', $role->value)->whereNull('custom_role_id');
            return [
                'key' => $role->value,
                'label' => $role->label(),
                'active' => (int) ($counts->firstWhere('activo', true)?->total ?? 0),
                'inactive' => (int) ($counts->firstWhere('activo', false)?->total ?? 0),
            ];
        })->concat($customRoles->map(function (CustomRole $role) use ($accessCounts) {
            $counts = $accessCounts->where('custom_role_id', $role->id);
            return [
                'key' => 'custom:'.$role->id,
                'label' => $role->nombre,
                'active' => (int) ($counts->firstWhere('activo', true)?->total ?? 0),
                'inactive' => (int) ($counts->firstWhere('activo', false)?->total ?? 0),
            ];
        }))->values();
        $pendingWorkflow = $pendingMonitor->pending()->map(fn (array $item) => collect($item)->except('recipient_ids')->all())->values();

        return Inertia::render('Admin/Users/Index', [
            'users' => $query->paginate(15)->withQueryString(),
            'filters' => $filters,
            'summary' => ['total' => User::count(), 'active' => User::where('activo', true)->count(), 'heads' => User::where('rol', 'area_head')->where('activo', true)->count(), 'areas' => Area::count()],
            'workflow' => $workflow,
            'monthly' => $monthly,
            'accessByRole' => $accessByRole,
            'pendingWorkflow' => $pendingWorkflow,
            'reminderInterval' => SystemSetting::integer('exit_slip_reminder_minutes', 15),
            'areas' => Area::orderBy('nombre')->get(),
            'responsibleHeads' => $responsibleHeads,
            'registeredHeads' => ResponsibleHead::orderBy('nombre')->get(['id', 'nombre']),
            'roles' => array_merge([
                ['value' => UserRole::PRACTITIONER->value, 'label' => UserRole::PRACTITIONER->label()],
                ['value' => UserRole::WORKER->value, 'label' => UserRole::WORKER->label()],
                ['value' => UserRole::AREA_HEAD->value, 'label' => UserRole::AREA_HEAD->label()],
                ['value' => UserRole::HR->value, 'label' => UserRole::HR->label()],
                ['value' => 'security', 'label' => 'Vigilancia'],
            ], $customRoles->map(fn (CustomRole $role) => [
                'value' => 'custom:'.$role->id,
                'label' => $role->nombre,
                'base_role' => $role->rol_base->value,
            ])->all()),
        ]);
    }

    public function storeRole(Request $request, AuditLogger $audit)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:80'],
        ]);
        $name = trim(preg_replace('/\s+/u', ' ', $validated['nombre']));
        $normalized = mb_strtolower($name);
        $existingNames = collect(UserRole::cases())->map(fn (UserRole $role) => mb_strtolower($role->label()));
        if ($name === '' || $existingNames->contains($normalized) || CustomRole::where('nombre_normalizado', $normalized)->exists()) {
            throw ValidationException::withMessages(['nombre' => 'Ya existe un rol con ese nombre.']);
        }

        $role = CustomRole::create(['nombre' => $name, 'nombre_normalizado' => $normalized, 'rol_base' => UserRole::WORKER->value]);
        $audit->record($request, 'role.created', 'Registró un rol de usuario.', CustomRole::class, $role->id, [
            'nombre' => $role->nombre,
            'rol_base' => $role->rol_base->value,
        ]);

        return back()->with('success', 'Rol registrado correctamente.');
    }

    public function storeResponsibleHead(Request $request, AuditLogger $audit)
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255']]);
        $name = trim(preg_replace('/\s+/u', ' ', $validated['nombre']));
        $normalized = mb_strtolower($name);
        $alreadyUsed = ResponsibleHead::where('nombre_normalizado', $normalized)->exists()
            || User::whereNotNull('jefe_responsable_nombre')->pluck('jefe_responsable_nombre')->contains(fn (string $item) => mb_strtolower(trim($item)) === $normalized)
            || User::where('rol', UserRole::AREA_HEAD->value)->where('activo', true)->get(['nombres', 'apellidos'])->contains(fn (User $head) => mb_strtolower(trim($head->nombres.' '.$head->apellidos)) === $normalized);
        if ($name === '' || $alreadyUsed) {
            throw ValidationException::withMessages(['nombre' => 'Este jefe responsable ya está registrado.']);
        }

        $head = ResponsibleHead::create(['nombre' => $name, 'nombre_normalizado' => $normalized]);
        $audit->record($request, 'responsible_head.created', 'Registró un jefe responsable.', ResponsibleHead::class, $head->id, ['nombre' => $head->nombre]);

        return back()->with('success', 'Jefe responsable registrado correctamente.');
    }

    public function updateResponsibleHead(Request $request, ResponsibleHead $responsibleHead, AuditLogger $audit)
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255']]);
        $name = trim(preg_replace('/\s+/u', ' ', $validated['nombre']));
        $normalized = mb_strtolower($name);
        if ($name === '' || ResponsibleHead::where('nombre_normalizado', $normalized)->whereKeyNot($responsibleHead->id)->exists()) {
            throw ValidationException::withMessages(['nombre' => 'Este jefe responsable ya está registrado.']);
        }
        $oldName = $responsibleHead->nombre;
        $responsibleHead->update(['nombre' => $name, 'nombre_normalizado' => $normalized]);
        User::whereRaw('LOWER(jefe_responsable_nombre) = ?', [mb_strtolower($oldName)])->update(['jefe_responsable_nombre' => $name]);
        $audit->record($request, 'responsible_head.updated', 'Actualizó un jefe responsable.', ResponsibleHead::class, $responsibleHead->id, ['antes' => $oldName, 'despues' => $name]);
        return back()->with('success', 'Jefe responsable actualizado.');
    }

    public function destroyResponsibleHead(Request $request, ResponsibleHead $responsibleHead, AuditLogger $audit)
    {
        if (User::whereRaw('LOWER(jefe_responsable_nombre) = ?', [mb_strtolower($responsibleHead->nombre)])->exists()) {
            throw ValidationException::withMessages(['registro' => 'No se puede eliminar porque está asignado a usuarios.']);
        }
        $name = $responsibleHead->nombre;
        $id = $responsibleHead->id;
        $responsibleHead->delete();
        $audit->record($request, 'responsible_head.deleted', 'Eliminó un jefe responsable.', ResponsibleHead::class, $id, ['nombre' => $name]);
        return back()->with('success', 'Jefe responsable eliminado.');
    }

    public function updateRole(Request $request, CustomRole $customRole, AuditLogger $audit)
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:80']]);
        $name = trim(preg_replace('/\s+/u', ' ', $validated['nombre']));
        $normalized = mb_strtolower($name);
        if ($name === '' || collect(UserRole::cases())->contains(fn (UserRole $role) => mb_strtolower($role->label()) === $normalized)
            || CustomRole::where('nombre_normalizado', $normalized)->whereKeyNot($customRole->id)->exists()) {
            throw ValidationException::withMessages(['nombre' => 'Ya existe un rol con ese nombre.']);
        }
        $oldName = $customRole->nombre;
        $customRole->update(['nombre' => $name, 'nombre_normalizado' => $normalized]);
        $audit->record($request, 'role.updated', 'Actualizó un rol.', CustomRole::class, $customRole->id, ['antes' => $oldName, 'despues' => $name]);
        return back()->with('success', 'Rol actualizado.');
    }

    public function destroyRole(Request $request, CustomRole $customRole, AuditLogger $audit)
    {
        if (User::where('custom_role_id', $customRole->id)->exists()) {
            throw ValidationException::withMessages(['registro' => 'No se puede eliminar porque el rol está asignado a usuarios.']);
        }
        $name = $customRole->nombre;
        $id = $customRole->id;
        $customRole->delete();
        $audit->record($request, 'role.deleted', 'Eliminó un rol.', CustomRole::class, $id, ['nombre' => $name]);
        return back()->with('success', 'Rol eliminado.');
    }

    public function updateArea(Request $request, Area $area, AuditLogger $audit)
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255']]);
        $name = trim(preg_replace('/\s+/u', ' ', $validated['nombre']));
        if ($name === '' || Area::whereRaw('LOWER(nombre) = ?', [mb_strtolower($name)])->whereKeyNot($area->id)->exists()) {
            throw ValidationException::withMessages(['nombre' => 'Ya existe un área con ese nombre.']);
        }
        $oldName = $area->nombre;
        $area->update(['nombre' => $name]);
        $audit->record($request, 'area.updated', 'Actualizó un área.', Area::class, $area->id, ['antes' => $oldName, 'despues' => $name]);
        return back()->with('success', 'Área actualizada.');
    }

    public function destroyArea(Request $request, Area $area, AuditLogger $audit)
    {
        if ($area->users()->exists()) {
            throw ValidationException::withMessages(['registro' => 'No se puede eliminar porque el área está asignada a usuarios.']);
        }
        $name = $area->nombre;
        $id = $area->id;
        $area->delete();
        $audit->record($request, 'area.deleted', 'Eliminó un área.', Area::class, $id, ['nombre' => $name]);
        return back()->with('success', 'Área eliminada.');
    }

    public function updateReminderSettings(Request $request, AuditLogger $audit)
    {
        $validated = $request->validate(['minutes' => ['required', 'integer', 'min:1', 'max:1440']]);
        SystemSetting::query()->updateOrCreate(
            ['key' => 'exit_slip_reminder_minutes'],
            ['value' => (string) $validated['minutes']],
        );
        $audit->record($request, 'exit_slip.reminder_interval_updated', 'Actualizó el intervalo de recordatorios de firma.', SystemSetting::class, null, $validated);

        return back()->with('success', 'Intervalo de recordatorios actualizado.');
    }

    public function storeArea(Request $request, AuditLogger $audit)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
        ]);
        $nombre = trim($validated['nombre']);
        if ($nombre === '' || Area::whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])->exists()) {
            throw ValidationException::withMessages(['nombre' => 'Ingresa un nombre de área distinto a los existentes.']);
        }

        $area = Area::create(['nombre' => $nombre]);
        $audit->record($request, 'area.created', 'Creó un área de trabajo.', Area::class, $area->id, ['nombre' => $area->nombre]);

        return back()->with('success', 'Área creada correctamente.');
    }

    public function store(Request $request, AuditLogger $audit)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'dni' => 'required|string|size:8|unique:users',
            'password' => 'required|string|min:8',
            'rol' => ['required', 'string', 'max:60'],
            'area_id' => 'nullable|exists:areas,id',
            'jefe_responsable_nombre' => 'nullable|string|max:255',
        ]);
        $customRole = str_starts_with($validated['rol'], 'custom:')
            ? CustomRole::find(substr($validated['rol'], 7))
            : null;
        $baseRole = $customRole?->rol_base->value ?? $validated['rol'];
        if (! in_array($baseRole, ['practitioner', 'worker', 'area_head', 'hr', 'security'], true)
            || (str_starts_with($validated['rol'], 'custom:') && ! $customRole)) {
            throw ValidationException::withMessages(['rol' => 'Selecciona un rol válido.']);
        }
        if ($baseRole === UserRole::AREA_HEAD->value && ! $request->filled('area_id')) {
            throw ValidationException::withMessages(['area_id' => 'El área es obligatoria para este rol.']);
        }
        $headName = trim((string) $request->input('jefe_responsable_nombre')) ?: null;

        $user = User::create([
            'id' => Str::uuid()->toString(),
            'nombres' => $request->nombres,
            'apellidos' => $request->apellidos,
            'dni' => $request->dni,
            'email' => $request->dni.'@epsel.com.pe',
            'password' => Hash::make($request->password),
            'rol' => $baseRole,
            'custom_role_id' => $customRole?->id,
            'area_id' => $request->area_id,
            'jefe_id' => $baseRole === UserRole::AREA_HEAD->value ? null : $this->resolveHeadId($headName),
            'jefe_responsable_nombre' => $headName,
            'activo' => true,
        ]);

        $audit->record($request, 'user.created', 'Creó una cuenta de usuario.', User::class, $user->id, [
            'dni' => $user->dni,
            'role' => $user->rol->value,
        ]);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(Request $request, string $id, AuditLogger $audit)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'activo' => 'boolean',
            'area_id' => 'nullable|exists:areas,id',
            'jefe_responsable_nombre' => 'nullable|string|max:255',
            'rol' => 'sometimes|string|max:60',
            'password' => 'nullable|string|min:8|confirmed',
        ]);
        if ($user->id === $request->user()->id && $request->has('activo') && ! $request->boolean('activo')) {
            throw ValidationException::withMessages(['activo' => 'No puedes desactivar tu propia cuenta.']);
        }
        $selectedRole = $validated['rol'] ?? ($user->custom_role_id ? 'custom:'.$user->custom_role_id : $user->rol->value);
        $customRole = str_starts_with($selectedRole, 'custom:')
            ? CustomRole::find(substr($selectedRole, 7))
            : null;
        $baseRole = $customRole?->rol_base->value ?? $selectedRole;
        if (! in_array($baseRole, ['admin', 'practitioner', 'worker', 'area_head', 'hr', 'security'], true)
            || (str_starts_with($selectedRole, 'custom:') && ! $customRole)
            || ($baseRole === 'admin' && $user->rol->value !== 'admin')) {
            throw ValidationException::withMessages(['rol' => 'Selecciona un rol válido.']);
        }
        if ($user->id === $request->user()->id && ($baseRole !== 'admin' || $customRole)) {
            throw ValidationException::withMessages(['rol' => 'No puedes cambiar tu propio rol de administrador.']);
        }
        if ($baseRole === UserRole::AREA_HEAD->value && ! $request->filled('area_id')) {
            throw ValidationException::withMessages(['area_id' => 'El área es obligatoria para este rol.']);
        }

        $changes = $request->only('nombres', 'apellidos', 'activo', 'area_id');
        $changes['rol'] = $baseRole;
        $changes['custom_role_id'] = $customRole?->id;
        $headName = trim((string) $request->input('jefe_responsable_nombre')) ?: null;
        $changes['jefe_responsable_nombre'] = $headName;
        $changes['jefe_id'] = $baseRole === UserRole::AREA_HEAD->value ? null : $this->resolveHeadId($headName, $user->id);
        if ($request->filled('password')) {
            $changes['password'] = Hash::make($validated['password']);
        }
        $user->update($changes);

        $auditChanges = collect($changes)->except('password')->all();
        $auditChanges['password_reset'] = $request->filled('password');
        $audit->record($request, 'user.updated', 'Actualizó los datos o el acceso de un usuario.', User::class, $user->id, $auditChanges);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    private function resolveHeadId(?string $name, ?string $excludedId = null): ?string
    {
        if (! $name) {
            return null;
        }

        $normalize = fn (string $value) => mb_strtolower(trim(preg_replace('/\s+/u', ' ', $value)));
        $matches = User::query()->where('rol', UserRole::AREA_HEAD->value)->where('activo', true)
            ->get(['id', 'nombres', 'apellidos'])
            ->filter(fn (User $head) => $head->id !== $excludedId && $normalize($head->nombres.' '.$head->apellidos) === $normalize($name));

        return $matches->count() === 1 ? $matches->first()->id : null;
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
