<?php

namespace App\Http\Controllers;

use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use App\Infrastructure\ExitSlip\ExitSlipWorkflow;
use App\Models\User;
use App\Support\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use DateTimeImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExitSlipController extends Controller
{
    public function __construct(
        private ExitSlipRepositoryInterface $repository
    ) {}

    public function index(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:120',
            'estado' => ['nullable', Rule::in(array_merge(['pending'], array_column(ExitSlipStatus::cases(), 'value')))],
            'fecha' => 'nullable|date_format:Y-m-d',
            'solicitante' => 'nullable|uuid',
        ]);
        $user = $request->user();
        $query = \App\Models\ExitSlip::query();
        match ($user->rol->value) {
            'admin' => null,
            'area_head' => $query->where(fn ($q) => $q->where('user_id', $user->id)->orWhere(fn ($q) => $q->where('jefe_asignado_id', $user->id)->where('estado', '!=', 'draft'))),
            'hr' => $query->whereIn('estado', ['submitted_to_hr', 'approved_by_hr', 'submitted_to_security', 'completed', 'rejected']),
            'security' => $query->whereIn('estado', ['submitted_to_security', 'completed']),
            default => $query->where('user_id', $user->id),
        };
        $counts = (clone $query)->selectRaw('estado, count(*) as total')->groupBy('estado')->pluck('total', 'estado');
        $inTransit = (clone $query)->where('estado', 'submitted_to_security')->whereNotNull('hora_salida')->whereNull('hora_retorno')->count();
        $folders = $user->rol->value === 'hr'
            ? (clone $query)->join('users', 'users.id', '=', 'exit_slips.user_id')
                ->selectRaw("exit_slips.user_id, users.nombres, users.apellidos, users.dni, count(*) as total, count(*) filter (where exit_slips.estado = 'submitted_to_hr') as pending")
                ->groupBy('exit_slips.user_id', 'users.nombres', 'users.apellidos', 'users.dni')
                ->orderByRaw("count(*) filter (where exit_slips.estado = 'submitted_to_hr') desc")
                ->orderBy('users.apellidos')->orderBy('users.nombres')->get()
                ->map(fn ($folder) => [
                    'id' => $folder->user_id,
                    'name' => trim($folder->nombres.' '.$folder->apellidos),
                    'dni' => $folder->dni,
                    'total' => (int) $folder->total,
                    'pending' => (int) $folder->pending,
                ])->values()
            : collect();
        if ($request->filled('estado')) {
            $request->estado === 'pending'
                ? $query->whereNotIn('estado', ['completed', 'rejected'])
                : $query->where('estado', $request->estado);
        }
        if ($request->filled('fecha')) {
            $query->whereDate('fecha_autorizada', $request->fecha);
        }
        if ($request->filled('solicitante')) {
            $query->where('user_id', $request->solicitante);
        }
        if ($request->filled('q')) {
            $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $request->q).'%';
            $query->where(fn ($q) => $q->where('codigo', 'ilike', $term)->orWhere('apellidos_nombres', 'ilike', $term));
        }
        $page = $query->with('user:id,nombres,apellidos')->latest()->orderBy('id')->paginate(15)->withQueryString();
        $items = $page->getCollection()->map(function ($slip) {
            return [
                'id' => $slip->id, 'codigo' => $slip->codigo,
                'fecha_emision' => $slip->fecha_emision->toDateString(),
                'fecha_autorizada' => $slip->fecha_autorizada->toDateString(),
                'hora_desde' => $slip->hora_desde, 'hora_hasta' => $slip->hora_hasta,
                'hora_salida' => $slip->hora_salida, 'hora_retorno' => $slip->hora_retorno,
                'motivo_salida' => $slip->motivo_salida->value, 'motivo_label' => $slip->motivo_salida->label(),
                'estado' => $slip->estado->value, 'estado_label' => $slip->estado->label(),
                'apellidos_nombres' => in_array($slip->estado->value, ['draft', 'submitted']) && $slip->user ? trim($slip->user->nombres.' '.$slip->user->apellidos) : $slip->apellidos_nombres,
                'can_edit' => Gate::allows('update', $slip),
                'can_delete' => Gate::allows('delete', $slip),
            ];
        });

        return Inertia::render('ExitSlips/Index', [
            'exitSlips' => $items,
            'pagination' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'prev_page_url' => $page->previousPageUrl(), 'next_page_url' => $page->nextPageUrl()],
            'counts' => $counts, 'inTransit' => $inTransit, 'filters' => $request->only('q', 'estado', 'fecha'),
            'folders' => $folders,
            'selectedFolder' => $request->input('solicitante'),
            'canCreate' => Gate::allows('create', \App\Models\ExitSlip::class),
        ]);
    }

    /**
     * Descarga en formato compatible con Microsoft Excel únicamente los registros
     * que la cuenta actual puede consultar. Los filtros son los mismos de la bandeja.
     */
    public function export(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:120',
            'estado' => ['nullable', Rule::in(array_merge(['pending'], array_column(ExitSlipStatus::cases(), 'value')))],
            'fecha' => 'nullable|date_format:Y-m-d',
            'solicitante' => 'nullable|uuid',
        ]);

        $user = $request->user();
        $query = \App\Models\ExitSlip::query();

        match ($user->rol->value) {
            'admin' => null,
            'area_head' => $query->where(fn ($q) => $q->where('user_id', $user->id)->orWhere(fn ($q) => $q->where('jefe_asignado_id', $user->id)->where('estado', '!=', 'draft'))),
            'hr' => $query->whereIn('estado', ['submitted_to_hr', 'approved_by_hr', 'submitted_to_security', 'completed', 'rejected']),
            'security' => $query->whereIn('estado', ['submitted_to_security', 'completed']),
            default => $query->where('user_id', $user->id),
        };

        if ($request->filled('estado')) {
            $request->estado === 'pending'
                ? $query->whereNotIn('estado', ['completed', 'rejected'])
                : $query->where('estado', $request->estado);
        }
        if ($request->filled('fecha')) {
            $query->whereDate('fecha_autorizada', $request->fecha);
        }
        if ($request->filled('solicitante')) {
            $query->where('user_id', $request->solicitante);
        }
        if ($request->filled('q')) {
            $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $request->q).'%';
            $query->where(fn ($q) => $q->where('codigo', 'ilike', $term)->orWhere('apellidos_nombres', 'ilike', $term));
        }

        $slips = $query->with('user:id,nombres,apellidos,dni')->latest()->orderBy('id')->get();
        $filename = 'papeletas-'.now('America/Lima')->format('Ymd-His').'.xls';
        $escape = static fn ($value) => htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return response()->streamDownload(function () use ($slips, $escape) {
            echo '<?xml version="1.0" encoding="UTF-8"?>';
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
            echo '<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#007F99" ss:Pattern="Solid"/></Style><Style ss:ID="Date"><NumberFormat ss:Format="dd/mm/yyyy"/></Style></Styles>';
            echo '<Worksheet ss:Name="Papeletas"><Table>';

            $headers = ['Código', 'Solicitante', 'DNI', 'Fecha autorizada', 'Hora desde', 'Hora hasta', 'Motivo', 'Detalle', 'Estado', 'Salida', 'Retorno'];
            echo '<Row>';
            foreach ($headers as $header) {
                echo '<Cell ss:StyleID="Header"><Data ss:Type="String">'.$escape($header).'</Data></Cell>';
            }
            echo '</Row>';

            foreach ($slips as $slip) {
                $name = in_array($slip->estado->value, ['draft', 'submitted']) && $slip->user
                    ? trim($slip->user->nombres.' '.$slip->user->apellidos)
                    : $slip->apellidos_nombres;
                $values = [
                    $slip->codigo,
                    $name,
                    $slip->user?->dni ?? '',
                    $slip->fecha_autorizada?->format('d/m/Y'),
                    $slip->hora_desde ?? '',
                    $slip->hora_hasta ?? '',
                    $slip->motivo_salida->label(),
                    $slip->motivo_detalle,
                    $slip->estado->label(),
                    $slip->hora_salida ?? '',
                    $slip->hora_retorno ?? '',
                ];
                echo '<Row>';
                foreach ($values as $value) {
                    echo '<Cell><Data ss:Type="String">'.$escape($value).'</Data></Cell>';
                }
                echo '</Row>';
            }

            echo '</Table></Worksheet></Workbook>';
        }, $filename, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    public function create()
    {
        Gate::authorize('create', \App\Models\ExitSlip::class);

        return Inertia::render('ExitSlips/Form', [
            'formatAvailable' => $this->hasAvailableExitSlipFormat(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', \App\Models\ExitSlip::class);
        $validated = $request->validate([
            'tipo_plantilla' => ['required', Rule::enum(ExitSlipTemplate::class)],
            'fecha_emision' => 'required|date',
            'designado' => 'required|string',
            'motivo_salida' => ['required', Rule::enum(ExitReason::class)],
            'motivo_detalle' => 'required|string|max:2000',
            'fecha_autorizada' => 'required|date_format:Y-m-d|after_or_equal:'.now('America/Lima')->toDateString(),
            'hora_desde' => 'nullable|required_with:hora_hasta|date_format:H:i',
            'hora_hasta' => 'nullable|required_with:hora_desde|date_format:H:i|after:hora_desde',
        ]);

        /** @var User $user */
        $user = $request->user();

        // For this test, we must pass positional arguments to bypass IDE bug.
        $slip = new ExitSlip(
            Str::uuid()->toString(),
            'PAP-'.date('Ymd').'-'.strtoupper(Str::random(4)),
            $user->id,
            ExitSlipTemplate::from($validated['tipo_plantilla']),
            new DateTimeImmutable($validated['fecha_emision']),
            $user->nombres.' '.$user->apellidos,
            $validated['designado'],
            ExitReason::from($validated['motivo_salida']),
            $validated['motivo_detalle'],
            new DateTimeImmutable($validated['fecha_autorizada']),
            ! empty($validated['hora_desde']) ? new TimeRange($validated['hora_desde'], $validated['hora_hasta']) : null,
            ExitSlipStatus::DRAFT,
            $user->jefe_id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new DateTimeImmutable
        );

        $this->repository->save($slip);

        return redirect()->route('papeletas.show', $slip->codigo)->with('success', 'Borrador creado.');
    }

    public function show(string $id)
    {
        $id = $this->resolveSlipId($id);
        $slip = $this->repository->findById($id);
        if (! $slip) {
            abort(404);
        }

        Gate::authorize('view', \App\Models\ExitSlip::findOrFail($id));
        // We use Eloquent model for policy authorization

        $slipUser = User::find($slip->practitionerId);
        $displayFullName = $slip->fullNameSnapshot;
        if ($slipUser && in_array($slip->status->value, ['draft', 'submitted'])) {
            $displayFullName = trim($slipUser->nombres.' '.$slipUser->apellidos);
        }

        $model = \App\Models\ExitSlip::findOrFail($id);
        $can = [];
        foreach (['update', 'delete', 'submit', 'approve', 'reject', 'revert', 'security', 'submit_to_hr', 'submit_to_security'] as $ability) {
            $can[$ability] = Gate::allows($ability, $model);
        }

        return Inertia::render('ExitSlips/Show', [
            'can' => $can,
            'history' => $model->transitions()->with('actor:id,nombres,apellidos')->orderBy('id')->get(),
            'exitSlip' => [
                'id' => $slip->id,
                'codigo' => $slip->codigo,
                'fecha_emision' => $slip->issueDate->format('Y-m-d'),
                'motivo_salida' => $slip->reason->value,
                'motivo_label' => $slip->reason->label(),
                'motivo_detalle' => $slip->reasonDetail,
                'fecha_autorizada' => $slip->authorizedDate->format('Y-m-d'),
                'hora_desde' => $slip->authorizedTime?->from,
                'hora_hasta' => $slip->authorizedTime?->until,
                'estado' => $slip->status->value,
                'estado_label' => $slip->status->label(),
                'apellidos_nombres' => $displayFullName,
                'designado' => $slip->designationSnapshot,
                'hora_salida' => $slip->exitTime, 'hora_retorno' => $slip->returnTime,
                'observaciones' => $slip->securityObservations,
                'aprobado_jefe_at' => $slip->approvedByHeadAt?->format(DATE_ATOM),
                'aprobado_rrhh_at' => $slip->approvedByHrAt?->format(DATE_ATOM),
            ],
        ]);
    }

    public function edit(string $id)
    {
        $slip = $this->repository->findById($id);
        if (! $slip) {
            abort(404);
        }

        Gate::authorize('update', \App\Models\ExitSlip::findOrFail($id));

        return Inertia::render('ExitSlips/Form', [
            'formatAvailable' => $this->hasAvailableExitSlipFormat(),
            'exitSlip' => [
                'id' => $slip->id,
                'codigo' => $slip->codigo,
                'solicitante' => $slip->fullNameSnapshot,
                'estado' => $slip->status->value,
                'estado_label' => $slip->status->label(),
                'tipo_plantilla' => $slip->templateType->value,
                'fecha_emision' => $slip->issueDate->format('Y-m-d'),
                'designado' => $slip->designationSnapshot,
                'motivo_salida' => $slip->reason->value,
                'motivo_detalle' => $slip->reasonDetail,
                'fecha_autorizada' => $slip->authorizedDate->format('Y-m-d'),
                'hora_desde' => $slip->authorizedTime?->from,
                'hora_hasta' => $slip->authorizedTime?->until,
            ],
        ]);
    }

    private function hasAvailableExitSlipFormat(): bool
    {
        return \App\Models\ExitSlipFormat::query()->where('is_active', true)->exists()
            || \App\Models\ExitSlipFormatSetting::current()->base_available;
    }

    public function update(Request $request, string $id, AuditLogger $audit)
    {
        return DB::transaction(function () use ($request, $id, $audit) {
            \App\Models\ExitSlip::whereKey($id)->lockForUpdate()->firstOrFail();
            $slip = $this->repository->findById($id);
            if (! $slip) {
                abort(404);
            }

            Gate::authorize('update', \App\Models\ExitSlip::findOrFail($id));

            $validated = $request->validate([
                'tipo_plantilla' => ['required', Rule::enum(ExitSlipTemplate::class)],
                'fecha_emision' => 'required|date',
                'designado' => 'required|string',
                'motivo_salida' => ['required', Rule::enum(ExitReason::class)],
                'motivo_detalle' => 'required|string|max:2000',
                'fecha_autorizada' => 'required|date',
                'hora_desde' => 'nullable|required_with:hora_hasta|date_format:H:i',
                'hora_hasta' => 'nullable|required_with:hora_desde|date_format:H:i|after:hora_desde',
            ]);

            $slipUser = User::find($slip->practitionerId);
            $currentFullName = $slipUser ? trim($slipUser->nombres.' '.$slipUser->apellidos) : $slip->fullNameSnapshot;

            $updatedSlip = new ExitSlip(
                $slip->id,
                $slip->codigo,
                $slip->practitionerId,
                ExitSlipTemplate::from($validated['tipo_plantilla']),
                new DateTimeImmutable($validated['fecha_emision']),
                $currentFullName,
                $validated['designado'],
                ExitReason::from($validated['motivo_salida']),
                $validated['motivo_detalle'],
                new DateTimeImmutable($validated['fecha_autorizada']),
                ! empty($validated['hora_desde']) ? new TimeRange($validated['hora_desde'], $validated['hora_hasta']) : null,
                $slip->status,
                $slip->assignedHeadId,
                $slip->approvedByHeadId,
                $slip->approvedByHeadAt,
                $slip->approvedByHrId,
                $slip->approvedByHrAt,
                $slip->practitionerSignaturePath,
                $slip->areaHeadSignaturePath,
                $slip->hrSignaturePath,
                $slip->lineManagerSignaturePath,
                $slip->exitTime,
                $slip->returnTime,
                $slip->securityObservations,
                $slip->supervisor,
                $slip->firmaVigilanciaPath,
                $slip->rejectionReason,
                $slip->finalPdfPath,
                $slip->createdAt
            );

            $this->repository->save($updatedSlip);

            $audit->record($request, 'exit_slip.updated', 'Papeleta actualizada por un administrador o su solicitante.', 'ExitSlip', $slip->id, [
                'codigo' => $slip->codigo,
                'estado' => $slip->status->value,
                'antes' => [
                    'designado' => $slip->designationSnapshot,
                    'motivo_salida' => $slip->reason->value,
                    'motivo_detalle' => $slip->reasonDetail,
                    'fecha_autorizada' => $slip->authorizedDate->format('Y-m-d'),
                ],
                'despues' => [
                    'designado' => $updatedSlip->designationSnapshot,
                    'motivo_salida' => $updatedSlip->reason->value,
                    'motivo_detalle' => $updatedSlip->reasonDetail,
                    'fecha_autorizada' => $updatedSlip->authorizedDate->format('Y-m-d'),
                ],
            ]);

            return redirect()->route('papeletas.show', $slip->codigo)->with('success', 'Papeleta actualizada.');
        });
    }

    public function destroy(Request $request, string $id, AuditLogger $audit)
    {
        return DB::transaction(function () use ($request, $id, $audit) {
            $slip = \App\Models\ExitSlip::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            Gate::authorize('delete', $slip);
            $audit->record($request, 'exit_slip.deleted', 'Papeleta eliminada por el administrador.', 'ExitSlip', $slip->id, [
                'codigo' => $slip->codigo,
                'estado' => $slip->estado->value,
                'solicitante' => $slip->apellidos_nombres,
            ]);
            $slip->delete();

            return redirect()->route('exit-slips.index')->with('success', 'Papeleta eliminada.');
        });
    }

    public function transition(Request $request, string $id, string $action, ExitSlipWorkflow $workflow)
    {
        abort_unless(in_array($action, ['submit', 'approve', 'submit_to_hr', 'submit_to_security', 'reject', 'revert', 'security'], true), 404);
        if ($action === 'security' && $request->input('hora_retorno') === '') {
            $request->merge(['hora_retorno' => null]);
        }
        $data = match ($action) {
            'reject' => $request->validate(['comentario' => 'required|string|max:2000']),
            'security' => $request->has('movimiento')
                ? $request->validate(['movimiento' => 'required|in:salida,retorno', 'observaciones' => 'nullable|string|max:2000'])
                : $request->validate([
                    'hora_salida' => 'required|date_format:H:i',
                    'hora_retorno' => 'nullable|date_format:H:i',
                    'observaciones' => 'nullable|string|max:2000',
                ]),
            default => [],
        };
        $workflow->execute($id, $request->user(), $action, $data);

        return back()->with('success', 'Papeleta actualizada correctamente.');
    }

    public function generatePdf(string $id)
    {
        $id = $this->resolveSlipId($id);
        $slip = $this->repository->findById($id);
        if (! $slip) {
            abort(404);
        }

        Gate::authorize('generatePdf', \App\Models\ExitSlip::findOrFail($id));

        $user = User::with('signature')->find($slip->practitionerId);
        $practitionerSignaturePath = $slip->practitionerSignaturePath;
        if (! $practitionerSignaturePath && in_array($slip->status->value, ['draft', 'submitted'])) {
            $user?->signature?->ensureFileExists();
            $practitionerSignaturePath = $user?->signature?->ruta_archivo;
        }

        $signatures = [
            'practicante' => $this->getSignatureBase64($practitionerSignaturePath),
            'jefe' => $this->getSignatureBase64($slip->areaHeadSignaturePath),
            'rrhh' => $this->getSignatureBase64($slip->hrSignaturePath),
            'vigilancia' => $this->getSignatureBase64($slip->firmaVigilanciaPath),
        ];

        $pdf = Pdf::loadView('pdf.exit-slip', [
            'slip' => $slip,
            'signatures' => $signatures,
            'user' => $user,
        ]);

        $pdf->setPaper('A4', 'landscape');
        $pdf->setOption('isRemoteEnabled', false);

        return request()->boolean('download')
            ? $pdf->download($slip->codigo.'.pdf')
            : $pdf->stream($slip->codigo.'.pdf');
    }

    private function resolveSlipId(string $reference): string
    {
        if (str_starts_with($reference, 'PAP-')) {
            return \App\Models\ExitSlip::query()->where('codigo', $reference)->firstOrFail()->id;
        }

        return $reference;
    }

    private function getSignatureBase64(?string $path): ?string
    {
        if (! $path || ! Storage::disk('private')->exists($path)) {
            return null;
        }
        $mime = Storage::disk('private')->mimeType($path);
        $content = base64_encode(Storage::disk('private')->get($path));

        return "data:$mime;base64,$content";
    }
}
