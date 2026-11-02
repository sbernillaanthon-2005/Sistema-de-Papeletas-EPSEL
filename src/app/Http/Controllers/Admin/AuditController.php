<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Area;
use App\Models\CustomRole;
use App\Models\ExitSlipFormat;
use App\Models\ExitSlip;
use App\Models\ResponsibleHead;
use App\Models\User;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:120',
            'action' => 'nullable|string|max:80',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $query = AuditLog::query()->with('actor:id,nombres,apellidos,dni,rol')->latest('id');
        if ($request->filled('q')) {
            $term = '%'.addcslashes(trim((string) $filters['q']), '%_\\').'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('description', 'ilike', $term)
                    ->orWhere('action', 'ilike', $term)
                    ->orWhereHas('actor', fn ($actor) => $actor
                        ->where('nombres', 'ilike', $term)
                        ->orWhere('apellidos', 'ilike', $term)
                        ->orWhere('dni', 'ilike', $term));
            });
        }
        if ($request->filled('action')) {
            $query->where('action', $filters['action']);
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $filters['date']);
        }

        $logs = $query->paginate(20)->withQueryString();
        $subjectModels = [
            User::class => User::withTrashed()->whereIn('id', $logs->getCollection()->where('subject_type', User::class)->pluck('subject_id'))->get()->keyBy('id'),
            CustomRole::class => CustomRole::whereIn('id', $logs->getCollection()->where('subject_type', CustomRole::class)->pluck('subject_id'))->get()->keyBy('id'),
            ResponsibleHead::class => ResponsibleHead::whereIn('id', $logs->getCollection()->where('subject_type', ResponsibleHead::class)->pluck('subject_id'))->get()->keyBy('id'),
            Area::class => Area::whereIn('id', $logs->getCollection()->where('subject_type', Area::class)->pluck('subject_id'))->get()->keyBy('id'),
            'exit_slip_format' => ExitSlipFormat::whereIn('id', $logs->getCollection()->where('subject_type', 'exit_slip_format')->pluck('subject_id')->filter(fn ($id) => is_numeric($id)))->get()->keyBy('id'),
            'ExitSlip' => ExitSlip::whereIn('id', $logs->getCollection()->where('subject_type', 'ExitSlip')->pluck('subject_id'))->get()->keyBy('id'),
        ];
        $logs->through(function (AuditLog $log) use ($subjectModels) {
            $subject = ($subjectModels[$log->subject_type ?? ''] ?? null)?->get($log->subject_id);
            $subjectName = match ($log->subject_type) {
                User::class => $subject ? trim($subject->nombres.' '.$subject->apellidos) : ($log->metadata['nombre'] ?? $log->metadata['dni'] ?? null),
                CustomRole::class, ResponsibleHead::class, Area::class => $subject?->nombre ?? ($log->metadata['despues'] ?? $log->metadata['nombre'] ?? $log->metadata['antes'] ?? null),
                'exit_slip_format' => $subject?->name ?? ($log->metadata['name'] ?? null),
                'ExitSlip' => $subject?->codigo ?? ($log->metadata['codigo'] ?? null),
                default => $log->subject_id,
            };
            return [
            'id' => $log->id,
            'action' => $log->action,
            'description' => $log->description,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'subject_name' => $subjectName,
            'metadata' => $log->metadata,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'created_at' => $log->created_at->toIso8601String(),
            'actor' => $log->actor ? [
                'name' => trim($log->actor->nombres.' '.$log->actor->apellidos),
                'dni' => $log->actor->dni,
                    'role' => $log->actor->rol?->label() ?? 'Sin rol',
            ] : null,
            ];
        });

        return inertia('Admin/Audit/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'actions' => AuditLog::query()->distinct()->orderBy('action')->pluck('action')->values(),
            'summary' => [
                'total' => AuditLog::count(),
                'today' => AuditLog::whereDate('created_at', today('America/Lima'))->count(),
                'backups' => AuditLog::whereIn('action', ['backup.downloaded', 'backup.deleted'])->count(),
                'backupDownloads' => AuditLog::where('action', 'backup.downloaded')->count(),
                'backupDeletes' => AuditLog::where('action', 'backup.deleted')->count(),
            ],
        ]);
    }
}
