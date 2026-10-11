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
            'estado' => ['nullable', Rule::enum(ExitSlipStatus::class)],
            'fecha' => 'nullable|date_format:Y-m-d',
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
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('fecha')) {
            $query->whereDate('fecha_autorizada', $request->fecha);
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
            ];
        });

        return Inertia::render('ExitSlips/Index', [
            'exitSlips' => $items,
            'pagination' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'prev_page_url' => $page->previousPageUrl(), 'next_page_url' => $page->nextPageUrl()],
            'counts' => $counts, 'inTransit' => $inTransit, 'filters' => $request->only('q', 'estado', 'fecha'),
            'canCreate' => Gate::allows('create', \App\Models\ExitSlip::class),
        ]);
    }

    public function create()
    {
        Gate::authorize('create', \App\Models\ExitSlip::class);

        return Inertia::render('ExitSlips/Form');
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

        return redirect()->route('exit-slips.show', $slip->id)->with('success', 'Borrador creado.');
    }

    public function show(string $id)
    {
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
        foreach (['update', 'submit', 'approve', 'reject', 'revert', 'security', 'submit_to_hr', 'submit_to_security'] as $ability) {
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
            'exitSlip' => [
                'id' => $slip->id,
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

    public function update(Request $request, string $id)
    {
        return DB::transaction(function () use ($request, $id) {
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

            return redirect()->route('exit-slips.show', $id)->with('success', 'Borrador actualizado.');
        });
    }

    public function transition(Request $request, string $id, string $action, ExitSlipWorkflow $workflow)
    {
        abort_unless(in_array($action, ['submit', 'approve', 'submit_to_hr', 'submit_to_security', 'reject', 'revert', 'security'], true), 404);
        $data = match ($action) {
            'reject' => $request->validate(['comentario' => 'required|string|max:2000']),
            'security' => $request->validate([
                'hora_salida' => 'required|date_format:H:i',
                'hora_retorno' => 'nullable|date_format:H:i|after:hora_salida',
                'observaciones' => 'nullable|string|max:2000'
            ]),
            default => [],
        };
        $workflow->execute($id, $request->user(), $action, $data);

        return back()->with('success', 'Papeleta actualizada correctamente.');
    }

    public function generatePdf(string $id)
    {
        $slip = $this->repository->findById($id);
        if (! $slip) {
            abort(404);
        }

        Gate::authorize('generatePdf', \App\Models\ExitSlip::findOrFail($id));

        $user = User::with('signature')->find($slip->practitionerId);
        $practitionerSignaturePath = $slip->practitionerSignaturePath;
        if (! $practitionerSignaturePath && in_array($slip->status->value, ['draft', 'submitted'])) {
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

        return $pdf->stream($slip->codigo.'.pdf');
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
